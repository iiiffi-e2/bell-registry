"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Pin,
  Lock,
  Plus,
  Search,
  X,
  Heart,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateThreadModal } from "./create-thread-modal";
import { CommunityGuidelinesModal } from "./CommunityGuidelinesModal";

interface Thread {
  id: string;
  title: string;
  content?: string;
  authorInitials: string;
  createdAt: string;
  lastReplyAt: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  participantCount: number;
  isAuthor: boolean;
  likeCount: number;
  isLiked: boolean;
}

export function ThreadList() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Thread[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'replies' | 'likes'>('recent');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, [sortBy]);

  const fetchThreads = async (sort?: string) => {
    try {
      setIsLoading(true);
      const sortParam = sort || sortBy;
      const url = `/api/message-board/threads${sortParam !== 'recent' ? `?sortBy=${sortParam}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }
      
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setError("Failed to load threads. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadCreated = (newThread: Thread) => {
    setThreads(prev => [newThread, ...prev]);
    setShowCreateModal(false);
    // Navigate to the new thread
    router.push(`/dashboard/message-board/thread/${newThread.id}`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const sortParam = sortBy !== 'recent' ? `&sortBy=${sortBy}` : '';
      const response = await fetch(`/api/message-board/search?q=${encodeURIComponent(searchQuery.trim())}${sortParam}`);
      
      if (!response.ok) {
        throw new Error("Failed to search threads");
      }
      
      const data = await response.json();
      setSearchResults(data.threads);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching threads:", error);
      setError("Failed to search threads. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSortChange = (newSort: 'recent' | 'replies' | 'likes') => {
    setSortBy(newSort);
    if (hasSearched) {
      // Re-run search with new sorting
      handleSearch();
    } else {
      // Re-fetch threads with new sorting
      fetchThreads(newSort);
    }
  };

  const displayedThreads = hasSearched ? searchResults : threads;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => fetchThreads()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Board</h1>
          <p className="text-gray-600 mt-1">
            Connect and discuss with fellow professionals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'recent' | 'replies' | 'likes')}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="replies">Most Replies</option>
              <option value="likes">Most Liked</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search threads by title or content... (Press Enter to search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-10"
                disabled={isSearching}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              variant="outline"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            {hasSearched && (
              <Button 
                onClick={clearSearch}
                variant="outline"
                className="text-gray-600"
              >
                Clear
              </Button>
            )}
          </div>
          
          {hasSearched && (
            <div className="mt-3 text-sm text-gray-600">
              Found {searchResults.length} thread{searchResults.length !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threads List */}
      {displayedThreads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {hasSearched ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No threads found
                </h3>
                <p className="text-gray-600 mb-4">
                  No threads match your search for &ldquo;{searchQuery}&rdquo;. Try different keywords or clear the search.
                </p>
                <Button 
                  onClick={clearSearch}
                  variant="outline"
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No threads yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start a discussion!
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Thread
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.isPinned && (
                        <Pin className="h-4 w-4 text-blue-600" />
                      )}
                      {thread.isLocked && (
                        <Lock className="h-4 w-4 text-gray-500" />
                      )}
                      <Link
                        href={`/dashboard/message-board/thread/${thread.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {thread.title}
                      </Link>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Started by {thread.authorInitials}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last activity {formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{thread.participantCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{thread.replyCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className={`h-4 w-4 ${thread.likeCount > 0 ? 'text-red-500' : ''}`} />
                      <span>{thread.likeCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Community Guidelines Disclaimer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            By participating in the message board, you agree to follow our{" "}
            <button
              onClick={() => setShowGuidelinesModal(true)}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Community Guidelines
            </button>
            . Help us maintain a respectful and professional space.
          </p>
        </div>
      </div>

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onThreadCreated={handleThreadCreated}
      />

      {/* Community Guidelines Modal */}
      <CommunityGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
}
