/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CommunityGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityGuidelinesModal({ isOpen, onClose }: CommunityGuidelinesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
            Community Guidelines
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 px-2 py-4">
          <div className="prose prose-gray max-w-none">
            <p className="text-lg font-medium text-gray-900 mb-4">
              Welcome to the Bell Registry message board! This is a private, anonymous space exclusively for private service professionals to connect, share insights, and support one another.
            </p>
            
            <p className="text-gray-700 mb-4">
              To keep this community safe and professional, please follow these rules:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight" style={{ marginTop: '0.2em' }}>Be respectful.</h3>
                  <p className="text-gray-700 text-sm mt-1">No abusive, threatening, or discriminatory language will be tolerated.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight" style={{ marginTop: '0.2em' }}>Protect privacy.</h3>
                  <p className="text-gray-700 text-sm mt-1">Do not share identifying details about clients, households, agencies, recruiters, or other members.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight" style={{ marginTop: '0.2em' }}>Stay professional.</h3>
                  <p className="text-gray-700 text-sm mt-1">Keep discussions focused on private service careers, challenges, and solutions.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight" style={{ marginTop: '0.2em' }}>No spam or solicitation.</h3>
                  <p className="text-gray-700 text-sm mt-1">This is a place for authentic conversation, not advertising.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-blue-600 font-semibold text-sm">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight" style={{ marginTop: '0.2em' }}>Report concerns.</h3>
                  <p className="text-gray-700 text-sm mt-1">If you see something inappropriate, alert our team so we can address it promptly.</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mt-4 text-center italic text-sm">
              By participating, you help maintain a trusted, respectful space where professionals can speak freely and anonymously. Thank you for being part of this community!
            </p>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} className="px-6 py-2">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
