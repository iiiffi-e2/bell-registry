"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { OpenToWorkBadge } from "@/components/profile/open-to-work-badge";

interface OpenToWorkToggleProps {
  isOpenToWork: boolean;
  onToggle: (isOpen: boolean) => void;
  isLoading?: boolean;
}

export function OpenToWorkToggle({ isOpenToWork, onToggle, isLoading }: OpenToWorkToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile/open-to-work', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openToWork: !isOpenToWork }),
      });

      if (response.ok) {
        onToggle(!isOpenToWork);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating open to work status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Open to Work Status</h3>
          <p className="text-sm text-gray-600 mb-4">
            Let employers know you&apos;re actively seeking new opportunities
          </p>
          
          {isOpenToWork && (
            <OpenToWorkBadge variant="inline" size="md" className="mb-4" />
          )}
        </div>
        
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={handleToggle}
            disabled={isLoading || isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isOpenToWork ? 'bg-green-600' : 'bg-slate-300'
            }`}
          >
            <span className="sr-only">Toggle open to work status</span>
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                isOpenToWork ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Status: <span className={`font-medium ${isOpenToWork ? 'text-green-600' : 'text-gray-600'}`}>
          {isOpenToWork ? 'Open to Work' : 'Not actively seeking'}
        </span>
      </div>
      
      {isUpdating && (
        <div className="mt-2 text-sm text-blue-600">
          Updating status...
        </div>
      )}
    </div>
  );
} 