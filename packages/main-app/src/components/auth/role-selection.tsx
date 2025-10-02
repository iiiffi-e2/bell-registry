/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { UserIcon, BuildingOfficeIcon, UsersIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

const roles = [
  {
    id: 'professional',
    title: 'Professional',
    description: 'I am looking for employment opportunities in luxury private service',
    icon: UserIcon,
    href: '/register?role=professional',
    benefits: [
      'Browse exclusive job opportunities',
      'Create a professional profile',
      'Connect with top employers',
      'Access career resources'
    ],
    enabled: true
  },
  {
    id: 'employer',
    title: 'Employer',
    description: 'I am hiring for private service positions',
    icon: BuildingOfficeIcon,
    href: '/register?role=employer',
    benefits: [
      'Post job opportunities',
      'Access qualified candidates',
      'Manage applications',
      'Premium employer tools'
    ],
    enabled: true
  },
  {
    id: 'agency',
    title: 'Agency',
    description: 'I am a staffing agency representing employers',
    icon: UsersIcon,
    href: '/register?role=agency',
    benefits: [
      'Represent multiple employers',
      'Manage client relationships',
      'Access professional network',
      'Agency-specific features'
    ],
    enabled: true
  }
];

export function RoleSelection() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          How would you like to use The Bell Registry?
        </h2>
        <p className="text-sm text-gray-600">
          Choose the option that best describes your role to get started with the right experience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => {
          const isEnabled = role.enabled;

          if (isEnabled) {
            return (
              <Link
                key={role.id}
                href={role.href}
                className="group relative rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200 flex-shrink-0">
                    <role.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {role.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {role.description}
                    </p>
                    
                    <ul className="text-xs text-gray-500 space-y-1">
                      {role.benefits.slice(0, 2).map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md group-hover:bg-blue-700 transition-colors duration-200">
                      Select
                    </div>
                  </div>
                </div>
              </Link>
            );
          } else {
            return (
              <div
                key={role.id}
                className="group relative rounded-lg border-2 border-gray-200 p-4 opacity-60 cursor-not-allowed transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 transition-colors duration-200 flex-shrink-0">
                    <role.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {role.title}
                      <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {role.description}
                    </p>
                    
                    <ul className="text-xs text-gray-500 space-y-1">
                      {role.benefits.slice(0, 2).map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className="px-3 py-1 bg-gray-300 text-gray-500 text-xs rounded-md transition-colors duration-200">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
