/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SKILLS_CATEGORIES, SKILL_TO_CATEGORY } from "@/data/skills-tags";

interface SkillsComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export function SkillsCombobox({ 
  value, 
  onChange, 
  placeholder = "Search and select skills...",
  maxSelections = 10 
}: SkillsComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter skills based on query and exclude already selected ones
  const getFilteredSkills = () => {
    const filteredCategories = SKILLS_CATEGORIES.map(category => ({
      ...category,
      skills: category.skills.filter(skill => 
        !value.includes(skill) && 
        (query === "" || skill.toLowerCase().includes(query.toLowerCase()))
      )
    })).filter(category => category.skills.length > 0);

    return filteredCategories;
  };

  const handleSelect = (selectedSkill: string) => {
    // Prevent blank entries
    if (!selectedSkill || selectedSkill.trim() === "") return;
    
    if (!value.includes(selectedSkill) && value.length < maxSelections) {
      onChange([...value, selectedSkill]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (skillToRemove: string) => {
    onChange(value.filter(v => v !== skillToRemove));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const filteredCategories = getFilteredSkills();

  return (
    <div className="relative" ref={containerRef}>
      <Combobox as="div" value={query} onChange={handleSelect}>
        <div 
          className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-300 bg-white min-h-[42px] cursor-text"
          onClick={() => {
            inputRef.current?.focus();
            setIsOpen(true);
          }}
        >
          {/* Selected Skills */}
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-blue-100 text-blue-800 group"
              title={`Category: ${SKILL_TO_CATEGORY[skill]}`}
            >
              {skill}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(skill);
                }}
                className="ml-1.5 text-blue-600 hover:text-blue-800 group-hover:text-blue-900"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
          
          {/* Input Field */}
          <Combobox.Input
            ref={inputRef}
            className="border-0 p-1 text-sm focus:ring-0 focus:outline-none flex-1 min-w-[140px] bg-transparent"
            placeholder={value.length === 0 ? placeholder : value.length >= maxSelections ? `Max ${maxSelections} skills selected` : "Add more skills..."}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            displayValue={(val: string) => val}
            disabled={value.length >= maxSelections}
          />
        </div>
        
        <Transition
          show={isOpen && filteredCategories.length > 0}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredCategories.length === 0 && value.length >= maxSelections ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Maximum {maxSelections} skills selected
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.label}>
                  {/* Category Header */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    {category.label}
                  </div>
                  {/* Skills in Category */}
                  {category.skills.map((skill) => (
                    <Combobox.Option
                      key={skill}
                      value={skill}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-8 pr-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ active }) => (
                        <span className={`block truncate ${active ? 'text-white' : 'text-gray-900'}`}>
                          {skill}
                        </span>
                      )}
                    </Combobox.Option>
                  ))}
                </div>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </Combobox>
      
      {/* Helper Text */}
      <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
        <span>
          {value.length} of {maxSelections} skills selected
        </span>
        {isOpen && filteredCategories.length > 0 && (
          <span>
            {filteredCategories.reduce((acc, cat) => acc + cat.skills.length, 0)} skills available
          </span>
        )}
      </div>
    </div>
  );
} 