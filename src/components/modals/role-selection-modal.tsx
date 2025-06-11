"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UserIcon, BuildingOfficeIcon, UsersIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles = [
  {
    id: 'professional',
    title: 'Professional',
    description: 'I am looking for employment opportunities in luxury private service',
    icon: UserIcon,
    href: '/register?role=candidate',
    benefits: [
      'Browse exclusive job opportunities',
      'Create a professional profile',
      'Connect with top employers',
      'Access career resources'
    ]
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
    ]
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
    ]
  }
];

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 text-center mb-2">
                      How would you like to use The Bell Registry?
                    </Dialog.Title>
                    <p className="text-center text-gray-600 mb-8">
                      Choose the option that best describes your role to get started with the right experience.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {roles.map((role) => (
                        <Link
                          key={role.id}
                          href={role.href}
                          className="group relative rounded-lg border-2 border-gray-200 p-6 hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
                          onClick={onClose}
                        >
                          <div className="flex flex-col items-center text-center h-full">
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200 mb-4">
                              <role.icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {role.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-4 flex-grow">
                              {role.description}
                            </p>
                            
                            <div className="mt-auto">
                              <ul className="text-xs text-gray-500 space-y-1">
                                {role.benefits.map((benefit, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                              
                              <div className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md group-hover:bg-blue-700 transition-colors duration-200">
                                Get Started as {role.title}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500" onClick={onClose}>
                          Sign in here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 