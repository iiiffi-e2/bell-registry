/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface MessageBoardTermsAgreementProps {
  onAgree: () => Promise<void>;
  isLoading?: boolean;
}

export function MessageBoardTermsAgreement({ onAgree, isLoading = false }: MessageBoardTermsAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgree = async () => {
    if (!hasRead || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAgree();
    } catch (error) {
      console.error("Error agreeing to terms:", error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-none mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Community Guidelines
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Please read and agree to our community guidelines to access the message board.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4 px-6 py-4">
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
            
            <div className="border-t pt-4">
              <div className="flex items-start space-x-3 mb-4">
                <Checkbox
                  id="terms-agreement"
                  checked={hasRead}
                  onCheckedChange={setHasRead}
                  className="mt-1"
                />
                <label
                  htmlFor="terms-agreement"
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  I have read and agree to follow these community guidelines
                </label>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleAgree}
                  disabled={!hasRead || isSubmitting || isLoading}
                  className="px-6 py-2 text-base font-medium"
                  size="default"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Continue to Message Board"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
