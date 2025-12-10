'use client';

import React from 'react';
import ModalWrapper from '@/components/ui/ModalWrapper';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { FiCommand, FiCheck } from 'react-icons/fi';

interface KeyBindingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KeyBindingsModal({ isOpen, onClose }: KeyBindingsModalProps) {
    const { navigationMode, toggleNavigationMode, keyBindings } = useKeyboard();

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Keyboard Shortcuts & Settings"
            width="max-w-2xl"
        >
            <div className="p-6">
                {/* Navigation Mode Settings */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiCommand className="text-[#0ea5a3]" />
                        Navigation Settings
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Form Field Navigation</p>
                            <p className="text-sm text-gray-500">Choose which key moves focus to the next field</p>
                        </div>
                        <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                            <button
                                onClick={() => navigationMode !== 'tab' && toggleNavigationMode()}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${navigationMode === 'tab'
                                        ? 'bg-[#0ea5a3] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Tab Key
                            </button>
                            <button
                                onClick={() => navigationMode !== 'enter' && toggleNavigationMode()}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${navigationMode === 'enter'
                                        ? 'bg-[#0ea5a3] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Enter Key
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Bindings List */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Bindings</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortcut</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(keyBindings).map(([action, key]) => (
                                    <tr key={action}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{action}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 font-mono">
                                                {key}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
}
