"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFilters } from '@/contexts/FilterContext';
import { PROFESSIONAL_ROLES } from '@/lib/constants';

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
    className={`px-3 py-1 rounded-full text-sm transition-colors ${
      isSelected
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800"
    }`}
  >
    {children}
  </button>
));

FilterButton.displayName = 'FilterButton';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    jobTypes: string[];
    employmentTypes: string[];
    salaryRanges: Array<{ label: string; min: number; max: number | null }>;
    locations: string[];
    statuses: string[];
    sortOptions: Array<{ value: string; label: string }>;
  };
}

export function FilterModal({ isOpen, onClose, filters }: FilterModalProps) {
  const { tempFilters, toggleFilter, applyFilters, resetFilters } = useFilters();

  const handleApply = () => {
    applyFilters();
    onClose();
  };

  const handleFilterClick = React.useCallback((category: string, value: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFilter(category as any, value);
  }, [toggleFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Jobs</DialogTitle>
          <DialogDescription>
            Apply filters to find the perfect job match.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Job Type</Label>
            <div className="flex flex-wrap gap-2">
              {filters.jobTypes.map((type) => (
                <FilterButton
                  key={type}
                  isSelected={tempFilters.jobType.includes(type)}
                  onClick={handleFilterClick("jobType", type)}
                >
                  {type}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Employment Type</Label>
            <div className="flex flex-wrap gap-2">
              {filters.employmentTypes.map((type) => (
                <FilterButton
                  key={type}
                  isSelected={tempFilters.employmentType.includes(type)}
                  onClick={handleFilterClick("employmentType", type)}
                >
                  {type}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Salary Range</Label>
            <div className="flex flex-wrap gap-2">
              {filters.salaryRanges.map((range) => (
                <FilterButton
                  key={range.label}
                  isSelected={tempFilters.salaryRange.includes(
                    `${range.min}-${range.max || ""}`
                  )}
                  onClick={handleFilterClick(
                    "salaryRange",
                    `${range.min}-${range.max || ""}`
                  )}
                >
                  {range.label}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Professional Role</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {PROFESSIONAL_ROLES.map((role) => (
                <FilterButton
                  key={role}
                  isSelected={tempFilters.professionalRole.includes(role)}
                  onClick={handleFilterClick("professionalRole", role)}
                >
                  {role}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <div className="flex flex-wrap gap-2">
              {filters.locations.map((location) => (
                <FilterButton
                  key={location}
                  isSelected={tempFilters.location.includes(location)}
                  onClick={handleFilterClick("location", location)}
                >
                  {location}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Job Status</Label>
            <div className="flex flex-wrap gap-2">
              {filters.statuses.map((status) => (
                <FilterButton
                  key={status}
                  isSelected={tempFilters.status.includes(status)}
                  onClick={handleFilterClick("status", status)}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Sort By</Label>
            <Select
              value={tempFilters.sortBy}
              onValueChange={(value) => toggleFilter("sortBy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {filters.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetFilters}
            type="button"
          >
            Reset Filters
          </Button>
          <Button 
            onClick={handleApply}
            type="button"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 