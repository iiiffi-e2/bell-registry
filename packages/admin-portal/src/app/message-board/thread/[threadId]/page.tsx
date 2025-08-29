"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft,
  MessageSquare,
  Clock,
  Pin,
  Lock,
  Trash2,
  User,
  Mail,
  AlertTriangle,
} from "lucide-react";

interface AdminReply {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminThreadData {
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
  replies: AdminReply[];
}

interface AdminThreadViewProps {
  params: {
    threadId: string;
  };
}

export default function AdminThreadViewPage({ params }: AdminThreadViewProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [thread, setThread] = useState<AdminThreadData | null>(null);
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

    fetchThread();
  }, [params.threadId, session, status, router]);

  const fetchThread = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/message-board/threads/${params.threadId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Thread not found");
        }
        throw new Error("Failed to fetch thread");
      }
      
      const data = await response.json();
      setThread(data);
    } catch (error) {
      console.error("Error fetching thread:", error);
      setError(error instanceof Error ? error.message : "Failed to load thread");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    
    if (!confirm(`Are you sure you want to delete the thread "${thread.title}"? This action cannot be undone and will also delete all replies.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/message-board/threads/${params.threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }

      // Navigate back to thread list
      router.push("/message-board");
    } catch (error) {
      console.error("Error deleting thread:", error);
      alert("Failed to delete thread. Please try again.");
    }
  };

  const handleDeleteReply = async (replyId: string, replyContent: string) => {
    const shortContent = replyContent.substring(0, 50) + (replyContent.length > 50 ? '...' : '');
    
    if (!confirm(`Are you sure you want to delete this reply: "${shortContent}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/message-board/replies/${replyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reply");
      }

      // Remove reply from state
      setThread(prev => prev ? {
        ...prev,
        replies: prev.replies.filter(reply => reply.id !== replyId)
      } : null);
    } catch (error) {
      console.error("Error deleting reply:", error);
      alert("Failed to delete reply. Please try again.");
    }
  };

  const handleToggleLock = async () => {
    if (!thread) return;

    try {
      const response = await fetch(`/api/message-board/threads/${params.threadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLocked: !thread.isLocked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update thread");
      }

      setThread(prev => prev ? { ...prev, isLocked: !prev.isLocked } : null);
    } catch (error) {
      console.error("Error updating thread:", error);
      alert("Failed to update thread. Please try again.");
    }
  };

  const handleTogglePin = async () => {
    if (!thread) return;

    try {
      const response = await fetch(`/api/message-board/threads/${params.threadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPinned: !thread.isPinned }),
      });

      if (!response.ok) {
        throw new Error("Failed to update thread");
      }

      setThread(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
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

  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Thread not found"}</p>
          <button
            onClick={() => router.push("/message-board")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Message Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/message-board")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Message Board
        </button>
      </div>

      {/* Thread Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {thread.isPinned && (
                  <Pin className="h-5 w-5 text-blue-600" />
                )}
                {thread.isLocked && (
                  <Lock className="h-5 w-5 text-red-600" />
                )}
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {thread.title}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{thread.authorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{thread.authorEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{thread.replies.length} replies</span>
                </div>
              </div>

              {/* Thread Content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {thread.content}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleTogglePin}
                className={`p-2 rounded hover:bg-gray-100 ${
                  thread.isPinned ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={thread.isPinned ? "Unpin thread" : "Pin thread"}
              >
                <Pin className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleToggleLock}
                className={`p-2 rounded hover:bg-gray-100 ${
                  thread.isLocked ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={thread.isLocked ? "Unlock thread" : "Lock thread"}
              >
                <Lock className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleDeleteThread}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete thread"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex gap-2">
            {thread.isPinned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        {thread.replies.map((reply) => (
          <div key={reply.id} className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{reply.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{reply.authorEmail}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleDeleteReply(reply.id, reply.content)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete reply"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {thread.replies.length === 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>No replies yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
