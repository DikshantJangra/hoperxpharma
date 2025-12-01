"use client";

import React, { useEffect, useState } from "react";
import { FiClock, FiUser, FiActivity, FiAlertCircle } from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";

interface AuditLog {
    id: string;
    action: string;
    changes: any;
    userId: string;
    createdAt: string;
    ipAddress?: string;
    userAgent?: string;
    user?: {
        name: string;
        email: string;
    };
}

interface PatientAuditLogProps {
    patientId: string;
}

export default function PatientAuditLog({ patientId }: PatientAuditLogProps) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, [patientId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await patientsApi.getAuditLogs(patientId);
            setLogs(data);
        } catch (err: any) {
            console.error("Error loading audit logs:", err);
            setError("Failed to load audit trail");
        } finally {
            setLoading(false);
        }
    };

    const formatChanges = (changes: any) => {
        if (!changes || Object.keys(changes).length === 0) return null;

        return (
            <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 border border-gray-100">
                {Object.entries(changes).map(([field, values]: [string, any]) => (
                    <div key={field} className="flex gap-2">
                        <span className="font-semibold text-gray-700">{field}:</span>
                        <span className="text-red-500 line-through">{values.old || 'null'}</span>
                        <span>→</span>
                        <span className="text-green-600">{values.new || 'null'}</span>
                    </div>
                ))}
            </div>
        );
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATED': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETED': return 'bg-red-100 text-red-700 border-red-200';
            case 'MERGED': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
            <div className="text-center p-8 text-red-500 flex flex-col items-center gap-2">
                <FiAlertCircle className="w-6 h-6" />
                <p>{error}</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center p-12 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                <FiClock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No audit history available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg border ${getActionColor(log.action)}`}>
                                <FiActivity className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{log.action}</span>
                                    <span className="text-sm text-gray-500">by {log.user?.name || 'Unknown'}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                    <FiClock className="w-3 h-3" />
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                                {formatChanges(log.changes)}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
