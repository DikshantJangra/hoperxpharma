'use client';

import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiShoppingCart, FiShield, FiAlertCircle } from 'react-icons/fi';
import { patientsApi } from '@/lib/api/patients';

interface TimelineEvent {
    eventId: string;
    type: 'prescription' | 'sale' | 'consent' | 'adherence';
    date: string;
    title: string;
    description: string;
    status: string;
    data: any;
}

interface GroupedEvents {
    date: string;
    events: TimelineEvent[];
}

interface PatientHistoryTimelineProps {
    patientId: string;
}

export default function PatientHistoryTimeline({ patientId }: PatientHistoryTimelineProps) {
    const [timeline, setTimeline] = useState<GroupedEvents[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [patientId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await patientsApi.getPatientHistory(patientId);
            if (data && data.events && data.events.groups) {
                setTimeline(data.events.groups);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
            setError("Could not load patient history");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-8">
                <FiAlertCircle className="w-8 h-8 mx-auto mb-2" />
                {error}
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="text-center text-gray-500 p-8">
                <FiClock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No history events recorded for this patient.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {timeline.map((group, groupIndex) => (
                <div key={group.date} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-gray-50 py-2 mb-4">
                        <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                            {new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    <div className="ml-4 border-l-2 border-gray-200 space-y-8 pb-4">
                        {group.events.map((event, eventIndex) => (
                            <div key={event.eventId} className="relative pl-8">
                                {/* Icon Bubble */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                    ${event.type === 'prescription' ? 'bg-blue-500' :
                                        event.type === 'sale' ? 'bg-green-500' :
                                            event.type === 'consent' ? 'bg-purple-500' :
                                                event.type === 'adherence' ? 'bg-amber-500' : 'bg-gray-400'
                                    }`}>
                                </div>

                                {/* Content Card */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getEventIcon(event.type)}
                                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>

                                    {/* Additional Metadata / Status */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium uppercase
                                            ${event.status === 'completed' || event.status === 'active' ? 'bg-green-100 text-green-700' :
                                                event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getEventIcon(type: string) {
    switch (type) {
        case 'prescription': return <FiFileText className="text-blue-500" />;
        case 'sale': return <FiShoppingCart className="text-green-500" />;
        case 'consent': return <FiShield className="text-purple-500" />;
        case 'adherence': return <FiCheckCircle className="text-amber-500" />;
        default: return <FiClock className="text-gray-400" />;
    }
}
