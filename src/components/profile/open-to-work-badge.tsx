"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface OpenToWorkBadgeProps {
  variant?: "overlay" | "inline" | "banner";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OpenToWorkBadge({ 
  variant = "inline", 
  size = "md", 
  className = "" 
}: OpenToWorkBadgeProps) {
  const baseClasses = "flex items-center font-medium text-green-700";
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5", 
    lg: "text-base px-4 py-2"
  };

  const variantClasses = {
    overlay: "absolute -bottom-1 -right-1 bg-green-100 border-2 border-white rounded-full shadow-md",
    inline: "bg-green-100 rounded-full",
    banner: "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg"
  };

  if (variant === "overlay") {
    return (
      <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        <CheckCircleIcon className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          <span className="font-semibold">Open to Work</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-600" />
      <span>Open to Work</span>
    </div>
  );
}

// Profile picture wrapper with open to work badge
interface ProfilePictureWithBadgeProps {
  imageUrl?: string | null;
  displayName: string;
  isOpenToWork: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  isAnonymous?: boolean;
  className?: string;
}

export function ProfilePictureWithBadge({
  imageUrl,
  displayName,
  isOpenToWork,
  size = "lg",
  isAnonymous = false,
  className = ""
}: ProfilePictureWithBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16", 
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  return (
    <div className={`relative ${className}`}>
      {imageUrl && !isAnonymous ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100`}>
          <img
            src={imageUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
          <svg className={`${sizeClasses[size]} text-gray-300`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      )}
      
      {isOpenToWork && (
        <OpenToWorkBadge 
          variant="overlay" 
          size="sm"
          className="absolute -bottom-1 -right-1"
        />
      )}
    </div>
  );
} 