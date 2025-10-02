/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  UserIcon,
  UserGroupIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AdminNotes from '../../../components/AdminNotes';

interface ProfileDetail {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    image: string | null;
    profileSlug: string | null;
    membershipAccess: string | null;
    referralProfessionalName: string | null;
  };
  bio: string | null;
  preferredRole: string | null;
  location: string | null;
  profileViews: number;
  openToWork: boolean;
  skills: string[];
  experience: any[];
  certifications: string[];
  workLocations: string[];
  seekingOpportunities: string[];
  payRangeMin: number | null;
  payRangeMax: number | null;
  payType: string | null;
  yearsOfExperience: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  reportCount?: number;
  reports?: any[];
  adminNotes?: any[];
  // Additional "about me" fields
  idealEnvironment?: string | null;
  whatImSeeking?: string | null;
  whatSetsApartMe?: string | null;
  whyIEnjoyThisWork?: string | null;
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  userName: string; 
  isLoading: boolean; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Delete User Profile
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                You are about to permanently delete the profile for <strong>{userName}</strong>.
              </p>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone. The user's account and all associated data will be marked as deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspension Modal Component
function SuspensionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string, note: string) => void; 
  userName: string; 
  isLoading: boolean; 
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim(), note.trim());
    }
  };

  const handleClose = () => {
    setReason('');
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Suspend User Account
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            You are about to suspend the account for <strong>{userName}</strong>. 
            This will restrict their access to the platform.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Reason *
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a reason</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Spam or harassment">Spam or harassment</option>
                <option value="Fake profile or impersonation">Fake profile or impersonation</option>
                <option value="Violation of terms of service">Violation of terms of service</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Multiple reports">Multiple reports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Note (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provide additional context or instructions for the user..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This note will be included in the suspension email sent to the user.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? 'Suspending...' : 'Suspend Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfileDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Navigate back to profiles with preserved filters
  const goBackToProfiles = () => {
    const params = new URLSearchParams();
    if (searchParams.get('status') && searchParams.get('status') !== 'all') {
      params.set('status', searchParams.get('status')!);
    }
    if (searchParams.get('search')) {
      params.set('search', searchParams.get('search')!);
    }
    if (searchParams.get('hasReports') === 'true') {
      params.set('hasReports', 'true');
    }
    if (searchParams.get('openToWork')) {
      params.set('openToWork', searchParams.get('openToWork')!);
    }
    if (searchParams.get('sortBy') && searchParams.get('sortBy') !== 'newest') {
      params.set('sortBy', searchParams.get('sortBy')!);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    router.push(`/profiles${queryString}`);
  };
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Fetch profile details
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchProfile();
  }, [status, params.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/profiles/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found');
        }
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'flag' | 'ban' | 'unban' | 'delete', reason?: string, note?: string) => {
    if (!profile) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/profiles/${params.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          reason: reason || undefined,
          note: note || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Action failed');
      }
      
      const result = await response.json();
      
      // Show success message
      alert(result.message || `Profile ${action} successful`);
      
      // If profile was deleted, redirect back to profiles list
      if (action === 'delete') {
        router.push('/profiles');
        return;
      }
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Action error:', error);
      alert(`Failed to ${action} profile`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendClick = () => {
    setShowSuspensionModal(true);
  };

  const handleSuspendConfirm = (reason: string, note: string) => {
    handleAction('suspend', reason, note);
    setShowSuspensionModal(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    handleAction('delete');
    setShowDeleteModal(false);
  };

  const getStatusBadge = (status?: string, reportCount?: number) => {
    if (reportCount && reportCount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <FlagIcon className="h-4 w-4 mr-1" />
          {reportCount} Report{reportCount > 1 ? 's' : ''}
        </span>
      );
    }
    
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Pending
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Suspended
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Banned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Active
          </span>
        );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={goBackToProfiles}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        userName={`${profile?.user.firstName} ${profile?.user.lastName}`}
        isLoading={actionLoading}
      />

      {/* Suspension Modal */}
      <SuspensionModal
        isOpen={showSuspensionModal}
        onClose={() => setShowSuspensionModal(false)}
        onConfirm={handleSuspendConfirm}
        userName={`${profile?.user.firstName} ${profile?.user.lastName}`}
        isLoading={actionLoading}
      />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <button
                  onClick={goBackToProfiles}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                    {profile.user.firstName} {profile.user.lastName}
                  </h1>
                  <div className="mt-1 flex items-center space-x-4">
                    {getStatusBadge(profile.status, profile.reportCount)}
                    {profile.openToWork && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Open to Opportunities
                      </span>
                    )}
                    {/* Membership Access Pill */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      profile.user.membershipAccess === 'BELL_REGISTRY_REFERRAL' 
                        ? 'bg-purple-100 text-purple-800' 
                        : profile.user.membershipAccess === 'PROFESSIONAL_REFERRAL'
                        ? 'bg-orange-100 text-orange-800'
                        : profile.user.membershipAccess === 'NEW_APPLICANT'
                        ? 'bg-green-100 text-green-800'
                        : profile.user.membershipAccess === 'EMPLOYER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {profile.user.membershipAccess === 'BELL_REGISTRY_REFERRAL' && 'Bell Registry Referral'}
                      {profile.user.membershipAccess === 'PROFESSIONAL_REFERRAL' && 'Professional Referral'}
                      {profile.user.membershipAccess === 'NEW_APPLICANT' && 'New Applicant'}
                      {profile.user.membershipAccess === 'EMPLOYER' && 'Employer'}
                      {profile.user.membershipAccess === 'AGENCY' && 'Agency'}
                    </span>
                  </div>
                  {/* Referral Professional Name (if applicable) */}
                  {profile.user.membershipAccess === 'PROFESSIONAL_REFERRAL' && profile.user.referralProfessionalName && (
                    <div className="mt-2 text-sm text-gray-600">
                      Referred by: <span className="font-medium">{profile.user.referralProfessionalName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              {/* Show Approve button for non-approved profiles */}
              {profile.status !== 'APPROVED' && (
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </button>
              )}

              {/* Dynamic Suspend/Unsuspend button */}
              {profile.status === 'SUSPENDED' ? (
                <button
                  onClick={() => handleAction('unsuspend')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Unsuspend
                </button>
              ) : (
                <button
                  onClick={handleSuspendClick}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Suspend
                </button>
              )}

              {/* Dynamic Ban/Unban button */}
              {profile.status === 'BANNED' ? (
                <button
                  onClick={() => handleAction('unban')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => handleAction('ban')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Ban
                </button>
              )}

              {/* Flag button (always available) */}
              <button
                onClick={() => handleAction('flag')}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                <FlagIcon className="h-4 w-4 mr-2" />
                Flag
              </button>

              {/* Delete button (always available) */}
              <button
                onClick={handleDeleteClick}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex-shrink-0">
                  {profile.user.image ? (
                    <img
                      className="h-20 w-20 rounded-full object-cover"
                      src={profile.user.image}
                      alt=""
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.user.firstName} {profile.user.lastName}
                  </h2>
                  {profile.preferredRole && (
                    <p className="text-lg text-gray-600">{profile.preferredRole}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {profile.profileViews} views
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Joined {new Date(profile.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
                  <p className="text-gray-900">{profile.bio}</p>
                </div>
              )}

              {/* What I'm Seeking */}
              {profile.whatImSeeking && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">What I'm Seeking</h3>
                  <p className="text-gray-900">{profile.whatImSeeking}</p>
                </div>
              )}

              {/* What Sets Me Apart */}
              {profile.whatSetsApartMe && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">What Sets Me Apart</h3>
                  <p className="text-gray-900">{profile.whatSetsApartMe}</p>
                </div>
              )}

              {/* Why I Enjoy This Work */}
              {profile.whyIEnjoyThisWork && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Why I Enjoy This Work</h3>
                  <p className="text-gray-900">{profile.whyIEnjoyThisWork}</p>
                </div>
              )}

              {/* Ideal Environment */}
              {profile.idealEnvironment && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Ideal Work Environment</h3>
                  <p className="text-gray-900">{profile.idealEnvironment}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {profile.experience.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Experience</h3>
                  <div className="space-y-4">
                    {profile.experience.map((exp: any, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <h4 className="font-medium text-gray-900">{exp.title || 'Position'}</h4>
                        </div>
                        {exp.company && (
                          <p className="text-gray-600">{exp.company}</p>
                        )}
                        {(exp.startDate || exp.endDate) && (
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notes - Full Width */}
            {session?.user && (
              <AdminNotes
                userId={profile.user.id}
                notes={profile.adminNotes || []}
                currentAdminId={session.user.id}
                onNotesUpdate={fetchProfile}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900">{profile.user.email}</span>
                </div>
                {profile.user.phoneNumber && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{profile.user.phoneNumber}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <a
                    href={`https://app.bellregistry.com/dashboard/view-profile/${profile.user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View Profile
                  </a>
                </div>

              </div>
            </div>

            {/* Work Preferences */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Work Preferences</h3>
              <div className="space-y-3">
                {profile.payRangeMin && profile.payRangeMax && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Salary Range</h4>
                    <p className="text-sm text-gray-900">
                      ${profile.payRangeMin.toLocaleString()} - ${profile.payRangeMax.toLocaleString()}
                      {profile.payType && ` (${profile.payType})`}
                    </p>
                  </div>
                )}
                {profile.yearsOfExperience && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Years of Experience</h4>
                    <p className="text-sm text-gray-900">{profile.yearsOfExperience} years</p>
                  </div>
                )}
                {profile.workLocations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Work Locations</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.workLocations.map((location, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Profile Views</span>
                  <span className="text-gray-900">{profile.profileViews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-900">
                    {new Date(profile.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {profile.user.lastLoginAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-gray-900">
                      {new Date(profile.user.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Profile Updated</span>
                  <span className="text-gray-900">
                    {new Date(profile.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 