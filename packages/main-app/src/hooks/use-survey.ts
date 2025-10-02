/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState, useEffect } from 'react';
import { SurveyStatus } from '@/lib/survey-service';

export function useSurvey() {
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>({
    shouldShowSurvey: false,
    shouldShowBanner: false,
    daysSinceSignup: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  // Check if survey is temporarily dismissed in this session
  const isTemporarilyDismissed = () => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('survey_dismissed_temporarily') === 'true';
  };

  const fetchSurveyStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/survey/status');
      if (response.ok) {
        const status = await response.json();
        
        // Apply temporary dismissal logic - if temporarily dismissed, don't show banner
        if (isTemporarilyDismissed()) {
          setSurveyStatus({
            ...status,
            shouldShowSurvey: false,
            shouldShowBanner: false,
          });
        } else {
          setSurveyStatus(status);
        }
      }
    } catch (error) {
      console.error('Error fetching survey status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissSurveyPermanently = async () => {
    setIsDismissing(true);
    try {
      const response = await fetch('/api/survey/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'permanent' }),
      });

      if (!response.ok) {
        throw new Error('Failed to permanently dismiss survey');
      }

      // Clear temporary dismissal from sessionStorage since it's now permanent
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('survey_dismissed_temporarily');
      }

      // Update local state - survey is permanently gone
      setSurveyStatus(prev => ({
        ...prev,
        shouldShowSurvey: false,
        shouldShowBanner: false,
      }));
    } catch (error) {
      console.error('Error permanently dismissing survey:', error);
      throw error;
    } finally {
      setIsDismissing(false);
    }
  };

  const dismissSurveyTemporarily = async () => {
    setIsDismissing(true);
    try {
      // Store dismissal in sessionStorage - persists across navigation but cleared on logout
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('survey_dismissed_temporarily', 'true');
      }
      
      // Update local state to hide banner
      setSurveyStatus(prev => ({
        ...prev,
        shouldShowSurvey: false,
        shouldShowBanner: false,
      }));
      

    } catch (error) {
      console.error('Error temporarily dismissing survey:', error);
      throw error;
    } finally {
      setIsDismissing(false);
    }
  };

  useEffect(() => {
    fetchSurveyStatus();
  }, []);

  return {
    surveyStatus,
    isLoading,
    isDismissing,
    dismissSurveyPermanently,
    dismissSurveyTemporarily,
    refreshStatus: fetchSurveyStatus,
  };
} 