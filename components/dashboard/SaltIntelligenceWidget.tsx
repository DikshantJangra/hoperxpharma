'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

interface WidgetData {
  unmappedCount: number;
  pendingCount: number;
  activeCount: number;
  recentlyAdded: number;
  oldestPending?: {
    drugId: string;
    name: string;
    daysPending: number;
  };
}

interface SaltIntelligenceWidgetProps {
  storeId: string;
  refreshInterval?: number;
}

export default function SaltIntelligenceWidget({
  storeId,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: SaltIntelligenceWidgetProps) {
  const router = useRouter();
  const [data, setData] = useState<WidgetData>({
    unmappedCount: 0,
    pendingCount: 0,
    activeCount: 0,
    recentlyAdded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Set up auto-refresh
    const interval = setInterval(loadData, refreshInterval);

    return () => clearInterval(interval);
  }, [storeId, refreshInterval]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/salt-intelligence/stats?storeId=${storeId}`);
      const stats = await response.json();
      setData(stats);
    } catch (error) {
      console.error('Failed to load salt intelligence stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Navigate to bulk correction tool with SALT_PENDING filter
    router.push('/inventory/maintenance?status=SALT_PENDING');
  };

  const getStatusColor = () => {
    if (data.unmappedCount === 0) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <FiCheckCircle className="h-6 w-6 text-green-600" />,
        text: 'text-green-800',
      };
    } else if (data.unmappedCount <= 10) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <FiClock className="h-6 w-6 text-yellow-600" />,
        text: 'text-yellow-800',
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <FiAlertCircle className="h-6 w-6 text-red-600" />,
        text: 'text-red-800',
      };
    }
  };

  // Check if oldest pending is > 7 days
  const hasUrgentItems =
    data.oldestPending && data.oldestPending.daysPending > 7;

  const statusColor = hasUrgentItems
    ? {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <FiAlertCircle className="h-6 w-6 text-red-600" />,
        text: 'text-red-800',
      }
    : getStatusColor();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${statusColor.bg} border-2 ${statusColor.border}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Salt Intelligence</h3>
          <p className="text-sm text-gray-600">Medicine composition status</p>
        </div>
        {statusColor.icon}
      </div>

      <div className="space-y-3">
        {/* Unmapped Count */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Unmapped Medicines:</span>
          <span className={`text-2xl font-bold ${statusColor.text}`}>
            {data.unmappedCount}
          </span>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-600">Pending</div>
            <div className="text-lg font-semibold text-orange-600">
              {data.pendingCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Active</div>
            <div className="text-lg font-semibold text-green-600">
              {data.activeCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Recent</div>
            <div className="text-lg font-semibold text-blue-600">
              {data.recentlyAdded}
            </div>
          </div>
        </div>

        {/* Oldest Pending Alert */}
        {data.oldestPending && (
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-600 mb-1">Oldest Pending:</div>
            <div className="text-sm font-medium truncate">
              {data.oldestPending.name}
            </div>
            <div className="text-xs text-red-600">
              {data.oldestPending.daysPending} days pending
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {data.unmappedCount > 0 ? 'Review Pending' : 'View All'}
        </Button>
      </div>
    </Card>
  );
}
