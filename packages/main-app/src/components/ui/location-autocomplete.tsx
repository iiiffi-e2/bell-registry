import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  allowCustomInput?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

interface Suggestion {
  description: string;
  city: string;
  state: string;
  place_id: string;
}

export function LocationAutocomplete({
  value = '',
  onChange,
  error,
  placeholder = "Enter city and state...",
  allowCustomInput = true
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autocompleteService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!window.google?.maps?.places) return;
    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!autocompleteService.current || !inputValue) {
      setSuggestions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      {
        input: inputValue,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' },
      },
      (predictions: any[] | null) => {
        if (!predictions) {
          setSuggestions([]);
          return;
        }
        // Parse city and state from structured formatting
        const parsed = predictions.map((p) => {
          let city = '';
          let state = '';
          // Try to extract city and state from terms
          if (p.terms && p.terms.length >= 2) {
            city = p.terms[0].value;
            state = p.terms[1].value;
          }
          return {
            description: p.description,
            city,
            state,
            place_id: p.place_id,
          };
        }).filter((s) => s.city && s.state);
        setSuggestions(parsed);
      }
    );
  }, [inputValue]);

  // Handle selection
  const handleSelect = (suggestion: Suggestion) => {
    const formatted = `${suggestion.city}, ${suggestion.state}`;
    setInputValue(formatted);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    onChange(formatted);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleSelect(suggestions[activeIndex]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // If custom input is not allowed, only allow typing for search purposes
    // but don't update the actual value until a selection is made
    if (!allowCustomInput) {
      setInputValue(newValue);
      setShowDropdown(true);
      setActiveIndex(-1);
      // Don't call onChange here - only call it when a selection is made
      return;
    }
    
    setInputValue(newValue);
    setShowDropdown(true);
    setActiveIndex(-1);
    onChange(newValue);
  };

  // Hide dropdown on blur
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      // If custom input is not allowed and no valid selection was made, clear the input
      if (!allowCustomInput && !value) {
        setInputValue('');
      }
    }, 100);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={allowCustomInput ? inputValue : (value || inputValue)}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
          placeholder={placeholder}
          autoComplete="off"
        />
        <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg shadow-gray-200/60 max-h-60 overflow-auto">
            {suggestions.map((s, idx) => (
              <li
                key={s.place_id}
                className={`px-4 py-2 cursor-pointer select-none ${idx === activeIndex ? 'bg-blue-50' : ''}`}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="font-medium">{s.city}</span>
                <span className="text-gray-500">, {s.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
} 