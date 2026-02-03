import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { searchCities } from '@/data/cities';

export const DestinationAutocomplete = ({ value, onChange, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        onChange(query);

        if (query.length >= 2) {
            const results = searchCities(query);
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setHighlightedIndex(-1);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelectCity = (city) => {
        onChange(city.name);
        setIsOpen(false);
        setSuggestions([]);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSelectCity(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    const clearInput = () => {
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                    ref={inputRef}
                    id="destination"
                    data-testid="destination-input"
                    placeholder="Search destinations... (e.g., Paris, Tokyo)"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (value.length >= 2) {
                            const results = searchCities(value);
                            setSuggestions(results);
                            setIsOpen(results.length > 0);
                        }
                    }}
                    required={required}
                    className="h-14 text-lg rounded-xl pl-12 pr-12 shadow-soft focus:shadow-medium transition-shadow"
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        onClick={clearInput}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-hard border border-border overflow-hidden"
                    >
                        <div className="py-2">
                            {suggestions.map((city, index) => (
                                <motion.button
                                    key={`${city.name}-${city.country}`}
                                    type="button"
                                    onClick={() => handleSelectCity(city)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${highlightedIndex === index
                                            ? 'bg-primary/10'
                                            : 'hover:bg-muted'
                                        }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <span className="text-2xl">{city.icon}</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-foreground">
                                            {city.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span>{city.emoji}</span>
                                            <span>{city.country}</span>
                                        </p>
                                    </div>
                                    <MapPin className="w-5 h-5 text-primary" />
                                </motion.button>
                            ))}
                        </div>

                        {suggestions.length > 0 && (
                            <div className="px-4 py-2 bg-muted/30 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    Use ↑ ↓ arrows to navigate, Enter to select
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
