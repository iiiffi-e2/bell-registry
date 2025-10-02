/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isConfirmationValid = confirmationText === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmationValid) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete account');
      }

      // Sign out the user and redirect to home page
      await signOut({ 
        callbackUrl: '/?accountDeleted=true',
        redirect: true 
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-red-900">
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-center">
            This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              What will be deleted:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Your profile and all personal information</li>
              <li>• Job applications and saved jobs</li>
              <li>• Messages and conversations</li>
              <li>• All account settings and preferences</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-text" className="text-sm font-medium">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirmation-text"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono"
              disabled={isDeleting}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isDeleting}
            className="flex-1"
          >
            Nevermind
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete} 
            disabled={!isConfirmationValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 