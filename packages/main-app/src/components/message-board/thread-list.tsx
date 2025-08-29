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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateThreadModal } from "./create-thread-modal";

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
}

export function ThreadList() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/message-board/threads");
      
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
        <Button onClick={fetchThreads} variant="outline">
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
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Thread
        </Button>
      </div>

      {/* Threads List */}
      {threads.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onThreadCreated={handleThreadCreated}
      />
    </div>
  );
}
