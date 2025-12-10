'use client';

import React from 'react';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { FiCommand, FiSettings, FiCheckCircle, FiMonitor } from 'react-icons/fi';
import { MdKeyboardArrowRight, MdKeyboard } from 'react-icons/md';

export default function KeyboardShortcutsPage() {
    const { navigationMode, toggleNavigationMode, keyBindings } = useKeyboard();

    // Group bindings for better display (mocking categories for now based on context)
    const groupedBindings = {
        'General Navigation': {
            'Next Field': keyBindings['Next Field'],
            'Previous Field': keyBindings['Previous Field'],
        },
        'Forms & Actions': {
            'Submit': keyBindings['Submit'],
            'Next Field (Alt)': keyBindings['Next Field (Alt)'],
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Keyboard Preferences</h1>
                        <p className="text-gray-500 mt-1">Customize your navigation experience and view shortcuts.</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Navigation Mode */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-[#0ea5a3]/10 rounded-lg text-[#0ea5a3]">
                                    <FiSettings size={20} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">Navigation Mode</h2>
                                    <p className="text-sm text-gray-500">How you move between fields</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Tab Mode Card */}
                                <div
                                    onClick={() => navigationMode !== 'tab' && toggleNavigationMode()}
                                    className={`relative cursor-pointer group p-5 rounded-xl border-2 transition-all duration-200 ${navigationMode === 'tab'
                                        ? 'border-[#0ea5a3] bg-[#0ea5a3]/5 ring-1 ring-[#0ea5a3]/20'
                                        : 'border-gray-200 hover:border-[#0ea5a3]/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${navigationMode === 'tab' ? 'bg-[#0ea5a3] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <MdKeyboard size={24} />
                                        </div>
                                        {navigationMode === 'tab' && (
                                            <FiCheckCircle className="text-[#0ea5a3]" size={24} />
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Standard (Tab)</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Use <kbd className="font-sans px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">Tab</kbd> to move next. Best for general web usage.
                                    </p>
                                </div>

                                {/* Enter Mode Card */}
                                <div
                                    onClick={() => navigationMode !== 'enter' && toggleNavigationMode()}
                                    className={`relative cursor-pointer group p-5 rounded-xl border-2 transition-all duration-200 ${navigationMode === 'enter'
                                        ? 'border-[#0ea5a3] bg-[#0ea5a3]/5 ring-1 ring-[#0ea5a3]/20'
                                        : 'border-gray-200 hover:border-[#0ea5a3]/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${navigationMode === 'enter' ? 'bg-[#0ea5a3] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <FiCommand size={24} />
                                        </div>
                                        {navigationMode === 'enter' && (
                                            <FiCheckCircle className="text-[#0ea5a3]" size={24} />
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Data Entry (Enter)</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Use <kbd className="font-sans px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">Enter</kbd> to move next. Best for rapid POS usage.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <FiMonitor size={20} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900">Current Shortcuts</h2>
                                    <p className="text-sm text-gray-500">Active key bindings for the application</p>
                                </div>
                            </div>

                            <div className="p-0">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 text-left text-xs uppercase text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4">Key Combination</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.entries(keyBindings).map(([action, key]) => (
                                            <tr key={action} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{action}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono font-medium text-gray-700 shadow-sm">
                                                        {key}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Tips */}
                    <div className="space-y-6">
                        <div className="bg-[#0ea5a3] text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Did you know?</h3>
                                <p className="text-white/90 text-sm leading-relaxed mb-4">
                                    Using 'Enter' navigation is 30% faster for high-volume data entry tasks like pharmacy billing and inventory updates.
                                </p>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full blur-xl" />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Tips</h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-sm text-gray-600">
                                    <MdKeyboardArrowRight className="text-[#0ea5a3] flex-shrink-0 mt-0.5" size={18} />
                                    <span>Press <strong>Shift + Tab</strong> to move backwards in any mode.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-600">
                                    <MdKeyboardArrowRight className="text-[#0ea5a3] flex-shrink-0 mt-0.5" size={18} />
                                    <span>Use <strong>Enter</strong> to submit forms when you're on the last field or Submit button.</span>
                                </li>
                                <li className="flex gap-3 text-sm text-gray-600">
                                    <MdKeyboardArrowRight className="text-[#0ea5a3] flex-shrink-0 mt-0.5" size={18} />
                                    <span>These settings are saved to your user profile and will sync across devices.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
