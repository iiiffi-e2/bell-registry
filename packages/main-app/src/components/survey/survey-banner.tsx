"use client";

import { useState } from 'react';
import { XMarkIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";

interface SurveyBannerProps {
  onDismissPermanently: () => void;
  onDismissTemporarily: () => void;
}

export function SurveyBanner({ onDismissPermanently, onDismissTemporarily }: SurveyBannerProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleTakeSurvey = async () => {
    setIsDismissing(true);
    try {
      // Open the survey in a new tab
      window.open('https://docs.google.com/forms/d/e/1FAIpQLSfi8WG5Xne8t-jqSI269rk7onph11UajjD0TUg77diGeCLxiQ/viewform', '_blank');
      // Mark as permanently dismissed when they click to take survey
      await onDismissPermanently();
    } catch (error) {
      console.error('Error taking survey:', error);
      setIsDismissing(false);
    }
  };

  const handleMaybeLater = async () => {
    setIsDismissing(true);
    try {
      // Temporarily dismiss until next login
      await onDismissTemporarily();
    } catch (error) {
      console.error('Error dismissing survey temporarily:', error);
      setIsDismissing(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Help us improve The Bell Registry
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            We value your feedback! Please take a moment to complete our brief survey and share your thoughts about your experience.
          </p>
          <div className="mt-3 flex items-center space-x-3">
            <Button
              type="button"
              size="sm"
              onClick={handleTakeSurvey}
              disabled={isDismissing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Take Survey
            </Button>
            <button
              type="button"
              onClick={handleMaybeLater}
              disabled={isDismissing}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isDismissing ? 'Dismissing...' : 'Maybe Later'}
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleMaybeLater}
              disabled={isDismissing}
              className="inline-flex bg-blue-50 rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 