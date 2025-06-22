'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MicrophoneIcon, 
  MagnifyingGlassIcon,
  SparklesIcon,
  MapPinIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface ParsedJobSearch {
  role: {
    primary: string;
    alternatives: string[];
    confidence: number;
  };
  location: {
    primary: string[];
    flexibility: string;
    travelRequirements: string[];
  };
  workStyle: {
    living: string;
    schedule: string[];
    overtime: string;
  };
  clientProfile: {
    familySize: string;
    children: string;
    lifestyle: string[];
    specialNeeds: string[];
  };
  qualifications: {
    experience: number;
    specialties: string[];
    languages: string[];
    certifications: string[];
  };
  compensation: {
    range?: [number, number];
    benefits: string[];
    flexibility: boolean;
  };
  preferences: {
    privacy: string;
    growth: string[];
    culture: string[];
  };
  confidence: number;
  ambiguities: string[];
}

interface AISearchSummary {
  searchIntent: string;
  requirements: {
    mustHave: string[];
    preferred: string[];
    dealBreakers: string[];
  };
  clarificationQuestions: string[];
  suggestedRefinements: string[];
}

interface JobMatchScore {
  overallScore: number;
  breakdown: {
    roleMatch: number;
    locationMatch: number;
    requirementsMatch: number;
    preferencesMatch: number;
    compensationMatch: number;
    cultureMatch: number;
  };
  matchHighlights: string[];
  potentialConcerns: string[];
  missingInfo: string[];
}

interface AIJobMatch {
  jobId: string;
  job: any;
  score: JobMatchScore;
  reasoning: string;
  link: string;
}

interface AISearchResult {
  originalQuery: string;
  parsedSearch: ParsedJobSearch;
  summary: AISearchSummary;
  matches: AIJobMatch[];
  totalMatches: number;
}

export default function AIJobSearch() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [searchResult, setSearchResult] = useState<AISearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [savedJobs, setSavedJobs] = useState<{ [key: string]: boolean }>({});
  const [savingJobs, setSavingJobs] = useState<{ [key: string]: boolean }>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const shouldAutoSearchRef = useRef<boolean>(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add message to conversation
  const addToConversation = useCallback((type: 'user' | 'ai', content: string) => {
    setConversationHistory(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  }, []);

  // Process text search
  const handleTextSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setProcessingStage('Analyzing your requirements with AI...');
    setError(null);
    console.log('🔄 Starting text search processing...');

    try {
      // Small delay to show the analysis stage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStage('Searching for matching jobs...');
      console.log('🔍 Searching for jobs...');
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please log in to use AI job search. You need to be authenticated to access this feature.');
        }
        throw new Error(errorData.error || 'Failed to process search');
      }

      setProcessingStage('Scoring and ranking results...');
      console.log('📊 Scoring and ranking results...');
      
      // Small delay to show the scoring stage
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await response.json();
      setSearchResult(result);
      
      addToConversation('user', query.trim());
      addToConversation('ai', `Found ${result.totalMatches} jobs matching your request: "${result.summary.searchIntent}"`);
    } catch (error: any) {
      console.error('Error processing text search:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  }, [query, addToConversation]);

  // Auto-search after speech recognition completes
  useEffect(() => {
    if (!isListening && shouldAutoSearchRef.current && query.trim() && !isProcessing) {
      shouldAutoSearchRef.current = false; // Reset the flag
      // Small delay to ensure UI updates
      setTimeout(() => {
        handleTextSearch();
      }, 100);
    }
  }, [isListening, query, isProcessing, handleTextSearch]);

  // Voice recognition functionality
  const startListening = useCallback(async () => {
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        // Fallback to audio recording for browsers without speech recognition
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudioSearch(audioBlob);
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
        return;
      }

      // Use real-time speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1; // Reduce alternatives to minimize confusion
      
      // Mobile-specific settings
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        recognitionRef.current.continuous = false; // Less continuous on mobile to reduce duplicates
      }

      let finalTranscript = '';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let newFinalTranscript = '';
        
        // Process all results to build the complete transcript
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Clean up the transcript by removing duplicates and extra spaces
        const cleanTranscript = (text: string) => {
          return text
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1') // Remove repeated words
            .trim();
        };
        
        // Update final transcript only if we have new content
        if (newFinalTranscript && newFinalTranscript !== finalTranscript) {
          finalTranscript = cleanTranscript(newFinalTranscript);
          shouldAutoSearchRef.current = true; // Mark that we should auto-search
        }
        
        // Clean interim transcript as well
        const cleanInterim = cleanTranscript(interimTranscript);
        
        // Update the query with cleaned final and interim results
        const combinedTranscript = cleanTranscript(finalTranscript + ' ' + cleanInterim);
        setQuery(combinedTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Clear any timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        
        // Handle different error types
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try speaking again.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('Speech recognition error. Please try again or type your search.');
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        
        // Clear any timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        
        // Auto-search will be triggered by useEffect when shouldAutoSearchRef changes
      };

      recognitionRef.current.start();
      setIsListening(true);
      shouldAutoSearchRef.current = false; // Reset auto-search flag
      
      // Set a timeout to automatically stop listening after 30 seconds
      speechTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
          setError('Speech recognition timed out. Please try again.');
        }
      }, 30000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions and try again.');
    }
  }, [query]);

  const stopListening = useCallback(() => {
    // Clear any timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, [isListening]);

  // Process audio search
  const processAudioSearch = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProcessingStage('Converting audio to text...');
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        setProcessingStage('Analyzing your requirements with AI...');
        const response = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            throw new Error('Please log in to use AI job search. You need to be authenticated to access this feature.');
          }
          throw new Error(errorData.error || 'Failed to process audio search');
        }

        const result = await response.json();
        setSearchResult(result);
        setQuery(result.originalQuery);
        
        addToConversation('user', result.originalQuery);
        addToConversation('ai', `Found ${result.totalMatches} jobs matching your request: "${result.summary.searchIntent}"`);
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error: any) {
      console.error('Error processing audio search:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  }, [addToConversation]);

  

  // Handle search refinement
  const handleRefinement = async (refinementQuery: string) => {
    if (!searchResult) return;

    setIsProcessing(true);
    setProcessingStage('Refining your search...');
    setError(null);

    try {
      const response = await fetch('/api/ai/search/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSearch: searchResult.parsedSearch,
          userFeedback: refinementQuery,
          previousResults: searchResult.matches
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine search');
      }

      const refinement = await response.json();
      
      // Update search result with refined data
      setSearchResult({
        ...searchResult,
        parsedSearch: refinement.updatedSearch,
        matches: refinement.newResults,
        totalMatches: refinement.newResults.length,
        summary: refinement.summary
      });

      addToConversation('user', refinementQuery);
      addToConversation('ai', refinement.aiResponse);
    } catch (error: any) {
      console.error('Error refining search:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };



  // Handle job bookmarking
  const handleSaveJob = async (jobSlug: string) => {
    setSavingJobs(prev => ({ ...prev, [jobSlug]: true }));
    
    try {
      const response = await fetch(`/api/jobs/${jobSlug}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to save job');

      const { bookmarked } = await response.json();
      setSavedJobs(prev => ({ ...prev, [jobSlug]: bookmarked }));
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSavingJobs(prev => ({ ...prev, [jobSlug]: false }));
    }
  };

  // Get score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            AI Job Search
          </CardTitle>
          <CardDescription>
            Describe your ideal job in natural language. You can type or speak your requirements.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Search Input */}
          <div className="space-y-4">
            <div className="space-y-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your ideal job... (e.g., live-in chef for a family in the Hamptons)"
                className={`w-full min-h-[100px] md:min-h-[120px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base ${
                  isProcessing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                disabled={isProcessing}
              />
              
              {/* Mobile-friendly button layout */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 h-11"
                >
                  <MicrophoneIcon className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
                  {isListening ? 'Stop Recording' : 'Speak Your Request'}
                </Button>
                
                <Button
                  onClick={handleTextSearch}
                  disabled={isProcessing || !query.trim()}
                  className="flex items-center justify-center gap-2 h-11 flex-1"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Search Jobs
                </Button>
              </div>
              
              {/* Example text for mobile */}
              <div className="block sm:hidden">
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                    See example searches
                  </summary>
                  <div className="mt-2 space-y-1 text-gray-700 pl-4">
                    <p>• "Live-in chef for a family with young kids"</p>
                    <p>• "Estate manager in California, $100k+"</p>
                    <p>• "Housekeeper position, no travel required"</p>
                  </div>
                </details>
              </div>
            </div>

            {/* Processing Status */}
            {(isProcessing || isListening) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <div className="space-y-2 flex-1">
                    <div className="text-base font-semibold text-blue-900">
                      {isListening ? '🎤 Listening...' : `🤖 ${processingStage || 'Processing your request...'}`}
                    </div>
                    <div className="text-sm text-blue-700">
                      {isListening 
                        ? 'Speak clearly and click "Stop" when finished. Your words will appear in the text box above.' 
                        : processingStage 
                        ? 'This may take a few moments as we analyze your requirements and search our database'
                        : 'Understanding your requirements and finding matching jobs'
                      }
                    </div>
                    
                    {/* Progress indicators for different stages */}
                    {!isListening && processingStage && (
                      <div className="mt-3 bg-white/50 rounded-lg p-3">
                        <div className="text-xs font-medium text-blue-800 mb-2">Processing Steps:</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-sm text-blue-700">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                              processingStage.includes('Converting') || processingStage.includes('Analyzing') 
                                ? 'bg-blue-600 animate-pulse' 
                                : processingStage.includes('Searching') || processingStage.includes('Scoring')
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}>
                              {(processingStage.includes('Searching') || processingStage.includes('Scoring')) && 
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                              }
                            </div>
                            <span className={processingStage.includes('Converting') || processingStage.includes('Analyzing') ? 'font-semibold' : ''}>
                              1. Understanding requirements
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-blue-700">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                              processingStage.includes('Searching') 
                                ? 'bg-blue-600 animate-pulse' 
                                : processingStage.includes('Scoring')
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}>
                              {processingStage.includes('Scoring') && 
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                              }
                            </div>
                            <span className={processingStage.includes('Searching') ? 'font-semibold' : ''}>
                              2. Finding matching jobs
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-blue-700">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                              processingStage.includes('Scoring') 
                                ? 'bg-blue-600 animate-pulse' 
                                : processingStage.includes('Refining')
                                ? 'bg-blue-600 animate-pulse'
                                : 'bg-gray-300'
                            }`}>
                            </div>
                            <span className={processingStage.includes('Scoring') || processingStage.includes('Refining') ? 'font-semibold' : ''}>
                              3. {processingStage.includes('Refining') ? 'Refining results' : 'Scoring and ranking'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {searchResult && (
            <div className="mt-6 space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Here&apos;s what I understood:
                </h3>
                
                <div className="space-y-4">
                  <p className="text-blue-800 font-medium">{searchResult.summary.searchIntent}</p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Must Have:</h4>
                      <ul className="space-y-1">
                        {searchResult.summary.requirements.mustHave.map((req, i) => (
                          <li key={i} className="text-sm text-blue-800 flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Preferred:</h4>
                      <ul className="space-y-1">
                        {searchResult.summary.requirements.preferred.map((pref, i) => (
                          <li key={i} className="text-sm text-blue-800">• {pref}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {searchResult.summary.requirements.dealBreakers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Deal Breakers:</h4>
                        <ul className="space-y-1">
                          {searchResult.summary.requirements.dealBreakers.map((deal, i) => (
                            <li key={i} className="text-sm text-red-700">✗ {deal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Clarification Questions */}
                  {searchResult.summary.clarificationQuestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Quick questions to improve results:</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.summary.clarificationQuestions.map((question, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefinement(question)}
                            disabled={isProcessing}
                            className="text-xs"
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Results */}
          {searchResult && searchResult.matches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Found {searchResult.totalMatches} matching positions
              </h3>
              
              <div className="space-y-4">
                {searchResult.matches.map((match) => (
                  <div key={match.jobId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{match.job.title}</h4>
                          <Badge className={`${getScoreColor(match.score.overallScore)} border-0`}>
                            {match.score.overallScore}% Match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {match.job.location}
                          </div>
                          {match.job.salary && (
                            <div className="flex items-center gap-1">
                              <BanknotesIcon className="h-4 w-4" />
                              ${match.job.salary.min?.toLocaleString()} - ${match.job.salary.max?.toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {match.job.employmentType || 'Full-time'}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{match.reasoning}</p>
                        
                        {/* Match Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {Object.entries(match.score.breakdown).map(([factor, score]) => (
                            <div key={factor} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize text-gray-600">
                                  {factor.replace('Match', '')}
                                </span>
                                <span className="font-medium">{score}%</span>
                              </div>
                              <Progress value={score} className="h-1" />
                            </div>
                          ))}
                        </div>

                        {/* Match Highlights & Concerns */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {match.score.matchHighlights.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-green-800 mb-1">Why this matches:</h5>
                              <ul className="text-sm text-green-700 space-y-1">
                                {match.score.matchHighlights.map((highlight, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircleIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    {highlight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {match.score.potentialConcerns.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-yellow-800 mb-1">Potential concerns:</h5>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                {match.score.potentialConcerns.map((concern, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <ExclamationCircleIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <Button asChild>
                            <Link href={match.link}>
                              View Details
                              <ArrowRightIcon className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleSaveJob(match.job.urlSlug)}
                            disabled={savingJobs[match.job.urlSlug]}
                            className="flex items-center gap-2"
                          >
                            {savedJobs[match.job.urlSlug] ? (
                              <BookmarkSolidIcon className="h-4 w-4 text-blue-600" />
                            ) : (
                              <BookmarkIcon className="h-4 w-4" />
                            )}
                            {savingJobs[match.job.urlSlug] 
                              ? 'Saving...' 
                              : savedJobs[match.job.urlSlug] 
                              ? 'Saved' 
                              : 'Save Job'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResult && searchResult.matches.length === 0 && (
            <div className="mt-6 text-center py-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">
                  I couldn&apos;t find any jobs matching your specific criteria. Try broadening your search or adjusting your requirements.
                </p>
                
                {searchResult.summary.suggestedRefinements.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 mb-3">Try these alternative searches:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchResult.summary.suggestedRefinements.map((suggestion, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuery(suggestion);
                            handleTextSearch();
                          }}
                          disabled={isProcessing}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Conversation</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {conversationHistory.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick refinement input */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Refine your search... (e.g., 'no travel required', 'increase salary to $100k+')"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleRefinement(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                  disabled={isProcessing}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      handleRefinement(input.value.trim());
                      input.value = '';
                    }
                  }}
                  disabled={isProcessing}
                >
                  Refine
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 