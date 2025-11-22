"use client";

import { useState } from "react";
import { FiBell, FiLock, FiGlobe, FiMoon, FiMail, FiSmartphone, FiShield, FiDatabase } from "react-icons/fi";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        lowStockAlerts: true,
        expiryAlerts: true,
        salesReports: false,
        darkMode: false,
        language: "en",
        timezone: "Asia/Kolkata",
        twoFactor: false,
        autoBackup: true
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Settings</h1>
                    <p className="text-sm text-[#64748b]">Manage your account preferences and notifications</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Notifications */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FiBell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0f172a]">Notifications</h2>
                            <p className="text-sm text-[#64748b]">Manage how you receive notifications</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SettingToggle
                            label="Email Notifications"
                            description="Receive notifications via email"
                            icon={<FiMail className="w-4 h-4" />}
                            checked={settings.emailNotifications}
                            onChange={() => toggleSetting("emailNotifications")}
                        />
                        <SettingToggle
                            label="SMS Notifications"
                            description="Receive notifications via SMS"
                            icon={<FiSmartphone className="w-4 h-4" />}
                            checked={settings.smsNotifications}
                            onChange={() => toggleSetting("smsNotifications")}
                        />
                        <SettingToggle
                            label="Push Notifications"
                            description="Receive push notifications in browser"
                            icon={<FiBell className="w-4 h-4" />}
                            checked={settings.pushNotifications}
                            onChange={() => toggleSetting("pushNotifications")}
                        />
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#e2e8f0]">
                        <h3 className="font-semibold text-[#0f172a] mb-4">Alert Preferences</h3>
                        <div className="space-y-4">
                            <SettingToggle
                                label="Low Stock Alerts"
                                description="Get notified when stock is running low"
                                checked={settings.lowStockAlerts}
                                onChange={() => toggleSetting("lowStockAlerts")}
                            />
                            <SettingToggle
                                label="Expiry Alerts"
                                description="Get notified about expiring medicines"
                                checked={settings.expiryAlerts}
                                onChange={() => toggleSetting("expiryAlerts")}
                            />
                            <SettingToggle
                                label="Daily Sales Reports"
                                description="Receive daily sales summary via email"
                                checked={settings.salesReports}
                                onChange={() => toggleSetting("salesReports")}
                            />
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FiMoon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0f172a]">Appearance</h2>
                            <p className="text-sm text-[#64748b]">Customize how HopeRx looks</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SettingToggle
                            label="Dark Mode"
                            description="Use dark theme across the application"
                            icon={<FiMoon className="w-4 h-4" />}
                            checked={settings.darkMode}
                            onChange={() => toggleSetting("darkMode")}
                        />
                    </div>
                </div>

                {/* Localization */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <FiGlobe className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0f172a]">Localization</h2>
                            <p className="text-sm text-[#64748b]">Language and regional settings</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Language</label>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="mr">Marathi</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Timezone</label>
                            <select
                                value={settings.timezone}
                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <FiShield className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0f172a]">Security</h2>
                            <p className="text-sm text-[#64748b]">Protect your account</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SettingToggle
                            label="Two-Factor Authentication"
                            description="Add an extra layer of security to your account"
                            icon={<FiLock className="w-4 h-4" />}
                            checked={settings.twoFactor}
                            onChange={() => toggleSetting("twoFactor")}
                        />

                        <div className="pt-4">
                            <button className="px-4 py-2 border border-[#cbd5e1] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors">
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data & Privacy */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <FiDatabase className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0f172a]">Data & Privacy</h2>
                            <p className="text-sm text-[#64748b]">Manage your data</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SettingToggle
                            label="Automatic Backups"
                            description="Automatically backup your data daily"
                            icon={<FiDatabase className="w-4 h-4" />}
                            checked={settings.autoBackup}
                            onChange={() => toggleSetting("autoBackup")}
                        />

                        <div className="pt-4 flex gap-3">
                            <button className="px-4 py-2 border border-[#cbd5e1] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors">
                                Export Data
                            </button>
                            <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingToggle({ label, description, icon, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg hover:border-[#cbd5e1] transition-colors">
            <div className="flex items-start gap-3 flex-1">
                {icon && <div className="mt-1 text-[#64748b]">{icon}</div>}
                <div>
                    <div className="font-medium text-[#0f172a]">{label}</div>
                    <div className="text-sm text-[#64748b]">{description}</div>
                </div>
            </div>
            <button
                onClick={onChange}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-[#0ea5a3]" : "bg-[#cbd5e1]"
                    }`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-6" : ""
                        }`}
                ></div>
            </button>
        </div>
    );
}
