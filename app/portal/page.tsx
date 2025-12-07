'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalApi } from '@/lib/api/portal';
import toast from 'react-hot-toast';
import { FiSmartphone, FiCalendar, FiArrowRight, FiLock } from 'react-icons/fi';

export default function PortalLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        phoneNumber: '',
        dateOfBirth: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await portalApi.verify(form);
            toast.success('Access Verified');
            router.push('/portal/dashboard');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Verification failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center pt-10">
            <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiLock className="w-6 h-6 text-teal-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Secure Access</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Verify your identity to view prescriptions
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                            Phone Number
                        </label>
                        <div className="relative">
                            <FiSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                required
                                value={form.phoneNumber}
                                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                placeholder="9876543210"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                            Date of Birth
                        </label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                required
                                value={form.dateOfBirth}
                                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Access Records'}
                        {!loading && <FiArrowRight />}
                    </button>

                    <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
                        By accessing this portal, you agree to our Terms of Service.
                        Your session is secure and encrypted.
                    </p>
                </form>
            </div>
        </div>
    );
}
