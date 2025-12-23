'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiUserCheck, FiPackage } from 'react-icons/fi';

interface RecipientGroup {
    id: string;
    name: string;
    description: string;
    count: number;
    type: string;
    icon: string;
}

interface QuickGroupSelectorProps {
    onRecipientsSelected?: (recipients: any[]) => void;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export default function QuickGroupSelector({ onRecipientsSelected }: QuickGroupSelectorProps) {
    const [groups, setGroups] = useState<RecipientGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/email/groups', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setGroups(data.data?.groups || []);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGroupClick = async (groupId: string) => {
        try {
            const response = await fetch(`/api/v1/email/groups/${groupId}/recipients`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const recipients = data.data?.recipients || [];

                // Pass recipients to parent to add to To field
                if (recipients.length > 0 && onRecipientsSelected) {
                    onRecipientsSelected(recipients);
                }
            }
        } catch (error) {
            console.error('Failed to fetch group recipients:', error);
        }
    };

    const getGroupIcon = (icon: string) => {
        switch (icon) {
            case 'users':
                return <FiUsers className="w-4 h-4" />;
            case 'activity':
                return <FiActivity className="w-4 h-4" />;
            case 'user-check':
                return <FiUserCheck className="w-4 h-4" />;
            case 'package':
                return <FiPackage className="w-4 h-4" />;
            default:
                return <FiUsers className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
                <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupClick(group.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:border-[#10b981] hover:bg-[#f0fdf4] transition-colors text-sm group"
                    title={group.description}
                >
                    <span className="text-[#64748b] group-hover:text-[#10b981] transition-colors">
                        {getGroupIcon(group.icon)}
                    </span>
                    <span className="font-medium text-[#0f172a]">{group.name}</span>
                    <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] text-xs rounded-full group-hover:bg-[#d1fae5] group-hover:text-[#10b981] transition-colors">
                        {group.count}
                    </span>
                </button>
            ))}
        </div>
    );
}
