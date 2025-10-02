/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Users, 
  Clock, 
  Pin,
  Lock,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface AdminThread {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorId: string;
  createdAt: string;
  lastReplyAt: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  participantCount: number;
}

export default function AdminMessageBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Only allow admins
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchThreads();
  }, [session, status, router]);

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

  const handleDeleteThread = async (threadId: string, threadTitle: string) => {
    if (!confirm(`Are you sure you want to delete the thread "${threadTitle}"? This action cannot be undone and will also delete all replies.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/message-board/threads/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }

      // Remove thread from state
      setThreads(prev => prev.filter(thread => thread.id !== threadId));
    } catch (error) {
      console.error("Error deleting thread:", error);
      alert("Failed to delete thread. Please try again.");
    }
  };

  const handleToggleLock = async (threadId: string, isCurrentlyLocked: boolean) => {
    try {
      const response = await fetch(`/api/message-board/threads/${threadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLocked: !isCurrentlyLocked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update thread");
      }

      // Update thread in state
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, isLocked: !isCurrentlyLocked }
          : thread
      ));
    } catch (error) {
      console.error("Error updating thread:", error);
      alert("Failed to update thread. Please try again.");
    }
  };

  const handleTogglePin = async (threadId: string, isCurrentlyPinned: boolean) => {
    try {
      const response = await fetch(`/api/message-board/threads/${threadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPinned: !isCurrentlyPinned }),
      });

      if (!response.ok) {
        throw new Error("Failed to update thread");
      }

      // Update thread in state
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, isPinned: !isCurrentlyPinned }
          : thread
      ));
    } catch (error) {
      console.error("Error updating thread:", error);
      alert("Failed to update thread. Please try again.");
    }
  };

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not an admin
  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchThreads}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Board Administration</h1>
        <p className="text-gray-600">
          Manage message board threads and replies. You can view, lock, pin, or delete content.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No threads found
          </h3>
          <p className="text-gray-600">
            No message board threads have been created yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              All Threads ({threads.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {threads.map((thread) => (
              <div key={thread.id} className="p-6 hover:bg-gray-50">
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
                        href={`/message-board/thread/${thread.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {thread.title}
                      </Link>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {thread.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By: <strong>{thread.authorName}</strong> ({thread.authorEmail})</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{thread.participantCount} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{thread.replyCount} replies</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/message-board/thread/${thread.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="View thread"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleTogglePin(thread.id, thread.isPinned)}
                      className={`p-2 rounded hover:bg-gray-100 ${
                        thread.isPinned ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={thread.isPinned ? "Unpin thread" : "Pin thread"}
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleLock(thread.id, thread.isLocked)}
                      className={`p-2 rounded hover:bg-gray-100 ${
                        thread.isLocked ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={thread.isLocked ? "Unlock thread" : "Lock thread"}
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteThread(thread.id, thread.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete thread"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
