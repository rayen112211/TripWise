import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Heart, 
  Sparkles,
  Loader2,
  Download
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DayCard } from "@/components/DayCard";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  
  const [formData, setFormData] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    num_travelers: 2,
    traveler_type: "couple",
    travel_style: "relaxed",
    budget: "",
    interests: "",
    special_requests: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/generate-itinerary`, formData);
      setItinerary(response.data);
      setShowForm(false);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert("Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadItinerary = () => {
    if (!itinerary) return;
    
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${itinerary.trip.destination}-itinerary.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetApp = () => {
    setItinerary(null);
    setShowForm(false);
    setFormData({
      destination: "",
      start_date: "",
      end_date: "",
      num_travelers: 2,
      traveler_type: "couple",
      travel_style: "relaxed",
      budget: "",
      interests: "",
      special_requests: ""
    });
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!showForm && !itinerary && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Hero Background */}
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1631535152690-ba1a85229136?crop=entropy&cs=srgb&fm=jpg&q=85')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent-yellow/20 to-secondary/30" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Sparkles className="w-12 h-12 text-accent-yellow" />
                  <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                    TripWise
                  </h1>
                  <Plane className="w-12 h-12 text-primary" />
                </div>
                
                <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
                  Your personal AI travel planner. Get a complete, day-by-day itinerary 
                  tailored to your style, budget, and interests in seconds.
                </p>

                <Button
                  data-testid="start-planning-btn"
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1 rounded-full px-12 py-8 text-xl font-medium"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Start Planning Your Trip
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {showForm && !itinerary && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen py-12 px-6"
          >
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Plan Your Perfect Trip
                </h2>
                <p className="text-lg text-muted-foreground">
                  Fill in the details and let AI create your personalized itinerary
                </p>
              </div>

              <Card className="bg-white rounded-2xl shadow-xl border-0 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Destination */}
                  <div>
                    <Label htmlFor="destination" className="text-base font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Where do you want to go?
                    </Label>
                    <Input
                      id="destination"
                      data-testid="destination-input"
                      placeholder="e.g., Paris, Tokyo, New York"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      required
                      className="h-14 text-lg rounded-xl"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-base font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Start Date
                      </Label>
                      <Input
                        id="start_date"
                        data-testid="start-date-input"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        required
                        className="h-14 text-lg rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date" className="text-base font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        End Date
                      </Label>
                      <Input
                        id="end_date"
                        data-testid="end-date-input"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        required
                        className="h-14 text-lg rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Number of Travelers */}
                  <div>
                    <Label htmlFor="num_travelers" className="text-base font-medium mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Number of Travelers
                    </Label>
                    <Input
                      id="num_travelers"
                      data-testid="num-travelers-input"
                      type="number"
                      min="1"
                      value={formData.num_travelers}
                      onChange={(e) => handleInputChange('num_travelers', parseInt(e.target.value))}
                      required
                      className="h-14 text-lg rounded-xl"
                    />
                  </div>

                  {/* Traveler Type */}
                  <div>
                    <Label htmlFor="traveler_type" className="text-base font-medium mb-2">
                      Traveler Type
                    </Label>
                    <Select 
                      value={formData.traveler_type} 
                      onValueChange={(value) => handleInputChange('traveler_type', value)}
                    >
                      <SelectTrigger data-testid="traveler-type-select" className="h-14 text-lg rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="couple">Couple</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="digital nomad">Digital Nomad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Travel Style */}
                  <div>
                    <Label htmlFor="travel_style" className="text-base font-medium mb-2">
                      Travel Style
                    </Label>
                    <Select 
                      value={formData.travel_style} 
                      onValueChange={(value) => handleInputChange('travel_style', value)}
                    >
                      <SelectTrigger data-testid="travel-style-select" className="h-14 text-lg rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="foodie">Foodie</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="halal">Halal</SelectItem>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div>
                    <Label htmlFor="budget" className="text-base font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Total Budget (in euros)
                    </Label>
                    <Input
                      id="budget"
                      data-testid="budget-input"
                      placeholder="e.g., 2000"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      required
                      className="h-14 text-lg rounded-xl"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <Label htmlFor="interests" className="text-base font-medium mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Interests
                    </Label>
                    <Textarea
                      id="interests"
                      data-testid="interests-input"
                      placeholder="e.g., museums, beaches, football, hiking, nightlife, food markets"
                      value={formData.interests}
                      onChange={(e) => handleInputChange('interests', e.target.value)}
                      required
                      className="min-h-24 text-lg rounded-xl"
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <Label htmlFor="special_requests" className="text-base font-medium mb-2">
                      Special Requests (Optional)
                    </Label>
                    <Textarea
                      id="special_requests"
                      data-testid="special-requests-input"
                      placeholder="e.g., wheelchair accessible, vegan restaurants, pet-friendly"
                      value={formData.special_requests}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      className="min-h-24 text-lg rounded-xl"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1 h-14 text-lg rounded-full border-2"
                      data-testid="back-btn"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 text-lg rounded-full bg-primary hover:bg-primary/90"
                      data-testid="generate-itinerary-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Itinerary
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </motion.div>
        )}

        {itinerary && (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen py-12 px-6"
          >
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Your {itinerary.trip.destination} Adventure
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {itinerary.trip.dates} • {itinerary.trip.travelers} travelers • {itinerary.trip.travel_style} style
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={downloadItinerary}
                    variant="outline"
                    className="rounded-full"
                    data-testid="download-itinerary-btn"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download JSON
                  </Button>
                  <Button
                    onClick={resetApp}
                    className="rounded-full bg-primary hover:bg-primary/90"
                    data-testid="plan-another-btn"
                  >
                    Plan Another Trip
                  </Button>
                </div>
              </div>

              {/* Days Timeline */}
              <div className="space-y-12">
                {(() => {
                  const dayCards = [];
                  const days = itinerary.trip.days || [];
                  for (let i = 0; i < days.length; i++) {
                    dayCards.push(<DayCard key={days[i].day} day={days[i]} dayIndex={i} />);
                  }
                  return dayCards;
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
