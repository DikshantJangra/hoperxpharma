'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FaEnvelope, FaSms, FaWhatsapp, FaCheckCircle, FaExclamationTriangle,
    FaArrowRight, FaClock, FaPaperPlane, FaInbox, FaChartLine
} from 'react-icons/fa';
import { useCurrentStore } from '@/hooks/useCurrentStore';

interface ChannelStatus {
    name: string;
    type: 'email' | 'sms' | 'whatsapp';
    icon: React.ReactNode;
    connected: boolean;
    setupUrl: string;
    messageUrl: string;
    stats?: {
        sentToday: number;
        failed: number;
        pending: number;
    };
}

interface RecentMessage {
    id: string;
    channel: 'email' | 'sms' | 'whatsapp';
    to: string;
    preview: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'failed' | 'pending';
}

export default function MessagesOverviewPage() {
    const { storeId, loading: storeLoading } = useCurrentStore();
    const [loading, setLoading] = useState(true);
    const [channels, setChannels] = useState<ChannelStatus[]>([]);
    const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);

    useEffect(() => {
        if (storeId) {
            loadChannelStatus();
            loadRecentMessages();
        }
    }, [storeId]);

    const loadChannelStatus = async () => {
        // TODO: Fetch actual status from backend
        // For now, using mock data
        setChannels([
            {
                name: 'Email',
                type: 'email',
                icon: <FaEnvelope className="w-6 h-6" />,
                connected: true, // Would check from backend
                setupUrl: '/integrations/email',
                messageUrl: '/messages/email',
                stats: {
                    sentToday: 24,
                    failed: 1,
                    pending: 3,
                },
            },
            {
                name: 'SMS',
                type: 'sms',
                icon: <FaSms className="w-6 h-6" />,
                connected: true,
                setupUrl: '/integrations/sms',
                messageUrl: '/messages/sms',
                stats: {
                    sentToday: 12,
                    failed: 0,
                    pending: 0,
                },
            },
            {
                name: 'WhatsApp',
                type: 'whatsapp',
                icon: <FaWhatsapp className="w-6 h-6" />,
                connected: false, // Would check from whatsappApi.getStatus
                setupUrl: '/integrations/whatsapp',
                messageUrl: '/messages/whatsapp',
                stats: {
                    sentToday: 0,
                    failed: 0,
                    pending: 0,
                },
            },
        ]);
        setLoading(false);
    };

    const loadRecentMessages = async () => {
        // TODO: Fetch actual messages from backend
        // For now, using mock data
        setRecentMessages([
            {
                id: '1',
                channel: 'email',
                to: 'patient@example.com',
                preview: 'Your prescription is ready for pickup',
                timestamp: new Date().toISOString(),
                status: 'sent',
            },
            {
                id: '2',
                channel: 'sms',
                to: '+91 98765 43210',
                preview: 'Rx #12345 ready. Pickup at 5pm.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'delivered',
            },
        ]);
    };

    const getChannelColor = (type: string) => {
        switch (type) {
            case 'email': return 'blue';
            case 'sms': return 'purple';
            case 'whatsapp': return 'green';
            default: return 'gray';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Delivered</span>;
            case 'failed':
                return <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">Failed</span>;
            case 'pending':
                return <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>;
            default:
                return null;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    if (loading || storeLoading || !storeId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const connectedChannels = channels.filter(c => c.connected).length;
    const totalSentToday = channels.reduce((sum, c) => sum + (c.stats?.sentToday || 0), 0);
    const totalFailed = channels.reduce((sum, c) => sum + (c.stats?.failed || 0), 0);

    return (
        <div className="p-6 bg-[#f7fafc] min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0f172a]">Messages</h1>
                <p className="text-[#6b7280] mt-2">
                    Manage all your communication channels in one place
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FaInbox className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Connected Channels</div>
                            <div className="text-2xl font-bold text-gray-900">{connectedChannels}/3</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FaPaperPlane className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Sent Today</div>
                            <div className="text-2xl font-bold text-gray-900">{totalSentToday}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Failed</div>
                            <div className="text-2xl font-bold text-gray-900">{totalFailed}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FaChartLine className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">This Month</div>
                            <div className="text-2xl font-bold text-gray-900">342</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Channels Grid */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication Channels</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {channels.map((channel) => (
                        <div
                            key={channel.type}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 bg-${getChannelColor(channel.type)}-100 rounded-lg`}>
                                    {channel.icon}
                                </div>
                                {channel.connected ? (
                                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                        <FaCheckCircle className="w-4 h-4" />
                                        Connected
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                                        <FaClock className="w-4 h-4" />
                                        Not Connected
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{channel.name}</h3>

                            {channel.connected && channel.stats ? (
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Sent today:</span>
                                        <span className="font-medium text-gray-900">{channel.stats.sentToday}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Failed:</span>
                                        <span className="font-medium text-red-600">{channel.stats.failed}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pending:</span>
                                        <span className="font-medium text-yellow-600">{channel.stats.pending}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mb-4">
                                    Connect this channel to start sending messages
                                </p>
                            )}

                            <div className="flex gap-2">
                                {channel.connected ? (
                                    <Link
                                        href={channel.messageUrl}
                                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Open Messages
                                        <FaArrowRight className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={channel.setupUrl}
                                        className="flex-1 px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg text-center text-sm font-medium transition-colors"
                                    >
                                        Connect Now
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Messages */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        View All
                    </button>
                </div>

                {recentMessages.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaInbox className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No messages sent yet</p>
                        <p className="text-sm text-gray-400 mt-1">Messages will appear here once you start sending</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                        {recentMessages.map((message) => (
                            <div key={message.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 bg-${getChannelColor(message.channel)}-100 rounded-lg flex-shrink-0`}>
                                        {message.channel === 'email' && <FaEnvelope className="w-4 h-4 text-blue-600" />}
                                        {message.channel === 'sms' && <FaSms className="w-4 h-4 text-purple-600" />}
                                        {message.channel === 'whatsapp' && <FaWhatsapp className="w-4 h-4 text-green-600" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium text-gray-900">{message.to}</p>
                                            {getStatusBadge(message.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{message.preview}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatTimestamp(message.timestamp)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
