'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiBell } from 'react-icons/fi';
import { alertsApi } from '@/lib/api/alerts';

interface AlertPreferencesPageProps { }

const categories = [
    { id: 'INVENTORY', name: 'Inventory', description: 'Expiry, low stock, and batch alerts' },
    { id: 'SECURITY', name: 'Security', description: 'Login attempts and access alerts' },
    { id: 'PATIENT', name: 'Patient', description: 'Refill reminders and prescriptions' },
    { id: 'BILLING', name: 'Billing', description: 'Payment failures and invoices' },
    { id: 'SYSTEM', name: 'System', description: 'Platform updates and maintenance' },
] as const;

const channels = [
    { id: 'IN_APP', name: 'In-App Notifications', disabled: false },
    { id: 'EMAIL', name: 'Email', disabled: false },
    { id: 'WHATSAPP', name: 'WhatsApp', disabled: true },
    { id: 'SMS', name: 'SMS', disabled: true },
] as const;

export default function AlertPreferencesPage() {
    const [preferences, setPreferences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const data = await alertsApi.getPreferences();
            if (data) {
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCategory = (categoryId: string) => {
        setPreferences((prev) =>
            prev.map((pref) =>
                pref.category === categoryId ? { ...pref, enabled: !pref.enabled } : pref
            )
        );
    };

    const handleToggleChannel = (categoryId: string, channelId: string) => {
        setPreferences((prev) =>
            prev.map((pref) => {
                if (pref.category === categoryId) {
                    const channels = pref.channels || [];
                    const hasChannel = channels.includes(channelId);
                    return {
                        ...pref,
                        channels: hasChannel
                            ? channels.filter((c: string) => c !== channelId)
                            : [...channels, channelId],
                    };
                }
                return pref;
            })
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await alertsApi.updatePreferences(preferences);
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Alert Preferences</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Customize how and when you receive notifications
                </p>
            </div>

            <div className="space-y-6">
                {categories.map((category) => {
                    const pref = preferences.find((p) => p.category === category.id) || {
                        category: category.id,
                        enabled: true,
                        channels: ['IN_APP'],
                    };

                    return (
                        <div
                            key={category.id}
                            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <FiBell className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                            <p className="text-sm text-gray-500">{category.description}</p>
                                        </div>
                                    </div>

                                    {pref.enabled && (
                                        <div className="mt-4 ml-8">
                                            <p className="mb-2 text-sm font-medium text-gray-700">Channels:</p>
                                            <div className="space-y-2">
                                                {channels.map((channel) => (
                                                    <label
                                                        key={channel.id}
                                                        className={`flex items-center gap-2 ${channel.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={pref.channels?.includes(channel.id) || false}
                                                            onChange={() => handleToggleChannel(category.id, channel.id)}
                                                            disabled={channel.disabled || channel.id === 'IN_APP'}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{channel.name}</span>
                                                        {channel.disabled && (
                                                            <span className="text-xs text-gray-400">(Coming soon)</span>
                                                        )}
                                                        {channel.id === 'IN_APP' && (
                                                            <span className="text-xs text-gray-400">(Always enabled)</span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={pref.enabled}
                                        onChange={() => handleToggleCategory(category.id)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus :ring-4 peer-focus:ring-blue-300"></div>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FiSave className="h-4 w-4" />
                            Save Preferences
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
