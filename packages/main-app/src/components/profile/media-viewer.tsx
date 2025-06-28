import { useState } from "react";
import { 
  PlayIcon, 
  DocumentArrowDownIcon, 
  XMarkIcon,
  DocumentTextIcon 
} from "@heroicons/react/24/outline";

interface MediaViewerProps {
  mediaUrls: string[];
  className?: string;
}

// Helper function to determine file type from URL
function getFileType(url: string): 'video' | 'document' {
  const ext = url.split('.').pop()?.toLowerCase();
  const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mpeg'];
  return videoExts.includes(ext || '') ? 'video' : 'document';
}

// Helper function to get file name from URL
function getFileName(url: string): string {
  const fullFileName = url.split('/').pop() || 'Download';
  
  // If the filename contains a UUID prefix (format: uuid_originalname.ext), extract the original name
  const match = fullFileName.match(/^[a-f0-9]{8}_(.+)(\.[^.]+)$/);
  if (match) {
    const originalName = match[1].replace(/_/g, ' '); // Convert underscores back to spaces
    const extension = match[2];
    return originalName + extension;
  }
  
  return fullFileName;
}

// Helper function to get file extension for display
function getFileExtension(url: string): string {
  return url.split('.').pop()?.toUpperCase() || '';
}

export function MediaViewer({ mediaUrls, className = "" }: MediaViewerProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
        <h4 className="text-sm font-medium text-gray-500 mb-4">Media Files</h4>
        <div className="space-y-4">
          {mediaUrls.map((url, index) => {
            const fileType = getFileType(url);
            const fileName = getFileName(url);
            const fileExt = getFileExtension(url);

            if (fileType === 'video') {
              return (
                <div
                  key={index}
                  className="relative group cursor-pointer bg-black rounded-lg overflow-hidden w-full max-w-md mx-auto"
                  onClick={() => setSelectedVideo(url)}
                  style={{ aspectRatio: '16/9' }}
                >
                  <video 
                    className="w-full h-full object-cover"
                    preload="metadata"
                  >
                    <source src={`${url}#t=1`} />
                  </video>
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                    <PlayIcon className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm bg-black bg-opacity-70 px-3 py-2 rounded">
                      {fileName}
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <a
                  key={index}
                  href={url}
                  download={fileName}
                  className="flex items-center p-4 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all group w-full max-w-md mx-auto"
                >
                  <DocumentTextIcon className="h-10 w-10 text-gray-400 group-hover:text-gray-500 mr-4 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{fileName}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{fileExt}</span>
                    </div>
                    <p className="text-xs text-gray-500">Click to download</p>
                  </div>
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              );
            }
          })}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={() => setSelectedVideo(null)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-black shadow-xl transition-all sm:my-8 w-full max-w-4xl">
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  className="rounded-md bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                  onClick={() => setSelectedVideo(null)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <video 
                className="w-full h-auto max-h-[80vh]" 
                controls 
                autoPlay
                src={selectedVideo}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 