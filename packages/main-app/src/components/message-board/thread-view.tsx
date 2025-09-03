"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft,
  MessageSquare,
  Clock,
  Pin,
  Lock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LikeButton } from "./like-button";
import { CommunityGuidelinesModal } from "./CommunityGuidelinesModal";

interface Reply {
  id: string;
  content: string;
  authorInitials: string;
  createdAt: string;
  updatedAt: string;
  isAuthor: boolean;
  likeCount: number;
  isLiked: boolean;
}

interface ThreadData {
  id: string;
  title: string;
  content: string;
  authorInitials: string;
  createdAt: string;
  lastReplyAt: string;
  isPinned: boolean;
  isLocked: boolean;
  isAuthor: boolean;
  likeCount: number;
  isLiked: boolean;
  replies: Reply[];
}

interface ThreadViewProps {
  threadId: string;
}

export function ThreadView({ threadId }: ThreadViewProps) {
  const router = useRouter();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/message-board/threads/${threadId}`);
      
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

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      setReplyError("Reply content is required");
      return;
    }

    if (!thread) return;

    setIsSubmittingReply(true);
    setReplyError(null);

    try {
      const response = await fetch(`/api/message-board/threads/${threadId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      const newReply = await response.json();
      
      // Add the new reply to the thread
      setThread(prev => prev ? {
        ...prev,
        replies: [...prev.replies, newReply],
        lastReplyAt: newReply.createdAt,
      } : null);
      
      setReplyContent("");
    } catch (error) {
      console.error("Error posting reply:", error);
      setReplyError(error instanceof Error ? error.message : "Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Thread not found"}</p>
        <Button onClick={() => router.push("/dashboard/message-board")} variant="outline">
          Back to Message Board
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/message-board")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Message Board
        </Button>
      </div>

      {/* Thread Header */}
      <Card>
        <CardHeader className="pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              {/* Title Section */}
              <div className="flex items-start gap-3 mb-6">
                <div className="flex items-center gap-2 flex-shrink-0">
                  {thread.isPinned && (
                    <Pin className="h-5 w-5 text-blue-600" />
                  )}
                  {thread.isLocked && (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                  {thread.title}
                </h1>
              </div>
              
              {/* Metadata Section */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Started by {thread.authorInitials}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span>{thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}</span>
                </div>
              </div>

              {/* Thread Content */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap text-base leading-relaxed">
                  {thread.content}
                </p>
              </div>
            </div>
            
            {/* Thread Like Button */}
            <div className="flex justify-start sm:justify-end sm:ml-6 flex-shrink-0">
              <LikeButton
                itemId={thread.id}
                itemType="thread"
                initialLikeCount={thread.likeCount}
                initialIsLiked={thread.isLiked}
                size="md"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        {thread.replies.map((reply) => (
          <Card key={reply.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                      {reply.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {reply.authorInitials}
                      </span>
                      {reply.isAuthor && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Reply Like Button - Top Right */}
                <div className="ml-4 flex-shrink-0">
                  <LikeButton
                    itemId={reply.id}
                    itemType="reply"
                    initialLikeCount={reply.likeCount}
                    initialIsLiked={reply.isLiked}
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Form */}
      {!thread.isLocked ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Post a Reply</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  maxLength={5000}
                  disabled={isSubmittingReply}
                  className={replyError ? "border-red-500" : ""}
                />
                {replyError && (
                  <p className="text-sm text-red-600 mt-2">{replyError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {replyContent.length}/5000 characters
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingReply ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">This thread is locked and cannot receive new replies.</p>
          </CardContent>
        </Card>
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

      {/* Community Guidelines Modal */}
      <CommunityGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
}
