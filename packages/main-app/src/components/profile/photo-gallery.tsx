"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!photos.length) return null;

  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900">Photo Gallery</h4>
      
      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo}
            onClick={() => {
              setCurrentPhotoIndex(index);
              setIsOpen(true);
            }}
            className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
          >
            <Image
              src={photo}
              alt={`Gallery photo ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal Gallery */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative w-full max-w-4xl">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>

            {/* Main image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-900">
              <Image
                src={photos[currentPhotoIndex]}
                alt={`Gallery photo ${currentPhotoIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Navigation buttons */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={handlePrevious}
                className="bg-black/20 hover:bg-black/40 text-white rounded-r-lg p-2 backdrop-blur-sm"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleNext}
                className="bg-black/20 hover:bg-black/40 text-white rounded-l-lg p-2 backdrop-blur-sm"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </div>

            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-4 py-2 rounded-full backdrop-blur-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 