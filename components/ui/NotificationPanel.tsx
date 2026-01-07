'use client';

import React, { useState } from 'react';
import { FiX, FiCheck, FiClock, FiBell } from 'react-icons/fi';
import { useAlerts } from '@/contexts/AlertContext';
import { useRouter } from 'next/navigation';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const { alerts, isLoading, markAsSeen, resolveAlert, snoozeAlert } = useAlerts();
    const [activeFilter, setActiveFilter] = useState<'all' | 'INVENTORY' | 'SECURITY'>('all');
    const router = useRouter();

    if (!isOpen) return null;

    const filteredAlerts = alerts.filter((alert) =>
        activeFilter === 'all' ? true : alert.category === activeFilter
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL':
                return 'border-l-4 border-red-500 bg-red-50';
            case 'HIGH':
                return 'border-l-4 border-orange-500 bg-orange-50';
            case 'MEDIUM':
                return 'border-l-4 border-yellow-500 bg-yellow-50';
            default:
                return 'border-l-4 border-blue-500 bg-blue-50';
        }
    };

    const handleAlertClick = (alert: any) => {
        if (!alert.seenAt) {
            markAsSeen(alert.id);
        }
        if (alert.actionUrl) {
            router.push(alert.actionUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <FiX className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 border-b border-gray-200 p-4">
                        {['all', 'INVENTORY', 'SECURITY'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeFilter === filter
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {filter === 'all' ? 'All' : filter}
                            </button>
                        ))}
                    </div>

                    {/* Alert List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                            </div>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FiBell className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${getPriorityColor(
                                            alert.priority
                                        )} ${!alert.seenAt ? 'font-semibold' : ''}`}
                                        onClick={() => handleAlertClick(alert)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                                                <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {new Date(alert.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!alert.seenAt && (
                                                <div className="ml-2 h-2 w-2 rounded-full bg-blue-600" />
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-3 flex gap-2">
                                            {alert.actionUrl && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAlertClick(alert);
                                                    }}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                                >
                                                    {alert.actionLabel || 'View Details'}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resolveAlert(alert.id);
                                                }}
                                                className="text-xs font-medium text-gray-600 hover:text-gray-700"
                                            >
                                                <FiCheck className="inline h-3 w-3" /> Resolve
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const in1Hour = new Date(Date.now() + 60 * 60 * 1000);
                                                    snoozeAlert(alert.id, in1Hour);
                                                }}
                                                className="text-xs font-medium text-gray-600 hover:text-gray-700"
                                            >
                                                <FiClock className="inline h-3 w-3" /> Snooze 1h
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
