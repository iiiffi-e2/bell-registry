"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  itemId: string;
  itemType: "thread" | "reply";
  initialLikeCount: number;
  initialIsLiked: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function LikeButton({
  itemId,
  itemType,
  initialLikeCount,
  initialIsLiked,
  size = "sm",
  className
}: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleLike = async () => {
    if (isLoading) return;

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setIsLoading(true);

    try {
      const endpoint = itemType === "thread" 
        ? `/api/message-board/threads/${itemId}/like`
        : `/api/message-board/replies/${itemId}/like`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const data = await response.json();
      
      // Update with server response (in case of race conditions)
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikeCount(newIsLiked ? likeCount - 1 : likeCount + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const heartSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <button
      onClick={handleToggleLike}
      disabled={false}
      className={cn(
        "flex items-center gap-1 transition-colors rounded-md px-2 py-1 hover:bg-gray-100 cursor-pointer",
        isLiked 
          ? "text-red-600 hover:text-red-700" 
          : "text-gray-500 hover:text-gray-700",
        isLoading && "opacity-75",
        className
      )}
      title={isLiked ? "Unlike" : "Like"}
    >
      <Heart 
        className={cn(
          heartSize,
          isLiked ? "fill-current" : "",
          "transition-all duration-200 ease-in-out",
          isAnimating && "animate-pulse"
        )} 
        style={{
          transform: isAnimating ? 
            (isLiked ? 'scale(1.25)' : 'scale(1.1)') : 
            'scale(1)',
          transition: 'transform 0.2s ease-in-out'
        }}
      />
      {likeCount > 0 && (
        <span className={cn(textSize, "font-medium", "transition-all duration-200")}>
          {likeCount}
        </span>
      )}
    </button>
  );
}
