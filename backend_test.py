import requests
import sys
import json
from datetime import datetime

class TripWiseAPITester:
    def __init__(self, base_url="https://voyager-plan-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test GET status
        success1, _ = self.run_test("Get Status Checks", "GET", "status", 200)
        
        # Test POST status
        test_data = {"client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"}
        success2, response = self.run_test("Create Status Check", "POST", "status", 200, data=test_data)
        
        return success1 and success2

    def test_generate_itinerary(self):
        """Test the main itinerary generation endpoint"""
        test_data = {
            "destination": "Paris, France",
            "start_date": "2025-09-01",
            "end_date": "2025-09-03",
            "num_travelers": 2,
            "traveler_type": "couple",
            "travel_style": "relaxed",
            "budget": "1500",
            "interests": "museums, cafes, romantic walks, art galleries",
            "special_requests": "vegetarian restaurants preferred"
        }
        
        print(f"   Test data: {json.dumps(test_data, indent=2)}")
        
        # Use longer timeout for AI generation
        success, response = self.run_test(
            "Generate Itinerary (AI)", 
            "POST", 
            "generate-itinerary", 
            200, 
            data=test_data,
            timeout=60
        )
        
        if success and response:
            # Validate response structure
            required_fields = ['app_name', 'id', 'trip', 'created_at']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ Response missing fields: {missing_fields}")
                return False
            
            # Validate app_name
            if response.get('app_name') != 'TripWise':
                print(f"❌ Expected app_name 'TripWise', got '{response.get('app_name')}'")
                return False
            print(f"✅ App name validated: {response.get('app_name')}")
            
            # Validate trip structure
            trip = response.get('trip', {})
            trip_fields = ['destination', 'dates', 'travelers', 'days']
            missing_trip_fields = [field for field in trip_fields if field not in trip]
            
            if missing_trip_fields:
                print(f"❌ Trip missing fields: {missing_trip_fields}")
                return False
            
            # Validate days structure
            days = trip.get('days', [])
            if not days:
                print(f"❌ No days found in itinerary")
                return False
            
            print(f"✅ Itinerary generated with {len(days)} days")
            
            # Check first day structure
            first_day = days[0]
            day_fields = ['day', 'title', 'activities', 'daily_tips']
            missing_day_fields = [field for field in day_fields if field not in first_day]
            
            if missing_day_fields:
                print(f"❌ Day missing fields: {missing_day_fields}")
                return False
            
            # Check activities structure
            activities = first_day.get('activities', [])
            if activities:
                first_activity = activities[0]
                activity_fields = ['name', 'time', 'description', 'link', 'transport', 'price']
                missing_activity_fields = [field for field in activity_fields if field not in first_activity]
                
                if missing_activity_fields:
                    print(f"❌ Activity missing fields: {missing_activity_fields}")
                    return False
                
                print(f"✅ Activities structure validated - {len(activities)} activities on day 1")
            
            return True
        
        return success

    def test_get_itineraries(self):
        """Test getting all saved itineraries"""
        return self.run_test("Get All Itineraries", "GET", "itineraries", 200)

def main():
    print("🚀 Starting TripWise API Tests")
    print("=" * 60)
    
    tester = TripWiseAPITester()
    
    # Test basic endpoints first
    print("\n📋 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_status_endpoints()
    tester.test_get_itineraries()
    
    # Test main functionality
    print("\n🤖 Testing AI Itinerary Generation...")
    ai_success = tester.test_generate_itinerary()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if ai_success:
        print("✅ AI Integration: Working correctly")
    else:
        print("❌ AI Integration: Failed - Check EMERGENT_LLM_KEY and OpenAI GPT-5.2 access")
    
    print("=" * 60)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())