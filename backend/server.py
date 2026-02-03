from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import google.generativeai as genai
import asyncio
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JSON Repair Helper
def repair_json_string(text: str) -> str:
    """Fix common JSON issues from AI responses"""
    # Remove BOM
    text = text.strip().replace('\ufeff', '')
    
    # Fix smart quotes
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace("'", "'").replace("'", "'")
    
    # Remove control chars (except \n, \t, \r)
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', text)
    
    # Fix unescaped quotes in values (simple heuristic)
    # Replace ' with escaped ' in string values
    text = re.sub(r'(["\'])(.*?)\1', lambda m: m.group(1) + m.group(2).replace('"', '\\"') + m.group(1), text)
    
    return text

# MongoDB connection with SSL/handshake fixes for cloud environments
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    tlsAllowInvalidCertificates=True # Helps with some cloud handshake issues
)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for Trip Planning
class Activity(BaseModel):
    name: str
    time: str
    description: str
    link: str
    transport: str
    price: str

class Day(BaseModel):
    day: int
    title: str
    activities: List[Activity]
    daily_tips: List[str]

class Trip(BaseModel):
    destination: str
    dates: str
    travelers: int
    traveler_type: str
    travel_style: str
    budget: str
    days: List[Day]

class ItineraryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    app_name: str = "TripWise"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip: Trip
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TripRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    num_travelers: int
    traveler_type: str
    travel_style: str
    budget: str
    interests: str
    special_requests: Optional[str] = ""


# Legacy Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "TripWise API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary(request: TripRequest):
    """
    Generate a personalized travel itinerary using Google Gemini AI
    """
    try:
        # Get GEMINI_API_KEY from environment
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Dynamically find an available model that supports generation
        model = None
        last_error = ""
        available_names = []
        
        try:
            logging.info("Listing available Gemini models...")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_names.append(m.name)
            
            logging.info(f"Available models found: {available_names}")
            
            # Prefer 1.5 variants, then 1.0, then any
            priority_names = [
                'models/gemini-1.5-flash', 
                'models/gemini-1.5-flash-latest',
                'models/gemini-1.5-pro',
                'models/gemini-1.5-pro-latest',
                'models/gemini-1.0-pro'
            ]
            
            selected_name = None
            for p in priority_names:
                if p in available_names:
                    selected_name = p
                    break
            
            if not selected_name and available_names:
                selected_name = available_names[0]
                
            if selected_name:
                # Use safety settings to prevent blocking
                safety_settings = [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
                model = genai.GenerativeModel(selected_name, safety_settings=safety_settings)
                logging.info(f"Selected model with safety settings: {selected_name}")
            else:
                last_error = f"No models supporting generateContent found. Available: {available_names}"
        except Exception as list_err:
            logging.error(f"Failed to list models: {list_err}")
            # Fallback
            try:
                selected_name = 'models/gemini-1.5-flash'
                safety_settings = [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
                model = genai.GenerativeModel(selected_name, safety_settings=safety_settings)
                logging.info(f"Fallback to model with safety: {selected_name}")
            except Exception as final_err:
                last_error = f"ListModels failed: {list_err}. Fallback failed: {final_err}"
                model = None
        
        if not model:
            raise HTTPException(status_code=500, detail=f"Gemini Configuration Error: {last_error}")
        
        logging.info(f"Generating itinerary for {request.destination}...")
        # STRICT JSON prompt - emphasize valid syntax
        prompt = f"""Create a travel itinerary for {request.destination} from {request.start_date} to {request.end_date}.
{request.num_travelers} {request.traveler_type}. Style: {request.travel_style}. Budget: €{request.budget}. Interests: {request.interests}.

CRITICAL: Return ONLY valid JSON. No markdown, no text before/after. Ensure all commas are correct, no trailing commas.

{{
  "app_name": "TripWise",
  "trip": {{
    "destination": "{request.destination}",
    "dates": "{request.start_date} - {request.end_date}",
    "travelers": {request.num_travelers},
    "traveler_type": "{request.traveler_type}",
    "travel_style": "{request.travel_style}",
    "budget": "{request.budget}",
    "days": [
      {{
        "day": 1,
        "title": "Day Title",
        "activities": [
          {{
            "name": "Activity Name",
            "time": "HH:MM - HH:MM",
            "description": "Short description",
            "link": "https://maps.google.com",
            "transport": "Walking",
            "price": "€XX"
          }}
        ],
        "daily_tips": ["tip 1", "tip 2"]
      }}
    ]
  }}
}}

REMEMBER: Use commas between array items, NO comma after last item. All strings in quotes."""

        logging.info("Calling Gemini API with speed optimizations...")
        # Get response from Gemini with balanced limits
        try:
            # Balanced: Fast but allows complete JSON response
            generation_config = {
                "max_output_tokens": 1800,  # Enough for complete JSON, still fast
                "temperature": 0.8,  # Good creativity/speed balance
            }
            response = await model.generate_content_async(
                prompt,
                generation_config=generation_config
            )
            if not response.parts:
                block_reason = getattr(response.prompt_feedback, 'block_reason_message', 'Blocked')
                raise HTTPException(status_code=500, detail=f"Blocked: {block_reason}")
            response_text = response.text.strip()
        except Exception as e:
            logging.error(f"Gemini error: {e}")
            raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
        
        logging.info("AI response received, parsing...")
        logging.info(f"Raw response length: {len(response_text)} chars")
        
        # Clean response - remove markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[-1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].strip() if response_text.count("```") >= 2 else response_text
        
        # Remove any leading/trailing text outside JSON
        if "{" in response_text:
            start = response_text.index("{")
            response_text = response_text[start:]
        if response_text.rfind("}") != -1:
            end = response_text.rfind("}") + 1
            response_text = response_text[:end]
        
        # Apply JSON repair to fix common issues
        response_text = repair_json_string(response_text)
        
        try:
            itinerary_data = json.loads(response_text)
            if "trip" not in itinerary_data:
                if "itinerary" in itinerary_data: 
                    itinerary_data["trip"] = itinerary_data["itinerary"]
                else: 
                    raise KeyError("missing trip key")
        except Exception as parse_error:
            logging.error(f"JSON Parse error: {parse_error}")
            logging.error(f"AI response was: {response_text[:500]}...")  # Log first 500 chars
            raise HTTPException(status_code=500, detail=f"Invalid AI structure: {str(parse_error)}")
        
        try:
            itinerary = ItineraryResponse(trip=Trip(**itinerary_data["trip"]))
            # Async save to DB with timeout
            try:
                doc = itinerary.model_dump(mode='json')
                # Don't let DB hang the whole request, give it 5s
                await asyncio.wait_for(db.itineraries.insert_one(doc), timeout=5.0)
            except Exception as db_e:
                logging.warning(f"DB insertion failed (non-critical): {db_e}")
            
            return itinerary
        except Exception as e:
            logging.error(f"Processing error: {e}")
            raise HTTPException(status_code=500, detail="AI Logic or Data Error")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Global error in generate_itinerary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@api_router.get("/itineraries", response_model=List[ItineraryResponse])
async def get_itineraries():
    """Get all saved itineraries"""
    itineraries = await db.itineraries.find({}, {"_id": 0}).to_list(100)
    
    for itinerary in itineraries:
        if isinstance(itinerary['created_at'], str):
            itinerary['created_at'] = datetime.fromisoformat(itinerary['created_at'])
    
    return itineraries


# Include the router in the main app
app.include_router(api_router)

# CORS must be after router for some cases, and allow_credentials=True + origin='*' is not allowed by browsers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()