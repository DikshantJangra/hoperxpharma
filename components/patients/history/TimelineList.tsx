'use client';

import React from 'react';
import { HistoryGroup } from '@/hooks/usePatientHistory';
import EventCard from './EventCard';

interface TimelineListProps {
  events: HistoryGroup[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onSelect: (event: any) => void;
  selectedEventId?: string;
}

export default function TimelineList({ events, loading, onLoadMore, hasMore, onSelect, selectedEventId }: TimelineListProps) {
  if (loading && events.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No activity found in this period. Try a wider date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map(group => (
        <section key={group.date}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              {new Date(group.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {group.count} events
            </h3>
          </div>
          
          <div className="space-y-2 divide-y divide-gray-100">
            {group.items.map(event => (
              <EventCard 
                key={event.eventId}
                event={event}
                isSelected={selectedEventId === event.eventId}
                onClick={() => onSelect(event)}
              />
            ))}
          </div>
        </section>
      ))}

      {hasMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}