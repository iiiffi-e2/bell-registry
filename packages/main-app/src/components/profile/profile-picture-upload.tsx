"use client";

import { useState, useRef, useCallback } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "sonner";
import ReactCrop, { 
  centerCrop, 
  makeAspectCrop, 
  Crop, 
  PixelCrop,
  convertToPixelCrop 
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
}

// Helper function to create a crop with a 1:1 aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

// Helper function to convert canvas to blob
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });
}

// Helper function to get canvas with cropped image
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return canvas;
}

export function ProfilePictureUpload({ currentImage, onUpload }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result?.toString() || '');
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploading(true);
      
      // Get the cropped canvas
      const canvas = getCroppedImg(imgRef.current, completedCrop);
      
      // Convert canvas to blob
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Failed to create image blob');

      // Get pre-signed URL for direct S3 upload
      const presignedResponse = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: "cropped-profile.jpg",
          fileType: "image/jpeg",
          uploadType: "image",
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({ error: "Unknown error" }));
        
        if (presignedResponse.status === 401) {
          throw new Error("Your session has expired. Please refresh the page and try again.");
        }
        
        if (presignedResponse.status === 400) {
          throw new Error(errorData.error || "Invalid image file. Please choose a JPEG, PNG, or WebP image.");
        }
        
        throw new Error(errorData.error || "Failed to prepare upload. Please try again.");
      }

      const { presignedUrl, fileUrl } = await presignedResponse.json();

      // Upload directly to S3 using pre-signed URL
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to storage");
      }

      onUpload(fileUrl);
      
      // Close modal and reset
      setShowCropModal(false);
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, onUpload]);

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
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
          Change
          <input
            type="file"
            id="profile-picture"
            name="profile-picture"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Upload a profile picture (JPG, PNG, GIF, WebP). Maximum 10MB.
      </p>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleCancelCrop}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Crop Profile Picture
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag to reposition and resize the crop area to frame your photo perfectly.
                  </p>
                  
                  <div className="flex justify-center">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current?.width || 0, imgRef.current?.height || 0))}
                      aspect={1}
                      className="max-w-full max-h-96"
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={imageSrc}
                        style={{ maxHeight: '400px', maxWidth: '100%' }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                  onClick={handleCropComplete}
                  disabled={isUploading || !completedCrop}
                >
                  {isUploading ? "Uploading..." : "Save Cropped Image"}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={handleCancelCrop}
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 