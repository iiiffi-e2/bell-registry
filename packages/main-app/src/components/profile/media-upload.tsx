import { useState } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface MediaUploadProps {
  currentFiles?: string[];
  onUpload: (urls: string[]) => void;
  onRemove: (url: string) => void;
  type: "photo" | "media";
  maxFiles?: number;
}

export function MediaUpload({ currentFiles = [], onUpload, onRemove, type, maxFiles = 5 }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding new files would exceed the limit
    if (currentFiles.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (type === "photo" && !file.type.startsWith("image/")) {
          continue;
        }

        // For media files, validate allowed types
        if (type === "media") {
          const allowedMediaTypes = [
            // Videos
            "video/mp4", "video/mpeg", "video/quicktime", "video/webm", "video/x-msvideo",
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          
          if (!allowedMediaTypes.includes(file.type)) {
            alert(`File type ${file.type} is not supported. Please upload videos (MP4, MOV, WebM, AVI), PDFs, or Word documents only.`);
            continue;
          }
        }

        // Create FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadType", type === "photo" ? "image" : "media");

        // Upload the file
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      onUpload(uploadedUrls);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {type === "photo" ? "Additional Photos" : "Media Files"}
      </label>
      <div className="mt-1">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* Existing Files */}
          {currentFiles.map((url) => (
            <div key={url} className="relative group">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                {type === "photo" ? (
                  <Image
                    src={url}
                    alt="Uploaded media"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center flex-col">
                    <PhotoIcon className="h-8 w-8 text-gray-300 mb-1" />
                    <span className="text-xs text-gray-500 text-center px-1 break-all">
                      {url.split('/').pop()?.split('.')[0]?.substring(0, 10)}...
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute -top-2 -right-2 hidden rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600 group-hover:block"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          {currentFiles.length < maxFiles && (
            <div className="aspect-square w-full">
              <label
                htmlFor={`${type}-upload`}
                className="flex h-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400"
              >
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {isUploading ? "Uploading..." : "Add files"}
                  </span>
                </div>
                <input
                  type="file"
                  id={`${type}-upload`}
                  name={`${type}-upload`}
                  accept={
                    type === "photo" 
                      ? "image/*" 
                      : "video/*,.pdf,.doc,.docx"
                  }
                  onChange={handleFileChange}
                  className="sr-only"
                  multiple
                  disabled={isUploading}
                />
              </label>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {type === "photo"
            ? `Upload up to ${maxFiles} photos of your work or portfolio (JPG, PNG, GIF, WebP). Maximum 10MB per file.`
            : `Upload up to ${maxFiles} media files (Videos, PDFs, Word docs). Maximum 50MB per file. No resumes please.`}
        </p>
      </div>
    </div>
  );
} 