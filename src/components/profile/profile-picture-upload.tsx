"use client";

import { useState } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
}

export function ProfilePictureUpload({ currentImage, onUpload }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
      <div className="mt-1 flex items-center space-x-5">
        <div className="relative inline-block h-24 w-24 overflow-hidden rounded-full bg-gray-100">
          {currentImage ? (
            <Image
              src={currentImage}
              alt="Profile"
              fill
              className="h-full w-full object-cover"
            />
          ) : (
            <PhotoIcon className="h-full w-full text-gray-300" aria-hidden="true" />
          )}
        </div>
        <label
          htmlFor="profile-picture"
          className="cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isUploading ? "Uploading..." : "Change"}
          <input
            type="file"
            id="profile-picture"
            name="profile-picture"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
} 