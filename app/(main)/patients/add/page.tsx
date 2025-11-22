"use client";

import { useState } from "react";
import { FiSave, FiX, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiAlertCircle, FiShield, FiCamera } from "react-icons/fi";
import { MdBloodtype } from "react-icons/md";

export default function AddPatientPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        bloodGroup: "",
        allergies: "",
        chronicConditions: "",
        insuranceProvider: "",
        insuranceNumber: "",
        emergencyContact: "",
        emergencyPhone: "",
        consentData: false,
        consentMarketing: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Patient data:", formData);
        // In production, save to backend
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Add New Patient</h1>
                    <p className="text-sm text-[#64748b]">Create a new patient record with complete information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Photo & Basic Info */}
                    <div className="space-y-6">
                        {/* Photo Upload */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-4">Patient Photo</h3>
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4 relative group cursor-pointer">
                                    <FiCamera className="w-8 h-8 text-[#64748b]" />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-sm">Upload</span>
                                    </div>
                                </div>
                                <button type="button" className="text-sm text-[#0ea5a3] hover:text-[#0d9391]">
                                    Upload Photo
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] rounded-xl p-6 text-white">
                            <h3 className="font-semibold mb-4">Patient ID</h3>
                            <div className="text-3xl font-bold mb-2">Auto-Generated</div>
                            <p className="text-sm opacity-90">Will be assigned on save</p>
                        </div>
                    </div>

                    {/* Middle Column - Personal Details */}
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <h3 className="font-semibold text-[#0f172a] mb-6 flex items-center gap-2">
                            <FiUser className="w-5 h-5" />
                            Personal Information
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Gender *</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                    <FiPhone className="w-4 h-4" />
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                    <FiMail className="w-4 h-4" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="patient@example.com"
                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                    <FiMapPin className="w-4 h-4" />
                                    Address *
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">State *</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Pincode *</label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Medical & Insurance */}
                    <div className="space-y-6">
                        {/* Medical Information */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-6 flex items-center gap-2">
                                <FiAlertCircle className="w-5 h-5" />
                                Medical Information
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                        <MdBloodtype className="w-4 h-4" />
                                        Blood Group
                                    </label>
                                    <select
                                        value={formData.bloodGroup}
                                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    >
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Allergies</label>
                                    <textarea
                                        value={formData.allergies}
                                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                        placeholder="List any known allergies..."
                                        rows={2}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Chronic Conditions</label>
                                    <textarea
                                        value={formData.chronicConditions}
                                        onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                                        placeholder="Diabetes, Hypertension, etc..."
                                        rows={2}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Insurance Information */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-6 flex items-center gap-2">
                                <FiShield className="w-5 h-5" />
                                Insurance Information
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Insurance Provider</label>
                                    <input
                                        type="text"
                                        value={formData.insuranceProvider}
                                        onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                                        placeholder="e.g., Star Health"
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Policy Number</label>
                                    <input
                                        type="text"
                                        value={formData.insuranceNumber}
                                        onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-6">Emergency Contact</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.emergencyPhone}
                                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Consents */}
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h3 className="font-semibold text-[#0f172a] mb-6">Consents</h3>

                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.consentData}
                                        onChange={(e) => setFormData({ ...formData, consentData: e.target.checked })}
                                        className="mt-1 w-4 h-4 text-[#0ea5a3] border-[#cbd5e1] rounded focus:ring-[#0ea5a3]"
                                    />
                                    <span className="text-sm text-[#475569]">
                                        I consent to the collection and processing of my health data as per DPDPA regulations
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.consentMarketing}
                                        onChange={(e) => setFormData({ ...formData, consentMarketing: e.target.checked })}
                                        className="mt-1 w-4 h-4 text-[#0ea5a3] border-[#cbd5e1] rounded focus:ring-[#0ea5a3]"
                                    />
                                    <span className="text-sm text-[#475569]">
                                        I agree to receive promotional messages and health tips
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex items-center justify-end gap-4 bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <button
                        type="button"
                        className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                    >
                        <FiX className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                    >
                        <FiSave className="w-4 h-4" />
                        Save Patient
                    </button>
                </div>
            </form>
        </div>
    );
}
