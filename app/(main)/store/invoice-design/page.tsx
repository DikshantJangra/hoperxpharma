'use client';

import { FiMove, FiLayout, FiType, FiImage, FiSave, FiAlertCircle } from 'react-icons/fi';
import { MdDragIndicator } from 'react-icons/md';

export default function InvoiceDesignPage() {
    return (
        <div className="h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-100 p-8 text-center bg-gradient-to-b from-teal-50/50 to-white">
                        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FiLayout className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Template Builder</h1>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Design professional, feature-rich invoices that match your brand identity perfectly.
                            Drag, drop, and customize every element.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                            <span className="relative flex h-2.5 w-2.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                            Coming Soon
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="p-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Planned Features</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Feature 1 */}
                            <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <FiMove className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Drag & Drop Builder</h4>
                                    <p className="text-sm text-gray-500">
                                        Easily rearrange sections anywhere on the page. Move your logo, address, or totals block with simple drag gestures.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                                    <FiType className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Custom Typography & Labels</h4>
                                    <p className="text-sm text-gray-500">
                                        Rename fields (e.g., "Bill To" &rarr; "Client"), change fonts, sizes, and colors to align with your brand guidelines.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
                                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                                    <FiImage className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Asset Management</h4>
                                    <p className="text-sm text-gray-500">
                                        Upload and position logos, watermarks, and digital signatures. Integration with secure Cloud Storage (R2).
                                    </p>
                                </div>
                            </div>

                            {/* Feature 4 */}
                            <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-100 hover:bg-teal-50/30 transition-colors group">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                    <FiSave className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Save Multiple Templates</h4>
                                    <p className="text-sm text-gray-500">
                                        Create specific templates for different needs: "GST Invoice", "Estimate", "Delivery Challan", or "Export Invoice".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Preview (Mockup) */}
                    <div className="bg-gray-50 border-t border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Builder Preview</h3>
                            <span className="text-xs text-gray-400 italic">Concept Interaction</span>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 relative min-h-[300px] flex flex-col items-center justify-center border-dashed">
                            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

                            <div className="relative z-10 text-center animate-pulse">
                                <div className="w-64 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <MdDragIndicator /> Drop Header Component
                                    </span>
                                </div>
                                <div className="w-full h-4 bg-gray-100 rounded w-96 mx-auto mb-2"></div>
                                <div className="w-full h-4 bg-gray-100 rounded w-64 mx-auto"></div>
                            </div>

                            <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md opacity-50">
                                Editor Mode: Active
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
