'use client';

import { useState } from 'react';
import { FiDownload, FiTrash2, FiShield, FiCheckCircle } from 'react-icons/fi';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { tokenManager, apiClient } from '@/lib/api/client';

export default function PrivacySettingsPage() {
    const [exporting, setExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            const blob = await apiClient.get(`/gdpr/export?format=${exportFormat}`, {
                responseType: 'blob'
            });

            // Download the file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-data-${Date.now()}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const data = await apiClient.post('/gdpr/delete-account', { reason: 'User requested deletion' });
            toast.success(data.message || 'Account deletion requested');
            setShowDeleteConfirm(false);
        } catch (error) {
            toast.error('Failed to request account deletion');
        }
    };

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
                <p className="text-gray-600 mt-2">
                    Manage your data, privacy preferences, and GDPR rights
                </p>
            </div>

            <div className="space-y-6">
                {/* Data Export Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <FiDownload className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">Export Your Data</h2>
                            <p className="text-gray-600 mt-2">
                                Download a complete copy of all your data stored in HopeRxPharma.
                                This includes your profile, patients, prescriptions, and sales records.
                            </p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Export Format
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setExportFormat('json')}
                                            className={`px-4 py-2 rounded-lg border transition-colors ${exportFormat === 'json'
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            JSON
                                        </button>
                                        <button
                                            onClick={() => setExportFormat('csv')}
                                            className={`px-4 py-2 rounded-lg border transition-colors ${exportFormat === 'csv'
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            CSV
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExportData}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    <FiDownload className={exporting ? 'animate-bounce' : ''} />
                                    {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <FiShield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800">
                                        <strong>GDPR Right to Data Portability:</strong> You have the right to receive your personal data in a structured, commonly used format.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Privacy Rights Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <FiCheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">Your Privacy Rights</h2>
                            <p className="text-gray-600 mt-2">
                                Under GDPR and DPDPA, you have the following rights:
                            </p>

                            <ul className="mt-4 space-y-2">
                                {[
                                    'Right to Access - View all your personal data',
                                    'Right to Portability - Download your data',
                                    'Right to Erasure - Request account deletion',
                                    'Right to Rectification - Update incorrect data',
                                    'Right to Restrict Processing - Limit how we use your data',
                                ].map((right, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-green-600 mt-0.5">✓</span>
                                        {right}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Delete Account Section */}
                <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <FiTrash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
                            <p className="text-gray-600 mt-2">
                                Permanently delete your account and all associated data.
                            </p>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Request Account Deletion
                                </button>
                            ) : (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-3 mb-4">
                                        <HiOutlineExclamationTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-red-900">Warning: This action cannot be undone</p>
                                            <p className="text-sm text-red-700 mt-1">
                                                All your data will be permanently deleted. Financial records may be retained for legal compliance.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            Yes, Delete My Account
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> Account deletion requests are processed within 30 days as per GDPR requirements.
                                    Contact support if you need immediate assistance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
