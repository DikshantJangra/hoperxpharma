"use client";

import React, { useState, useEffect } from "react";
import { FiUsers, FiPlus, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { patientsApi } from "@/lib/api/patients";

interface PatientConnectionsTabProps {
    patient: any;
    onUpdate: () => void;
}

export default function PatientConnectionsTab({ patient, onUpdate }: PatientConnectionsTabProps) {
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [relationType, setRelationType] = useState("FAMILY");

    useEffect(() => {
        loadConnections();
    }, [patient.id]);

    const loadConnections = async () => {
        try {
            setLoading(true);
            // Directly fetch from API
            // Since we don't have the SDK method yet, we use fetch
            const response = await fetch(`/api/v1/patients/${patient.id}/relations`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) setConnections(result.data);
            }
        } catch (error) {
            console.error("Error loading connections:", error);
            toast.error("Failed to load connections");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await patientsApi.getPatients({ search: query, limit: 5 });
            if (response.success) {
                // Filter out current patient and existing connections
                const existingIds = new Set(connections.map(c => c.id).concat(patient.id));
                setSearchResults(response.data.filter((p: any) => !existingIds.has(p.id)));
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddConnection = async () => {
        if (!selectedPatient || !relationType) return;

        try {
            setSaving(true);
            const response = await fetch(`/api/v1/patients/${patient.id}/relations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    relatedPatientId: selectedPatient.id,
                    relationType
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Connection added successfully");
                setShowAddForm(false);
                setSelectedPatient(null);
                setSearchQuery("");
                loadConnections();
            } else {
                toast.error(result.message || "Failed to add connection");
            }
        } catch (error) {
            console.error("Add connection error:", error);
            toast.error("Failed to add connection");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveConnection = async (relatedPatientId: string) => {
        if (!confirm("Are you sure you want to remove this connection?")) return;

        try {
            const response = await fetch(`/api/v1/patients/${patient.id}/relations/${relatedPatientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                toast.success("Connection removed");
                loadConnections();
            } else {
                toast.error("Failed to remove connection");
            }
        } catch (error) {
            console.error("Remove connection error:", error);
            toast.error("Failed to remove connection");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-teal-600" />
                        Family & Connections
                    </h3>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-sm bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 flex items-center gap-2 font-medium"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add Connection
                    </button>
                </div>

                {showAddForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-sm font-semibold text-gray-800">Add New Connection</h4>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Search Patient</label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by name or phone..."
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {searchResults.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedPatient(p);
                                                        setSearchQuery(`${p.firstName} ${p.lastName}`);
                                                        setSearchResults([]);
                                                    }}
                                                    className="p-2 hover:bg-teal-50 cursor-pointer text-sm"
                                                >
                                                    <div className="font-medium">{p.firstName} {p.lastName}</div>
                                                    <div className="text-xs text-gray-500">{p.phoneNumber}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPatient && (
                                <div className="p-3 bg-white border border-teal-100 rounded-md mb-2">
                                    <div className="text-sm font-medium text-teal-900">Selected: {selectedPatient.firstName} {selectedPatient.lastName}</div>
                                    <div className="text-xs text-gray-500">{selectedPatient.phoneNumber}</div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
                                <select
                                    value={relationType}
                                    onChange={(e) => setRelationType(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-teal-500"
                                >
                                    <option value="FAMILY">Family Member</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="CHILD">Child</option>
                                    <option value="SPOUSE">Spouse</option>
                                    <option value="BROTHER">Brother</option>
                                    <option value="SISTER">Sister</option>
                                    <option value="SIBLING">Sibling</option>
                                    <option value="GRANDPARENT">Grandparent</option>
                                    <option value="GRANDCHILD">Grandchild</option>
                                    <option value="FRIEND">Friend</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleAddConnection}
                                    disabled={!selectedPatient || saving}
                                    className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {saving ? 'Saving...' : 'Save Connection'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Loading connections...</div>
                ) : connections.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {connections.map((conn) => (
                            <div key={conn.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                                        {conn.firstName[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">{conn.firstName} {conn.lastName}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-medium px-2 py-0.5 bg-gray-200 rounded text-gray-700 uppercase">{conn.relationType}</span>
                                            <span>•</span>
                                            <span>{conn.phoneNumber}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemoveConnection(conn.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                    title="Remove Connection"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No connections found</p>
                        <p className="text-xs text-gray-400 mt-1">Add family members to manage their prescriptions easily</p>
                    </div>
                )}
            </div>
        </div>
    );
}
