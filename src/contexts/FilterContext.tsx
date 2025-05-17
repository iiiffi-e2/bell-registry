"use client";

import React, { createContext, useContext, useState } from 'react';

type FilterState = {
  location: string[];
  jobType: string[];
  employmentType: string[];
  salaryRange: string[];
  status: string[];
  sortBy: string;
};

type FilterContextType = {
  filters: FilterState;
  tempFilters: FilterState;
  toggleFilter: (category: keyof FilterState, value: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  setInitialFilters: (filters: FilterState) => void;
};

const defaultFilters: FilterState = {
  location: [],
  jobType: [],
  employmentType: [],
  salaryRange: [],
  status: [],
  sortBy: "recent",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setTempFilters(prev => {
      const current = prev[category];
      const newTempFilters = {
        ...prev,
        [category]: Array.isArray(current)
          ? current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]
          : category === 'sortBy'
            ? value
            : current
      };
      
      // When removing a filter, update both temp and actual filters
      if (Array.isArray(current) && current.includes(value)) {
        setFilters(newTempFilters);
      }
      
      return newTempFilters;
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const resetFilters = () => {
    setTempFilters(defaultFilters);
  };

  const setInitialFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setTempFilters(newFilters);
  };

  return (
    <FilterContext.Provider 
      value={{ 
        filters, 
        tempFilters, 
        toggleFilter, 
        applyFilters, 
        resetFilters,
        setInitialFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
} 