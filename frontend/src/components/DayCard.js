import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Navigation, DollarSign, Sparkles } from "lucide-react";

const ActivityItem = ({ activity, dayNum, actIndex }) => {
  return (
    <div 
      className="border-l-4 border-secondary pl-6 py-2"
      data-testid={`activity-${dayNum}-${actIndex}`}
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-foreground mb-2">
            {activity.name}
          </h4>
          <p className="text-muted-foreground mb-3 leading-relaxed">
            {activity.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{activity.time}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Navigation className="w-4 h-4" />
              <span>{activity.transport}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{activity.price}</span>
            </div>
          </div>
        </div>
        <a
          href={activity.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button 
            size="sm" 
            variant="outline"
            className="rounded-full"
            data-testid={`map-link-${dayNum}-${actIndex}`}
          >
            <MapPin className="mr-2 h-4 w-4" />
            View on Map
          </Button>
        </a>
      </div>
    </div>
  );
};

const renderActivities = (activities, dayNum) => {
  const items = [];
  for (let i = 0; i < activities.length; i++) {
    items.push(
      <ActivityItem 
        key={i}
        activity={activities[i]}
        dayNum={dayNum}
        actIndex={i}
      />
    );
  }
  return items;
};

const renderTips = (tips) => {
  const items = [];
  for (let i = 0; i < tips.length; i++) {
    items.push(
      <li key={i} className="text-sm">
        • {tips[i]}
      </li>
    );
  }
  return items;
};

export const DayCard = ({ day, dayIndex }) => {
  const activities = day.activities || [];
  const tips = day.daily_tips || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: dayIndex * 0.1 }}
      data-testid={`day-${day.day}`}
    >
      <Card className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent-yellow p-6">
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            Day {day.day}: {day.title}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {renderActivities(activities, day.day)}

          {tips.length > 0 && (
            <div className="mt-6 p-4 bg-accent-yellow/10 rounded-xl">
              <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-yellow" />
                Daily Tips
              </h5>
              <ul className="space-y-1 text-muted-foreground">
                {renderTips(tips)}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
