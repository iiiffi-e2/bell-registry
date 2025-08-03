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

interface ProfilePictureWithBadgeProfileProps {
  profile: {
    openToWork: boolean;
    user: {
      image: string | null;
      firstName: string | null;
      lastName: string | null;
      isAnonymous: boolean;
      customInitials?: string | null;
    };
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Overloaded function signatures
export function ProfilePictureWithBadge(props: ProfilePictureWithBadgeProps): JSX.Element;
export function ProfilePictureWithBadge(props: ProfilePictureWithBadgeProfileProps): JSX.Element;
export function ProfilePictureWithBadge(props: ProfilePictureWithBadgeProps | ProfilePictureWithBadgeProfileProps) {
  // Helper function to get display name from profile
  const getDisplayNameFromProfile = (profile: any) => {
    const firstName = profile.user.firstName || '';
    const lastName = profile.user.lastName || '';
    
    if (profile.user.isAnonymous) {
      // Use custom initials if provided, otherwise use name initials
      if (profile.user.customInitials && profile.user.customInitials.length >= 2) {
        const initials = profile.user.customInitials.toUpperCase();
        if (initials.length === 2) {
          return `${initials[0]}. ${initials[1]}.`;
        }
      }
      
      // Fall back to name initials
      if (firstName && lastName) {
        return `${firstName[0]}. ${lastName[0]}.`;
      } else if (firstName) {
        return `${firstName[0]}. Anonymous`;
      } else {
        return 'Anonymous Professional';
      }
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  // Determine if this is a profile object or individual props
  const isProfileProps = 'profile' in props;
  
  let imageUrl: string | null;
  let displayName: string;
  let isOpenToWork: boolean;
  let isAnonymous: boolean;
  let size: "sm" | "md" | "lg" | "xl";
  let className: string;

  if (isProfileProps) {
    const { profile, size: propSize = "lg", className: propClassName = "" } = props as ProfilePictureWithBadgeProfileProps;
    imageUrl = profile.user.image;
    displayName = getDisplayNameFromProfile(profile);
    isOpenToWork = profile.openToWork;
    isAnonymous = profile.user.isAnonymous;
    size = propSize;
    className = propClassName;
  } else {
    const {
      imageUrl: propImageUrl,
      displayName: propDisplayName,
      isOpenToWork: propIsOpenToWork,
      size: propSize = "lg",
      isAnonymous: propIsAnonymous = false,
      className: propClassName = ""
    } = props as ProfilePictureWithBadgeProps;
    imageUrl = propImageUrl;
    displayName = propDisplayName;
    isOpenToWork = propIsOpenToWork;
    isAnonymous = propIsAnonymous;
    size = propSize;
    className = propClassName;
  }
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
          <img
            src="/images/brand/bell-registry-b-gold-on-blue.png"
            alt="Bell Registry"
            className="h-full w-full object-cover"
          />
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