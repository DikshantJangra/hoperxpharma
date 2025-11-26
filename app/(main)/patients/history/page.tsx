"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiCalendar, FiFilter } from "react-icons/fi";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSearchParams } from "next/navigation";

export default function PatientHistoryPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") || ""; // Get from URL params
  const { primaryStore } = useAuthStore();

  const [patient, setPatient] = useState<any>(null);
  const [events, setEvents] = useState<any>({ all: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: "all",
    from: "",
    to: "",
    search: ""
  });

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId, filters.eventType, filters.from, filters.to]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientsApi.getPatientHistory(patientId, {
        eventType: filters.eventType === "all" ? undefined : filters.eventType,
        from: filters.from || undefined,
        to: filters.to || undefined
      });

      if (response.success) {
        setPatient(response.data.patient);
        setEvents(response.data.events);
      } else {
        setError(response.message || "Failed to load history");
      }
    } catch (err: any) {
      console.error("Error loading history:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "prescription": return "💊";
      case "sale": return "🛒";
      case "consent": return "📋";
      case "adherence": return "📊";
      default: return "📌";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "prescription": return "bg-blue-50 border-blue-200 text-blue-700";
      case "sale": return "bg-green-50 border-green-200 text-green-700";
      case "consent": return "bg-purple-50 border-purple-200 text-purple-700";
      case "adherence": return "bg-amber-50 border-amber-200 text-amber-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const filteredEvents = events.all.filter((event: any) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower)
    );
  });

  // Group filtered events by date
  const groupedFilteredEvents: any = {};
  filteredEvents.forEach((event: any) => {
    const dateKey = new Date(event.date).toISOString().split('T')[0];
    if (!groupedFilteredEvents[dateKey]) {
      groupedFilteredEvents[dateKey] = [];
    }
    groupedFilteredEvents[dateKey].push(event);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Activity & History</h1>
          {patient ? (
            <p className="text-sm text-gray-500">
              {patient.firstName} {patient.lastName} • ID: {patient.id}
            </p>
          ) : (
            <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={loadHistory} className="text-sm underline">Retry</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiFilter className="w-4 h-4" />
                Filters
              </h3>

              {/* Event Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Events</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="sale">Sales</option>
                  <option value="consent">Consents</option>
                  <option value="adherence">Adherence</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search events..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Export Button */}
              <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                <FiDownload className="w-4 h-4" />
                Export History
              </button>
            </div>
          </aside>

          {/* Main Timeline */}
          <main className="col-span-9">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading history...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFilteredEvents).map(([date, dateEvents]: [string, any]) => (
                  <div key={date} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                      <FiCalendar className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <span className="text-sm text-gray-500">({dateEvents.length} events)</span>
                    </div>

                    <div className="space-y-4">
                      {dateEvents.map((event: any) => (
                        <div
                          key={event.eventId}
                          className={`border rounded-lg p-4 ${getEventColor(event.type)}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getEventIcon(event.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold">{event.title}</h4>
                                <span className="text-xs px-2 py-1 bg-white rounded-full">
                                  {new Date(event.date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm opacity-90">{event.description}</p>
                              {event.status && (
                                <span className="inline-block mt-2 text-xs px-2 py-1 bg-white rounded-full">
                                  Status: {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
