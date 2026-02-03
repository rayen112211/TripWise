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
from openai import AsyncOpenAI


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
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
    return {"message": "WanderLust AI Travel Planner API"}

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
    Generate a personalized travel itinerary using OpenAI GPT-5.2
    """
    try:
        # Get OPENAI_API_KEY from environment
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
        # Create the prompt for the AI - enhanced for TripWise quality
        prompt = f"""You are an expert travel planner and editor for the mobile app TripWise. Your goal is to create an amazing, personalized travel itinerary.

Destination: {request.destination}
Dates: {request.start_date} to {request.end_date}
Travelers: {request.num_travelers} {request.traveler_type}
Travel Style: {request.travel_style}
Budget: {request.budget} euros total
Interests: {request.interests}
{f'Special Requests: {request.special_requests}' if request.special_requests else ''}

**Your Instructions:**
1. Create clear, concise, and engaging activity descriptions. Use friendly language like "You'll love...", "Don't miss...", "A local favorite!".
2. Add detailed transport instructions (walking, taxi, metro) with approximate time between locations.
3. Include local tips, hidden gems, and food recommendations to make it feel personalized.
4. Adjust timing and pacing based on the travel style (relaxed = fewer activities, adventurous = more packed).
5. If there are special requests (vegan, halal, accessibility, family-friendly), incorporate them throughout.
6. Suggest optional activities if extra time is available.
7. Include 3-4 activities per day matching the travel style and budget.

Return ONLY valid JSON (no markdown) in this exact structure:
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
        "title": "A catchy, engaging title for the day",
        "activities": [
          {{
            "name": "Activity name",
            "time": "HH:MM - HH:MM",
            "description": "Engaging description with personality. Example: 'You'll love the stunning views from here!'",
            "link": "https://maps.google.com/?q=Location+Name",
            "transport": "Walk 5 min from previous location",
            "price": "€XX per person"
          }}
        ],
        "daily_tips": [
          "Local tip or hidden gem",
          "Food recommendation",
          "Optional activity if time permits"
        ]
      }}
    ]
  }}
}}"""

        # Initialize OpenAI client
        openai_client = AsyncOpenAI(api_key=api_key)
        
        # Get response from AI
        completion = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert travel planner for TripWise. Create engaging, personalized itineraries with a friendly, helpful tone. Return only valid JSON responses."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        response = completion.choices[0].message.content
        
        # Parse the JSON response
        # Clean the response if it has markdown formatting
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "").strip()
        
        try:
            itinerary_data = json.loads(response_text)
        except json.JSONDecodeError as parse_error:
            logging.error(f"Failed to parse AI response: {parse_error}")
            logging.error(f"Raw response: {response_text[:500]}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON format")
        
        # Create ItineraryResponse object
        itinerary = ItineraryResponse(trip=Trip(**itinerary_data["trip"]))
        
        # Save to database
        doc = itinerary.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['trip'] = itinerary_data["trip"]
        
        await db.itineraries.insert_one(doc)
        
        return itinerary
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logging.error(f"JSON parsing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logging.error(f"Error generating itinerary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")


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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
