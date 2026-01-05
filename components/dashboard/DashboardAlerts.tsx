'use client';

import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useAlerts } from '@/contexts/AlertContext';
import { useRouter } from 'next/navigation';

export function DashboardAlerts() {
    const { alerts, isLoading } = useAlerts();
    const router = useRouter();

    // Filter for CRITICAL and HIGH priority only
    const priorityAlerts = alerts
        .filter((alert) => alert.priority === 'CRITICAL' || alert.priority === 'HIGH')
        .slice(0, 5); // Max 5 alerts

    if (isLoading || priorityAlerts.length === 0) {
        return null;
    }

    const getPriorityStyle = (priority: string) => {
        return priority === 'CRITICAL'
            ? 'border-red-500 bg-red-50'
            : 'border-orange-500 bg-orange-50';
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Priority Alerts
                </h3>
                <button
                    onClick={() => router.push('/alerts')} // You can customize this
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    View All <ChevronRight className="inline h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3">
                {priorityAlerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`cursor-pointer rounded-lg border-l-4 p-4 transition-all hover:shadow-md ${getPriorityStyle(
                            alert.priority
                        )}`}
                        onClick={() => {
                            if (alert.actionUrl) {
                                router.push(alert.actionUrl);
                            }
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${alert.priority === 'CRITICAL'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-orange-100 text-orange-800'
                                            }`}
                                    >
                                        {alert.priority}
                                    </span>
                                    <span className="text-xs text-gray-500">{alert.category}</span>
                                </div>
                                <h4 className="mt-1 font-medium text-gray-900">{alert.title}</h4>
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{alert.description}</p>
                            </div>
                        </div>
                        {alert.actionLabel && (
                            <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                                {alert.actionLabel} →
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
