'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FiClock, FiCheck, FiEdit, FiRepeat, FiDollarSign,
    FiPackage, FiFileText, FiUser, FiAlertCircle, FiTrash2,
    FiLock, FiUnlock, FiEye, FiActivity
} from 'react-icons/fi';

interface HistoryTabProps {
    prescription: any;
}

interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    actor?: string;
    metadata?: any;
    icon: any;
    color: string;
}

export default function HistoryTab({ prescription }: HistoryTabProps) {
    // Build comprehensive timeline from all sources
    const buildTimeline = (): TimelineEvent[] => {
        const events: TimelineEvent[] = [];

        // 1. FROM AUDIT LOGS - Most comprehensive source
        if (prescription.auditLogs && prescription.auditLogs.length > 0) {
            prescription.auditLogs.forEach((log: any) => {
                const actorName = log.user
                    ? `${log.user.firstName} ${log.user.lastName}`.trim()
                    : 'System';

                // Map audit actions to timeline events
                const eventMapping: Record<string, any> = {
                    'PRESCRIPTION_CREATE': {
                        title: 'Prescription Created',
                        icon: FiFileText,
                        color: 'blue',
                        description: `Created as ${log.changes?.status || 'DRAFT'}`
                    },
                    'PRESCRIPTION_UPDATE': {
                        title: 'Prescription Updated',
                        icon: FiEdit,
                        color: 'purple',
                        description: 'Prescription details modified'
                    },
                    'PRESCRIPTION_FILE_DELETE': {
                        title: 'Document Deleted',
                        icon: FiTrash2,
                        color: 'red',
                        description: 'Prescription document removed'
                    },
                    'PRESCRIPTION_VERIFY': {
                        title: 'Verified',
                        icon: FiLock,
                        color: 'green',
                        description: 'Prescription clinically verified'
                    },
                    'PRESCRIPTION_HOLD': {
                        title: 'Put on Hold',
                        icon: FiAlertCircle,
                        color: 'orange',
                        description: log.changes?.reason || 'Prescription placed on hold'
                    },
                    'REFILL_CREATE': {
                        title: 'Refill Created',
                        icon: FiRepeat,
                        color: 'teal',
                        description: `Refill #${log.changes?.refillNumber || 'N/A'} created`
                    },
                    'DISPENSE_CREATE': {
                        title: 'Dispensed',
                        icon: FiCheck,
                        color: 'green',
                        description: 'Prescription dispensed to patient'
                    },
                    'REFILL_DISPENSE': {
                        title: 'Refill Dispensed',
                        icon: FiCheck,
                        color: 'blue',
                        description: 'Medications dispensed via refill'
                    },
                    'PRESCRIPTION_COMPLETED': {
                        title: 'Completed',
                        icon: FiCheck,
                        color: 'emerald',
                        description: log.changes?.reason || 'All medications dispensed'
                    },
                    'PRESCRIPTION_EXPIRED': {
                        title: 'Expired',
                        icon: FiClock,
                        color: 'gray',
                        description: 'Prescription validity period ended'
                    },
                    'PRESCRIPTION_DISPENSED': {
                        title: 'Dispensed (POS)',
                        icon: FiDollarSign,
                        color: 'green',
                        description: `Sold via Invoice #${log.metadata?.invoiceNumber || 'N/A'}`
                    }
                };

                const eventConfig = eventMapping[log.action] || {
                    title: log.action.replace(/_/g, ' '),
                    icon: FiActivity,
                    color: 'gray',
                    description: 'Activity recorded'
                };

                events.push({
                    id: `audit-${log.id}`,
                    type: log.action.toLowerCase(),
                    title: eventConfig.title,
                    description: eventConfig.description,
                    timestamp: new Date(log.createdAt),
                    actor: actorName !== 'System' ? actorName : undefined,
                    metadata: log.changes,
                    icon: eventConfig.icon,
                    color: eventConfig.color
                });
            });
        }

        // 2. FROM VERSIONS - Track edits
        if (prescription.versions && prescription.versions.length > 1) {
            prescription.versions.slice(1).forEach((version: any) => {
                // Only add if not already captured in audit logs
                const alreadyLogged = events.some(e =>
                    e.type === 'prescription_update' &&
                    Math.abs(new Date(e.timestamp).getTime() - new Date(version.createdAt).getTime()) < 1000
                );

                if (!alreadyLogged) {
                    events.push({
                        id: `version-${version.id}`,
                        type: 'version',
                        title: `Updated to Version ${version.versionNumber}`,
                        description: version.instructions || 'Prescription details updated',
                        timestamp: new Date(version.createdAt),
                        metadata: {
                            itemsCount: version.items?.length || 0
                        },
                        icon: FiEdit,
                        color: 'purple'
                    });
                }
            });
        }

        // 3. FROM FILES - Track document additions
        if (prescription.files && prescription.files.length > 0) {
            prescription.files.forEach((file: any) => {
                // Only add if not already captured in audit logs
                const alreadyLogged = events.some(e =>
                    e.type.includes('file') &&
                    Math.abs(new Date(e.timestamp).getTime() - new Date(file.createdAt).getTime()) < 1000
                );

                if (!alreadyLogged) {
                    events.push({
                        id: `file-${file.id}`,
                        type: 'file_added',
                        title: 'Document Uploaded',
                        description: 'Prescription document attached',
                        timestamp: new Date(file.createdAt),
                        metadata: {
                            fileUrl: file.fileUrl
                        },
                        icon: FiPackage,
                        color: 'green'
                    });
                }
            });
        }

        // 4. FROM REFILLS - Only valid refills
        const validRefills = prescription.refills?.filter((r: any) =>
            r.processedAt || r.quantityDispensed > 0 || r.daysSupply > 0
        ) || [];

        validRefills.forEach((refill: any) => {
            // Only add if not already captured in audit logs
            const alreadyLogged = events.some(e =>
                e.type === 'refill_create' &&
                e.metadata?.refillNumber === refill.refillNumber
            );

            if (!alreadyLogged) {
                events.push({
                    id: `refill-${refill.id}`,
                    type: 'refilled',
                    title: `Refill #${refill.refillNumber}`,
                    description: `${refill.quantityDispensed || 0} units dispensed${refill.daysSupply ? ` for ${refill.daysSupply} days` : ''}`,
                    timestamp: new Date(refill.processedAt || refill.createdAt),
                    metadata: {
                        quantity: refill.quantityDispensed,
                        daysSupply: refill.daysSupply,
                        notes: refill.notes
                    },
                    icon: FiRepeat,
                    color: 'teal'
                });
            }
        });

        // 5. FROM DISPENSE EVENTS
        if (prescription.dispenseEvents && prescription.dispenseEvents.length > 0) {
            prescription.dispenseEvents.forEach((event: any) => {
                const alreadyLogged = events.some(e =>
                    e.type === 'dispense_create' &&
                    Math.abs(new Date(e.timestamp).getTime() - new Date(event.dispensedAt).getTime()) < 1000
                );

                if (!alreadyLogged) {
                    const totalDispensed = event.items?.reduce((sum: number, item: any) => sum + (item.quantityDispensed || 0), 0) || 0;
                    events.push({
                        id: `dispense-${event.id}`,
                        type: 'dispensed',
                        title: 'Dispensed',
                        description: `${totalDispensed} units dispensed`,
                        timestamp: new Date(event.dispensedAt),
                        metadata: {
                            items: event.items,
                            notes: event.notes
                        },
                        icon: FiCheck,
                        color: 'green'
                    });
                }
            });
        }

        // 6. FROM SALE (if linked)
        if (prescription.sale) {
            events.push({
                id: `sale-${prescription.sale.id}`,
                type: 'payment',
                title: 'Payment Received',
                description: `₹${parseFloat(prescription.sale.totalAmount).toFixed(2)} - ${prescription.sale.paymentMethod}`,
                timestamp: new Date(prescription.sale.createdAt),
                metadata: {
                    amount: prescription.sale.totalAmount,
                    paymentMethod: prescription.sale.paymentMethod,
                    invoiceNumber: prescription.sale.invoiceNumber
                },
                icon: FiDollarSign,
                color: 'emerald'
            });
        }

        // Sort by timestamp (newest first)
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    const timeline = buildTimeline();

    // Count only valid refills
    const validRefillsCount = prescription.refills?.filter((refill: any) =>
        refill.quantityDispensed > 0 || refill.daysSupply > 0 || refill.processedAt
    ).length || 0;

    const getIconColor = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600',
            teal: 'bg-teal-100 text-teal-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            orange: 'bg-orange-100 text-orange-600',
            red: 'bg-red-100 text-red-600',
            gray: 'bg-gray-100 text-gray-600'
        };
        return colors[color] || 'bg-gray-100 text-gray-600';
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Events</div>
                        <div className="text-2xl font-bold text-gray-900">{timeline.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Refills</div>
                        <div className="text-2xl font-bold text-gray-900">{validRefillsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Versions</div>
                        <div className="text-2xl font-bold text-gray-900">{prescription.versions?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</div>
                        <div className="text-2xl font-bold text-gray-900">{prescription.files?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FiClock className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold">Activity Timeline</h3>
                    </div>

                    {timeline.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiAlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No activity recorded yet</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                            {/* Events */}
                            <div className="space-y-6">
                                {timeline.map((event, index) => {
                                    const Icon = event.icon;
                                    return (
                                        <div key={event.id} className="relative pl-14">
                                            {/* Icon */}
                                            <div className={`absolute left-0 w-12 h-12 rounded-full ${getIconColor(event.color)} flex items-center justify-center ring-4 ring-white`}>
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                    </div>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                                        {formatTimestamp(event.timestamp)}
                                                    </span>
                                                </div>

                                                {/* Actor */}
                                                {event.actor && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                                                        <FiUser className="h-3 w-3" />
                                                        <span>{event.actor}</span>
                                                    </div>
                                                )}

                                                {/* Metadata Details */}
                                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                                                        {/* Handle Deviations for Dispensed Events */}
                                                        {event.type === 'prescription_dispensed' && (
                                                            <div className="space-y-1">
                                                                <div className="font-medium text-gray-700">Sale Details:</div>
                                                                <div>• Invoice: <span className="font-mono bg-gray-100 px-1 rounded">{event.metadata.invoiceNumber}</span></div>
                                                                <div>• Amount: ₹{event.metadata.totalAmount}</div>

                                                                {event.metadata.deviations && event.metadata.deviations.length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                                        <div className="text-orange-600 font-medium text-[11px] uppercase tracking-wide mb-1">Deviations from Prescription:</div>
                                                                        {event.metadata.deviations.map((dev: any, i: number) => (
                                                                            <div key={i} className="bg-orange-50 text-orange-700 p-1.5 rounded text-[11px] mb-1">
                                                                                {dev.quantityChanged && (
                                                                                    <div>• Quantity changed: {dev.originalQty} → <strong>{dev.soldQty}</strong></div>
                                                                                )}
                                                                                {dev.mrp !== dev.price && (
                                                                                    <div>• Price changed: ₹{dev.price} (MRP: {dev.mrp})</div>
                                                                                )}
                                                                                {dev.discount > 0 && (
                                                                                    <div>• Discount given: {dev.discount}%</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Status Changes */}
                                                        {(event.type === 'prescription_completed' || event.type === 'prescription_expired') && (
                                                            <div>
                                                                {event.metadata.reason && <div>• Reason: {event.metadata.reason}</div>}
                                                                {event.metadata.totalRefills > 0 && (
                                                                    <div>• Refills Used: {event.metadata.refillsUsed} / {event.metadata.totalRefills}</div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {event.type === 'prescription_create' && event.metadata.itemsCount && (
                                                            <div>• {event.metadata.itemsCount} medication(s) prescribed</div>
                                                        )}
                                                        {event.type === 'refilled' && (
                                                            <>
                                                                {event.metadata.quantity && <div>• Quantity: {event.metadata.quantity} units</div>}
                                                                {event.metadata.daysSupply && <div>• Days Supply: {event.metadata.daysSupply} days</div>}
                                                                {event.metadata.notes && <div className="text-blue-600">• Note: {event.metadata.notes}</div>}
                                                            </>
                                                        )}
                                                        {event.type === 'payment' && (
                                                            <>
                                                                <div>• Amount: ₹{parseFloat(event.metadata.amount).toFixed(2)}</div>
                                                                <div>• Method: {event.metadata.paymentMethod}</div>
                                                                {event.metadata.invoiceNumber && <div>• Invoice: {event.metadata.invoiceNumber}</div>}
                                                            </>
                                                        )}
                                                        {event.type === 'version' && event.metadata.itemsCount && (
                                                            <div>• {event.metadata.itemsCount} medication(s) in this version</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
