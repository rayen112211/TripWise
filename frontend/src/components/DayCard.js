import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Navigation, DollarSign, Sparkles, ExternalLink } from "lucide-react";

const ActivityItem = ({ activity, dayNum, actIndex, isLast }) => {
  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-secondary/30 to-transparent" />
      )}

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: actIndex * 0.1 }}
        className="relative bg-white rounded-2xl p-6 mb-4 shadow-soft hover:shadow-medium transition-all duration-300 border border-border card-hover"
        data-testid={`activity-${dayNum}-${actIndex}`}
      >
        {/* Time badge */}
        <div className="absolute -left-3 top-6 bg-secondary text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-medium">
          <Clock className="w-3 h-3" />
          {activity.time}
        </div>

        <div className="ml-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h4 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                {activity.name}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="font-medium">{activity.transport}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground bg-accent/20 px-3 py-1.5 rounded-full">
              <DollarSign className="w-4 h-4 text-accent-foreground" />
              <span className="font-bold text-accent-foreground">{activity.price}</span>
            </div>
          </div>

          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="sm"
              variant="outline"
              className="rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors group"
              data-testid={`map-link-${dayNum}-${actIndex}`}
            >
              <MapPin className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              View on Map
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </a>
        </div>
      </motion.div>
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
        isLast={i === activities.length - 1}
      />
    );
  }
  return items;
};

const renderTips = (tips) => {
  const items = [];
  for (let i = 0; i < tips.length; i++) {
    items.push(
      <motion.li
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-start gap-2 text-sm"
      >
        <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <span>{tips[i]}</span>
      </motion.li>
    );
  }
  return items;
};

export const DayCard = ({ day, dayIndex }) => {
  const activities = day.activities || [];
  const tips = day.daily_tips || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.15, duration: 0.5 }}
      data-testid={`day-${day.day}`}
    >
      <Card className="bg-gradient-to-br from-white to-muted/30 rounded-3xl shadow-hard border-0 overflow-hidden card-hover">
        {/* Day header with gradient */}
        <div className="relative bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient p-8">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                Day {day.day}
              </span>
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              {day.title}
            </h3>
          </div>
        </div>

        {/* Activities */}
        <div className="p-8">
          <div className="space-y-2">
            {renderActivities(activities, day.day)}
          </div>

          {/* Daily tips */}
          {tips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: activities.length * 0.1 + 0.2 }}
              className="mt-8 p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-2 border-accent/20"
            >
              <h5 className="font-bold text-foreground mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-accent" />
                Local Tips & Insights
              </h5>
              <ul className="space-y-3 text-muted-foreground">
                {renderTips(tips)}
              </ul>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

