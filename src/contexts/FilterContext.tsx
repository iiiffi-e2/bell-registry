"use client";

import React, { createContext, useContext, useState } from 'react';

type FilterState = {
  location: string[];
  jobType: string[];
  employmentType: string[];
  salaryRange: string[];
  status: string[];
  professionalRole: string[];
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
  professionalRole: [],
  sortBy: "recent",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setTempFilters(prev => {
      const current = prev[category];
      if (Array.isArray(current)) {
        const newFilters = {
          ...prev,
          [category]: current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]
        };
        return newFilters;
      }
      if (category === 'sortBy') {
        return {
          ...prev,
          sortBy: value
        };
      }
      return prev;
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const resetFilters = () => {
    const newFilters = { ...defaultFilters };
    setTempFilters(newFilters);
    setFilters(newFilters);
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