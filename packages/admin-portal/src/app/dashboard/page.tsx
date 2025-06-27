'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, BriefcaseIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  totalProfessionals: number;
  totalEmployers: number;
  pendingProfiles: number;
  pendingJobs: number;
  totalJobs: number;
  totalApplications: number;
  activeConversations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProfessionals: 0,
    totalEmployers: 0,
    pendingProfiles: 0,
    pendingJobs: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeConversations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        totalProfessionals: 856,
        totalEmployers: 391,
        pendingProfiles: 23,
        pendingJobs: 8,
        totalJobs: 342,
        totalApplications: 1589,
        activeConversations: 67,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color = 'blue', pending = false }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
    pending?: boolean;
  }) => {
    const iconColorClass = 'h-6 w-6 text-gray-600';
    
    return (
      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Icon className={iconColorClass} />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  {title}
                </dt>
                <dd className='text-lg font-medium text-gray-900'>
                  {loading ? (
                    <div className='animate-pulse bg-gray-200 h-6 w-16 rounded'></div>
                  ) : (
                    <span className={pending && value > 0 ? 'text-orange-600' : ''}>
                      {value.toLocaleString()}
                    </span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {pending && value > 0 && (
          <div className='bg-orange-50 px-5 py-3'>
            <div className='text-sm text-orange-800'>
              Requires attention
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-white shadow'>
        <div className='px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8'>
          <div className='py-6 md:flex md:items-center md:justify-between'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center'>
                <div>
                  <div className='flex items-center'>
                    <h1 className='ml-3 text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate'>
                      Bell Registry Admin Portal
                    </h1>
                  </div>
                  <dl className='mt-6 flex flex-col sm:ml-3 sm:mt-1 sm:flex-row sm:flex-wrap'>
                    <dt className='sr-only'>Status</dt>
                    <dd className='flex items-center text-sm text-gray-500 font-medium capitalize sm:mr-6'>
                      <CheckCircleIcon className='flex-shrink-0 mr-1.5 h-4 w-4 text-green-400' />
                      System Operational
                    </dd>
                    <dt className='sr-only'>Last updated</dt>
                    <dd className='mt-3 flex items-center text-sm text-gray-500 font-medium sm:mr-6 sm:mt-0'>
                      <ClockIcon className='flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400' />
                      Last updated: {new Date().toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Users'
            value={stats.totalUsers}
            icon={UserGroupIcon}
            color='blue'
          />
          <StatCard
            title='Professionals'
            value={stats.totalProfessionals}
            icon={UserGroupIcon}
            color='green'
          />
          <StatCard
            title='Employers'
            value={stats.totalEmployers}
            icon={BriefcaseIcon}
            color='purple'
          />
          <StatCard
            title='Total Jobs'
            value={stats.totalJobs}
            icon={BriefcaseIcon}
            color='indigo'
          />
        </div>

        <div className='mt-8'>
          <h2 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
            Pending Approvals
          </h2>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
            <StatCard
              title='Pending Profiles'
              value={stats.pendingProfiles}
              icon={UserGroupIcon}
              color='orange'
              pending={true}
            />
            <StatCard
              title='Pending Jobs'
              value={stats.pendingJobs}
              icon={BriefcaseIcon}
              color='orange'
              pending={true}
            />
          </div>
        </div>

        <div className='mt-8'>
          <h2 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
            Platform Activity
          </h2>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
            <StatCard
              title='Total Applications'
              value={stats.totalApplications}
              icon={CheckCircleIcon}
              color='green'
            />
            <StatCard
              title='Active Conversations'
              value={stats.activeConversations}
              icon={UserGroupIcon}
              color='blue'
            />
          </div>
        </div>

        <div className='mt-8'>
          <h2 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
            Quick Actions
          </h2>
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                Review Profiles ({stats.pendingProfiles})
              </button>
              <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'>
                Review Jobs ({stats.pendingJobs})
              </button>
              <button className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                View Analytics
              </button>
            </div>
          </div>
        </div>

        <div className='mt-8'>
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <CheckCircleIcon className='h-5 w-5 text-blue-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-blue-800'>
                  Admin Portal Active
                </h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <p>
                    The admin portal is successfully running as a separate service. 
                    This demonstrates the monorepo setup with shared database access and independent deployment capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
