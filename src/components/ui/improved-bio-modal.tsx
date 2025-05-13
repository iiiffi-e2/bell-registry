import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImprovedBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalBio: string;
  improvedBio: string;
  onAccept: (bio: string) => void;
  isLoading?: boolean;
}

export default function ImprovedBioModal({
  isOpen,
  onClose,
  originalBio,
  improvedBio,
  onAccept,
  isLoading = false,
}: ImprovedBioModalProps) {
  const [editedBio, setEditedBio] = useState(improvedBio);

  // Update editedBio when improvedBio changes
  useEffect(() => {
    setEditedBio(improvedBio);
  }, [improvedBio]);

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

        <div className="fixed inset-0 z-50 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Improved Bio
                    </Dialog.Title>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Original Bio
                      </label>
                      <div className="mt-1">
                        <div className="block w-full rounded-md border-gray-300 bg-gray-50 p-2 text-gray-500 sm:text-sm">
                          {originalBio}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="improved-bio" className="block text-sm font-medium text-gray-700">
                        AI-Improved Bio {isLoading && "(Generating...)"}
                      </label>
                      <div className="mt-1 relative">
                        {isLoading ? (
                          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Improving your bio with AI...</span>
                          </div>
                        ) : (
                          <textarea
                            id="improved-bio"
                            rows={8}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={editedBio}
                            onChange={(e) => setEditedBio(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onAccept(editedBio)}
                    disabled={isLoading}
                  >
                    Accept Changes
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 