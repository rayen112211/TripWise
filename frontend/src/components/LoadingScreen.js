import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sparkles, MapPin, Palmtree, Coffee, Camera } from 'lucide-react';

const loadingSteps = [
    { percent: 0, text: "Mapping your adventure...", icon: MapPin },
    { percent: 25, text: "Finding hidden gems...", icon: Sparkles },
    { percent: 50, text: "Picking perfect spots...", icon: Camera },
    { percent: 75, text: "Almost ready...", icon: Palmtree },
    { percent: 95, text: "Just a moment more...", icon: Coffee },
];

const funFacts = [
    "🌍 Over 195 countries to explore!",
    "✈️ The first airline meal was served in 1919",
    "🗼 The Eiffel Tower grows 6 inches in summer",
    "🏖️ There are more than 10,000 beaches in Australia",
    "🍝 Italy has more UNESCO sites than any country",
    "🎭 Venice has over 400 bridges",
    "🌸 Japan has over 3,000 cherry blossom trees",
    "🦁 Tanzania hosts the Great Migration every year",
    "🏔️ Mount Everest grows 4mm every year",
    "🎨 Barcelona has 9 UNESCO World Heritage Sites"
];

export const LoadingScreen = ({ destination = "your destination" }) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentFact, setCurrentFact] = useState(funFacts[0]);

    useEffect(() => {
        // Progress animation - cap at 95% to prevent showing 100% while waiting for response
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95; // Cap at 95% until response arrives
                return prev + 1;
            });
        }, 400); // Reach 95% in ~38 seconds

        // Update step based on progress
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
                const nextStep = loadingSteps.findIndex(step => step.percent > progress);
                return nextStep === -1 ? loadingSteps.length - 1 : Math.max(0, nextStep - 1);
            });
        }, 100);

        // Rotate fun facts
        const factInterval = setInterval(() => {
            setCurrentFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
        }, 4000);

        return () => {
            clearInterval(interval);
            clearInterval(stepInterval);
            clearInterval(factInterval);
        };
    }, [progress]);

    const CurrentIcon = loadingSteps[currentStep]?.icon || Plane;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-secondary to-primary"
        >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-lg w-full mx-auto px-6 text-center">
                {/* Flying plane animation */}
                <motion.div
                    className="mb-8"
                    animate={{
                        x: [-100, 100],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                    }}
                >
                    <Plane className="w-16 h-16 text-white mx-auto" />
                </motion.div>

                {/* Destination */}
                <motion.h2
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                >
                    Building Your{' '}
                    <span className="bg-white/20 px-4 py-1 rounded-full">
                        {destination}
                    </span>{' '}
                    Trip
                </motion.h2>

                {/* Progress bar container */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
                    {/* Current step icon + text */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 mb-6"
                    >
                        <CurrentIcon className="w-6 h-6 text-accent" />
                        <p className="text-xl text-white font-medium">
                            {loadingSteps[currentStep]?.text}
                        </p>
                    </motion.div>

                    {/* Progress bar */}
                    <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent via-white to-accent rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                        {/* Shimmer effect */}
                        <motion.div
                            className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{
                                left: ['-20%', '120%'],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>

                    {/* Percentage */}
                    <p className="text-white/80 text-sm mt-3 font-medium">
                        {progress}% Complete
                    </p>
                </div>

                {/* Fun fact */}
                <motion.div
                    key={currentFact}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                    <p className="text-white/90 text-sm flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="font-medium">Did you know?</span>{' '}
                        {currentFact}
                    </p>
                </motion.div>

                {/* Floating decorations */}
                <div className="absolute top-10 left-10 opacity-20">
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Palmtree className="w-12 h-12 text-white" />
                    </motion.div>
                </div>
                <div className="absolute bottom-10 right-10 opacity-20">
                    <motion.div
                        animate={{
                            y: [0, 20, 0],
                            rotate: [0, -10, 10, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Camera className="w-12 h-12 text-white" />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
