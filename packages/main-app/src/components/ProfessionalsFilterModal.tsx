"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type CandidateFilters } from '@/types/candidate';

// Professional roles constant
const PROFESSIONAL_ROLES = [
  "Head Gardener",
  "Executive Housekeeper",
  "Driver",
  "Executive Protection",
  "Butler",
  "Governess",
  "Private Teacher",
  "Nanny | Educator",
  "Nanny",
  "Family Assistant",
  "Personal Assistant",
  "Laundress",
  "Housekeeper",
  "Houseman",
  "Estate Couple",
  "Property Caretaker",
  "House Manager",
  "Estate Manager",
  "Personal Chef",
  "Private Chef",
  "Event Chef",
  "Drop-Off Chef",
  "Seasonal Chef",
  "Office Chef",
  "Yacht Chef",
  "Jet Chef",
  "Family Office CEO",
  "Family Office COO",
  "Executive Assistant",
  "Administrative Assistant",
  "Office Manager",
  "Human Resources Director",
  "Director of Residences",
  "Chief of Staff",
  "Estate Hospitality Manager",
  "Estate IT Director",
  "Estate Security Director",
  "Director of Operations",
  "Director of Real Estate and Construction",
  "Construction Manager",
  "Facilities Manager",
  "Property Manager",
  "Landscape Director",
  "Yacht Captain",
  "Yacht Steward | Stewardess",
  "Yacht Engineer",
  "Flight Attendant",
  "Other"
];

const FilterButton = React.memo(({ 
  children, 
  isSelected, 
  onClick 
}: { 
  children: React.ReactNode;
  isSelected: boolean; 
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }}
    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
      isSelected
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
));

FilterButton.displayName = 'FilterButton';

interface ProfessionalsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
}

export function ProfessionalsFilterModal({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange 
}: ProfessionalsFilterModalProps) {
  // Local state for the modal
  const [tempFilters, setTempFilters] = useState<CandidateFilters>(filters);
  const [roleSearch, setRoleSearch] = useState('');

  // Update temp filters when modal opens with current filters
  React.useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
    }
  }, [isOpen, filters]);

  // Filter roles based on search
  const filteredRoles = PROFESSIONAL_ROLES.filter(role =>
    role.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleRoleToggle = (role: string) => {
    setTempFilters(prev => ({
      ...prev,
      roles: prev.roles?.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...(prev.roles || []), role]
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFilters(prev => ({
      ...prev,
      location: e.target.value
    }));
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFilters(prev => ({
      ...prev,
      radius: parseInt(e.target.value)
    }));
  };

  const handleOpenToWorkToggle = () => {
    setTempFilters(prev => ({
      ...prev,
      openToWork: !prev.openToWork
    }));
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: CandidateFilters = {
      searchQuery: filters.searchQuery, // Keep search query
      roles: [],
      location: '',
      radius: 50,
      openToWork: false
    };
    setTempFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (tempFilters.roles?.length) count += tempFilters.roles.length;
    if (tempFilters.location) count += 1;
    if (tempFilters.radius && tempFilters.radius !== 50) count += 1;
    if (tempFilters.openToWork) count += 1;
    return count;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Professionals</DialogTitle>
          <DialogDescription>
            Apply filters to find the perfect professional match.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          
          {/* Professional Roles */}
          <div className="grid gap-3">
            <Label className="text-base font-medium">Professional Roles</Label>
            
            {/* Role Search */}
            <input
              type="text"
              placeholder="Search roles..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Role Buttons */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <FilterButton
                    key={role}
                    isSelected={tempFilters.roles?.includes(role) || false}
                    onClick={() => handleRoleToggle(role)}
                  >
                    {role}
                  </FilterButton>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  No roles found matching &ldquo;{roleSearch}&rdquo;
                </div>
              )}
            </div>
            
            {/* Selected roles count */}
            {tempFilters.roles && tempFilters.roles.length > 0 && (
              <div className="text-sm text-gray-600">
                {tempFilters.roles.length} role{tempFilters.roles.length === 1 ? '' : 's'} selected
              </div>
            )}
          </div>

          {/* Location */}
          <div className="grid gap-3">
            <Label className="text-base font-medium">Location</Label>
            <input
              type="text"
              placeholder="Enter city, state, or zip code"
              value={tempFilters.location || ''}
              onChange={handleLocationChange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Search Radius */}
          <div className="grid gap-3">
            <Label className="text-base font-medium">
              Search Radius: {tempFilters.radius || 50} miles
            </Label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={tempFilters.radius || 50}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 mi</span>
              <span>25 mi</span>
              <span>50 mi</span>
              <span>100 mi</span>
              <span>200 mi</span>
            </div>
          </div>

          {/* Open to Work */}
          <div className="grid gap-3">
            <Label className="text-base font-medium">Availability</Label>
            <button
              type="button"
              onClick={handleOpenToWorkToggle}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tempFilters.openToWork
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Open to Work Only
            </button>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="text-gray-600"
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-blue-600">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
