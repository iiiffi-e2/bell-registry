import { useEffect, useRef, useState } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface MultiLocationAutocompleteProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
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

export function MultiLocationAutocomplete({
  value = [],
  onChange,
  error,
  placeholder = "Enter city and state..."
}: MultiLocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const autocompleteService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        }).filter((s) => s.city && s.state && !value.includes(`${s.city}, ${s.state}`));
        setSuggestions(parsed);
      }
    );
  }, [inputValue, value]);

  // Handle selection
  const handleSelect = (suggestion: Suggestion) => {
    const formatted = `${suggestion.city}, ${suggestion.state}`;
    if (!value.includes(formatted)) {
      onChange([...value, formatted]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
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
    setInputValue(e.target.value);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  // Remove a selected location
  const handleRemove = (loc: string) => {
    onChange(value.filter((v) => v !== loc));
    inputRef.current?.focus();
  };

  // Hide dropdown on blur
  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 100);
  };

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-2 p-1 border rounded-md border-gray-300 bg-white min-h-[38px] focus-within:border-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((loc) => (
          <span
            key={loc}
            className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
          >
            {loc}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(loc);
              }}
              className="ml-1 text-blue-600 hover:text-blue-800"
              tabIndex={-1}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
        <div className="flex-1 flex items-center min-w-[120px]">
          <MapPinIcon className="h-5 w-5 text-gray-400 mr-1" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="border-0 p-1 text-sm focus:ring-0 flex-1 min-w-[80px] bg-transparent outline-none"
            placeholder={value.length === 0 ? placeholder : "Add more..."}
            autoComplete="off"
          />
        </div>
      </div>
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
} 