import React, { useState } from 'react';
import { rbacApi } from '@/lib/api/rbac';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

interface AdminPinModalProps {
    onSuccess: () => void;
    onCancel: () => void;
    mode: 'setup' | 'verify' | 'change';
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onSuccess, onCancel, mode }) => {
    const [pin, setPin] = useState('');
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'setup') {
                if (pin.length !== 6 || !/^\d+$/.test(pin)) {
                    setError('PIN must be exactly 6 digits');
                    setLoading(false);
                    return;
                }
                await rbacApi.setupAdminPin(pin);
            } else if (mode === 'verify') {
                await rbacApi.verifyAdminPin(pin);
            } else if (mode === 'change') {
                if (newPin !== confirmPin) {
                    setError('New PINs do not match');
                    setLoading(false);
                    return;
                }
                if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
                    setError('PIN must be exactly 6 digits');
                    setLoading(false);
                    return;
                }
                await rbacApi.changeAdminPin(oldPin, newPin);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-6">
                    <FaLock className="text-emerald-600 text-2xl" />
                    <h2 className="text-xl font-semibold">
                        {mode === 'setup' && 'Setup Admin PIN'}
                        {mode === 'verify' && 'Verify Admin PIN'}
                        {mode === 'change' && 'Change Admin PIN'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'setup' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter 6-digit PIN
                            </label>
                            <div className="relative">
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showPin ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'verify' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter your PIN
                            </label>
                            <div className="relative">
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showPin ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'change' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current PIN
                                </label>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={oldPin}
                                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New PIN
                                </label>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New PIN
                                </label>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={showPin}
                                        onChange={(e) => setShowPin(e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Show PIN
                                </label>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
