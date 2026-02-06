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
    const [editingConnection, setEditingConnection] = useState<any>(null);
    const [editRelationType, setEditRelationType] = useState("");

    useEffect(() => {
        loadConnections();
    }, [patient.id]);

    const loadConnections = async () => {
        try {
            setLoading(true);
            // Directly fetch from API
            // Since we don't have the SDK method yet, we use fetch
            const response = await fetch(`/api/v1/patients/${patient.id}/relations`, {
                credentials: 'include'
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
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
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

    const handleUpdateConnection = async () => {
        if (!editingConnection || !editRelationType) return;

        try {
            setSaving(true);
            const response = await fetch(`/api/v1/patients/${patient.id}/relations/${editingConnection.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    relationType: editRelationType
                })
            });

            if (response.ok) {
                toast.success("Connection updated");
                setEditingConnection(null);
                loadConnections();
            } else {
                toast.error("Failed to update connection");
            }
        } catch (error) {
            console.error("Update connection error:", error);
            toast.error("Failed to update connection");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveConnection = async (relatedPatientId: string) => {
        if (!confirm("Are you sure you want to remove this connection?")) return;

        try {
            const response = await fetch(`/api/v1/patients/${patient.id}/relations/${relatedPatientId}`, {
                method: 'DELETE',
                credentials: 'include'
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
        <div className="max-w-3xl space-y-8">
            {/* Header & Add Trigger */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Family & Connections</h3>
                    <p className="text-xs text-gray-500 font-medium">Link family members to share credit and health records.</p>
                </div>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="h-9 px-4 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-teal-100 hover:bg-teal-100 transition-all flex items-center gap-2"
                    >
                        <FiPlus /> Add Member
                    </button>
                )}
            </div>

            {/* Inline Add Form */}
            {showAddForm && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by name or phone..."
                                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-2">
                                    {searchResults.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatient(p);
                                                setSearchQuery(`${p.firstName} ${p.lastName}`);
                                                setSearchResults([]);
                                            }}
                                            className="w-full px-4 py-2 hover:bg-gray-50 flex flex-col items-start transition-colors"
                                        >
                                            <span className="text-sm font-bold text-gray-900">{p.firstName} {p.lastName}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">{p.phoneNumber}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <select
                            value={relationType}
                            onChange={(e) => setRelationType(e.target.value)}
                            className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-500/10"
                        >
                            <option value="FAMILY">Family Member</option>
                            <option value="PARENT">Parent</option>
                            <option value="CHILD">Child</option>
                            <option value="SPOUSE">Spouse</option>
                            <option value="SIBLING">Sibling</option>
                            <option value="FRIEND">Friend</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedPatient(null);
                                setSearchQuery("");
                            }}
                            className="h-10 px-6 text-gray-500 text-[10px] font-bold uppercase hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddConnection}
                            disabled={!selectedPatient || saving}
                            className="h-10 px-6 bg-teal-600 text-white text-[10px] font-bold uppercase rounded-xl shadow-lg shadow-teal-100 hover:bg-teal-700 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Saving..." : "Confirm Link"}
                        </button>
                    </div>
                </div>
            )}

            {/* Connections List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}
                </div>
            ) : connections.length > 0 ? (
                <div className="space-y-3">
                    {connections.map((conn) => (
                        <div key={conn.id} className="group relative bg-white border border-gray-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-teal-600 font-black text-lg">
                                    {conn.firstName[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">
                                        {conn.firstName} {conn.lastName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {editingConnection?.id === conn.id ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={editRelationType}
                                                    onChange={(e) => setEditRelationType(e.target.value)}
                                                    className="text-[10px] font-bold uppercase bg-teal-50 text-teal-700 rounded-lg px-2 py-0.5 outline-none border border-teal-100"
                                                    autoFocus
                                                >
                                                    <option value="FAMILY">FAMILY</option>
                                                    <option value="PARENT">PARENT</option>
                                                    <option value="CHILD">CHILD</option>
                                                    <option value="SPOUSE">SPOUSE</option>
                                                    <option value="SIBLING">SIBLING</option>
                                                    <option value="FRIEND">FRIEND</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                                <button onClick={handleUpdateConnection} className="text-teal-600 hover:text-teal-800 text-[10px] font-black uppercase">Save</button>
                                                <button onClick={() => setEditingConnection(null)} className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase">Cancel</button>
                                            </div>
                                        ) : (
                                            <span
                                                onClick={() => {
                                                    setEditingConnection(conn);
                                                    setEditRelationType(conn.relationType);
                                                }}
                                                className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-wider rounded border border-gray-100 cursor-pointer hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition-colors"
                                            >
                                                {conn.relationType}
                                            </span>
                                        )}
                                        <span className="text-gray-300 ml-1">•</span>
                                        <span className="text-[11px] font-medium text-gray-500">{conn.phoneNumber}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleRemoveConnection(conn.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Unlink Member"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FiUsers className="w-6 h-6 text-gray-300" />
                    </div>
                    <h4 className="text-md font-bold text-gray-900">No linked members</h4>
                    <p className="text-sm text-gray-500 mt-1 max-w-[240px] mx-auto">Connecting family members helps you easily manage group bills and records.</p>
                </div>
            )}
        </div>
    );
}
