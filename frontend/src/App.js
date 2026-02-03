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
  Download,
  Share2,
  ChevronRight,
  ChevronLeft,
  Globe2,
  Zap,
  Award,
  Clock
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
import { LoadingScreen } from "@/components/LoadingScreen";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Popular destinations for quick select
const popularDestinations = [
  { name: "Paris", flag: "🇫🇷", emoji: "🗼" },
  { name: "Tokyo", flag: "🇯🇵", emoji: "🗾" },
  { name: "Barcelona", flag: "🇪🇸", emoji: "🏖️" },
  { name: "New York", flag: "🇺🇸", emoji: "🗽" },
  { name: "Bali", flag: "🇮🇩", emoji: "🏝️" },
  { name: "London", flag: "🇬🇧", emoji: "🏰" },
];

// Interest pills
const interestOptions = [
  { label: "Museums", emoji: "🏛️" },
  { label: "Beaches", emoji: "🏖️" },
  { label: "Food & Dining", emoji: "🍕" },
  { label: "Nightlife", emoji: "🎉" },
  { label: "Nature", emoji: "🌳" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Art & Culture", emoji: "🎨" },
  { label: "Adventure", emoji: "⛰️" },
];

function App() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [formStep, setFormStep] = useState(1);

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

  const [selectedInterests, setSelectedInterests] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      handleInputChange('interests', newInterests.join(', '));
      return newInterests;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Checking backend connectivity...");
      try {
        await axios.get(`${API}/`, { timeout: 10000 });
        console.log("Backend connectivity test passed!");
      } catch (connErr) {
        console.error("Connectivity test failed:", connErr);
        alert(`Cannot reach Server: ${API}. Check your internet or wait 1 minute.`);
        setLoading(false);
        return;
      }

      console.log("Calling API:", `${API}/generate-itinerary`);
      const response = await axios.post(`${API}/generate-itinerary`, formData, {
        timeout: 120000
      });
      console.log("Response received:", response.data);
      setItinerary(response.data);
      setShowForm(false);
      setFormStep(1);
    } catch (error) {
      console.error("Full error object:", error);
      if (error.code === 'ECONNABORTED') {
        alert("The AI is taking a bit long (over 2 minutes). Please try again with a shorter prompt.");
      } else {
        const errorMsg = error.response?.data?.detail || "Failed to generate itinerary. Please try again.";
        alert(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadItinerary = () => {
    if (!itinerary) return;
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${itinerary.trip.destination}-itinerary.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareItinerary = () => {
    if (!itinerary) return;
    const text = `Check out my ${itinerary.trip.destination} trip plan made with TripWise!`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: `${itinerary.trip.destination} Trip`, text, url });
    } else {
      alert("Share via: WhatsApp, Email, or copy this link: " + url);
    }
  };

  const resetApp = () => {
    setItinerary(null);
    setShowForm(false);
    setFormStep(1);
    setSelectedInterests([]);
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

  const nextStep = () => {
    if (formStep < 3) setFormStep(formStep + 1);
  };

  const prevStep = () => {
    if (formStep > 1) setFormStep(formStep - 1);
  };

  const canProceedStep1 = formData.destination && formData.start_date && formData.end_date;
  const canProceedStep2 = formData.num_travelers > 0;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!showForm && !itinerary && !loading && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-secondary via-primary to-secondary"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '60px 60px',
              }} />
            </div>

            {/* Floating globe */}
            <motion.div
              className="absolute top-20 right-20 opacity-20"
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Globe2 className="w-64 h-64 text-white" />
            </motion.div>

            {/* Hero content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30"
                >
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-white font-medium">AI-Powered Travel Planning</span>
                  <Award className="w-5 h-5 text-accent" />
                </motion.div>

                {/* Main headline */}
                <h1 className="text-display text-white mb-6 tracking-tight">
                  Stop Googling.
                  <br />
                  <span className="text-accent">Start Traveling.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed max-w-3xl mx-auto font-light">
                  AI builds your complete itinerary—activities, food, transport—in{" "}
                  <span className="font-bold text-accent">30 seconds</span>.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-8 mb-12 text-white/80">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    <span>30-sec planning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    <span>195+ countries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span>100% personalized</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  data-testid="start-planning-btn"
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:-translate-y-1 hover:scale-105 rounded-full px-12 py-8 text-xl font-bold glow-primary"
                >
                  Build My Itinerary
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>

                {/* Popular destinations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-16"
                >
                  <p className="text-white/60 mb-4 text-sm uppercase tracking-wider">Popular Destinations</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {popularDestinations.map((dest) => (
                      <button
                        key={dest.name}
                        onClick={() => {
                          handleInputChange('destination', dest.name);
                          setShowForm(true);
                        }}
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2 rounded-full text-white font-medium transition-all border border-white/20 hover:border-white/40 hover:scale-105"
                      >
                        {dest.emoji} {dest.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {showForm && !itinerary && !loading && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen py-12 px-6"
          >
            <div className="max-w-2xl mx-auto">
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-center items-center gap-2 mb-4">
                  {[1, 2, 3].map((step) => (
                    <React.Fragment key={step}>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${formStep >= step
                          ? 'bg-primary text-white scale-110'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`h-1 w-12 rounded-full transition-all ${formStep > step ? 'bg-primary' : 'bg-muted'
                          }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-center text-muted-foreground">
                  Step {formStep} of 3
                </p>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-headline text-foreground mb-3">
                  {formStep === 1 && "Where & When?"}
                  {formStep === 2 && "Who's Traveling?"}
                  {formStep === 3 && "Customize Your Trip"}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {formStep === 1 && "Pick your dream destination"}
                  {formStep === 2 && "Tell us about your group"}
                  {formStep === 3 && "Add preferences & special requests"}
                </p>
              </div>

              <Card className="bg-white rounded-3xl shadow-2xl border-0 p-8 card-hover">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {/* STEP 1: Where & When */}
                    {formStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <Label htmlFor="destination" className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Destination
                          </Label>
                          <Input
                            id="destination"
                            data-testid="destination-input"
                            placeholder="e.g., Paris, Tokyo, Barcelona"
                            value={formData.destination}
                            onChange={(e) => handleInputChange('destination', e.target.value)}
                            required
                            className="h-14 text-lg rounded-xl shadow-soft focus:shadow-medium transition-shadow"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_date" className="text-lg font-semibold mb-3 flex items-center gap-2">
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
                              className="h-14 text-lg rounded-xl shadow-soft"
                            />
                          </div>
                          <div>
                            <Label htmlFor="end_date" className="text-lg font-semibold mb-3 flex items-center gap-2">
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
                              className="h-14 text-lg rounded-xl shadow-soft"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Who's Traveling */}
                    {formStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <Label htmlFor="num_travelers" className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            How many people?
                          </Label>
                          <Input
                            id="num_travelers"
                            data-testid="num-travelers-input"
                            type="number"
                            min="1"
                            value={formData.num_travelers}
                            onChange={(e) => handleInputChange('num_travelers', parseInt(e.target.value))}
                            required
                            className="h-14 text-lg rounded-xl shadow-soft"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-semibold mb-3 block">
                            Traveler Type
                          </Label>
                          <Select
                            value={formData.traveler_type}
                            onValueChange={(value) => handleInputChange('traveler_type', value)}
                          >
                            <SelectTrigger data-testid="traveler-type-select" className="h-14 text-lg rounded-xl shadow-soft">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solo">✈️ Solo Traveler</SelectItem>
                              <SelectItem value="couple">💑 Couple</SelectItem>
                              <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                              <SelectItem value="group">👥 Group</SelectItem>
                              <SelectItem value="digital nomad">💻 Digital Nomad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-lg font-semibold mb-3 block">
                            Travel Vibe
                          </Label>
                          <Select
                            value={formData.travel_style}
                            onValueChange={(value) => handleInputChange('travel_style', value)}
                          >
                            <SelectTrigger data-testid="travel-style-select" className="h-14 text-lg rounded-xl shadow-soft">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relaxed">🏖️ Relaxed</SelectItem>
                              <SelectItem value="packed">⚡ Packed with Activities</SelectItem>
                              <SelectItem value="foodie">🍕 Foodie</SelectItem>
                              <SelectItem value="adventure">⛰️ Adventure</SelectItem>
                              <SelectItem value="party">🎉 Party</SelectItem>
                              <SelectItem value="halal">🕌 Halal-Friendly</SelectItem>
                              <SelectItem value="budget">💰 Budget</SelectItem>
                              <SelectItem value="luxury">✨ Luxury</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Customize */}
                    {formStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <Label htmlFor="budget" className="text-lg font-semibold mb-3 flex items-center gap-2">
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
                            className="h-14 text-lg rounded-xl shadow-soft"
                          />
                        </div>

                        <div>
                          <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-primary" />
                            What do you love?
                          </Label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {interestOptions.map((interest) => (
                              <button
                                key={interest.label}
                                type="button"
                                onClick={() => toggleInterest(interest.label)}
                                className={`px-4 py-2 rounded-full font-medium transition-all ${selectedInterests.includes(interest.label)
                                    ? 'bg-primary text-white shadow-medium scale-105'
                                    : 'bg-muted text-foreground hover:bg-primary/10'
                                  }`}
                              >
                                {interest.emoji} {interest.label}
                              </button>
                            ))}
                          </div>
                          <Textarea
                            data-testid="interests-input"
                            placeholder="Or type your own interests..."
                            value={formData.interests}
                            onChange={(e) => handleInputChange('interests', e.target.value)}
                            className="min-h-20 text-lg rounded-xl shadow-soft"
                          />
                        </div>

                        <div>
                          <Label htmlFor="special_requests" className="text-lg font-semibold mb-3">
                            Anything else?
                          </Label>
                          <Textarea
                            id="special_requests"
                            data-testid="special-requests-input"
                            placeholder="e.g., wheelchair accessible, vegan restaurants, pet-friendly"
                            value={formData.special_requests}
                            onChange={(e) => handleInputChange('special_requests', e.target.value)}
                            className="min-h-24 text-lg rounded-xl shadow-soft"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation buttons */}
                  <div className="flex gap-4 pt-6">
                    {formStep > 1 && (
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="flex-1 h-14 text-lg rounded-full border-2 hover:bg-muted"
                      >
                        <ChevronLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                    )}

                    {formStep === 1 && (
                      <Button
                        type="button"
                        onClick={() => setShowForm(false)}
                        variant="outline"
                        className="flex-1 h-14 text-lg rounded-full border-2"
                      >
                        Cancel
                      </Button>
                    )}

                    {formStep < 3 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={(formStep === 1 && !canProceedStep1) || (formStep === 2 && !canProceedStep2)}
                        className="flex-1 h-14 text-lg rounded-full bg-primary hover:bg-primary/90 glow-primary"
                      >
                        Continue
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-14 text-lg rounded-full bg-primary hover:bg-primary/90 animate-pulse-glow"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate My Trip
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </div>
          </motion.div>
        )}

        {loading && <LoadingScreen destination={formData.destination} />}

        {itinerary && (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen py-12 px-6 bg-gradient-to-br from-background via-muted/30 to-background"
          >
            <div className="max-w-5xl mx-auto">
              {/* Header with enhanced design */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block bg-gradient-to-r from-primary to-secondary px-6 py-2 rounded-full mb-4"
                >
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Your trip is ready!
                  </p>
                </motion.div>

                <h2 className="text-headline text-foreground mb-4">
                  {itinerary.trip.destination}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {itinerary.trip.dates} • {itinerary.trip.travelers} travelers • {itinerary.trip.travel_style} style
                </p>

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={shareItinerary}
                    variant="outline"
                    className="rounded-full shadow-soft hover:shadow-medium"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Trip
                  </Button>
                  <Button
                    onClick={downloadItinerary}
                    variant="outline"
                    className="rounded-full shadow-soft hover:shadow-medium"
                    data-testid="download-itinerary-btn"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download
                  </Button>
                  <Button
                    onClick={resetApp}
                    className="rounded-full bg-primary hover:bg-primary/90 glow-primary"
                    data-testid="plan-another-btn"
                  >
                    <Plane className="mr-2 h-5 w-5" />
                    Plan Another Trip
                  </Button>
                </div>
              </div>

              {/* Days Timeline */}
              <div className="space-y-8">
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
