'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export default function RightPanel({
    isOpen,
    onClose,
    title,
    children,
    width = 'max-w-md'
}: RightPanelProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop with Blur */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className={`pointer-events-auto w-screen ${width}`}>
                                    <div className="flex h-full flex-col bg-white shadow-2xl">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                                            <Dialog.Title className="text-lg font-bold text-gray-900">
                                                {title}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <span className="sr-only">Close panel</span>
                                                <FiX className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6">
                                            {children}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
