"use client";

import { useState } from "react";
import { FiBell, FiLock, FiGlobe, FiMoon, FiMail, FiSmartphone, FiShield, FiDatabase, FiCheck } from "react-icons/fi";
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

export default function SettingsPage() {
    const { isPremium } = usePremiumTheme();
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
                    <h1 className={`text-2xl font-bold ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600' : 'text-[#0f172a]'} mb-2`}>Settings</h1>
                    <p className="text-sm text-[#64748b]">Manage your account preferences and notifications</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Notifications */}
                <div className={`p-6 rounded-xl border transition-all ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${isPremium ? 'bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-500/10' : 'bg-blue-100'}`}>
                            <FiBell className={`w-5 h-5 ${isPremium ? 'text-blue-600 drop-shadow-sm' : 'text-blue-600'}`} />
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
                <div className={`p-6 rounded-xl border transition-all ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${isPremium ? 'bg-gradient-to-br from-purple-50 to-purple-100 ring-1 ring-purple-500/10' : 'bg-purple-100'}`}>
                            <FiMoon className={`w-5 h-5 ${isPremium ? 'text-purple-600 drop-shadow-sm' : 'text-purple-600'}`} />
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
                <div className={`p-6 rounded-xl border transition-all ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${isPremium ? 'bg-gradient-to-br from-green-50 to-green-100 ring-1 ring-green-500/10' : 'bg-green-100'}`}>
                            <FiGlobe className={`w-5 h-5 ${isPremium ? 'text-green-600 drop-shadow-sm' : 'text-green-600'}`} />
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
                <div className={`p-6 rounded-xl border transition-all ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${isPremium ? 'bg-gradient-to-br from-red-50 to-red-100 ring-1 ring-red-500/10' : 'bg-red-100'}`}>
                            <FiShield className={`w-5 h-5 ${isPremium ? 'text-red-600 drop-shadow-sm' : 'text-red-600'}`} />
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
                <div className={`p-6 rounded-xl border transition-all ${isPremium
                    ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.1)] hover:border-emerald-500/20'
                    : 'bg-white border-[#e2e8f0]'
                    }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${isPremium ? 'bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-500/10' : 'bg-amber-100'}`}>
                            <FiDatabase className={`w-5 h-5 ${isPremium ? 'text-amber-600 drop-shadow-sm' : 'text-amber-600'}`} />
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
    const { isPremium } = usePremiumTheme();
    return (
        <div className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isPremium
            ? 'bg-white/50 border-emerald-500/10 hover:bg-white hover:border-emerald-500/30 hover:shadow-sm'
            : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
            }`}>
            <div className="flex items-start gap-3 flex-1">
                {icon && <div className="mt-1 text-[#64748b]">{icon}</div>}
                <div>
                    <div className="font-medium text-[#0f172a]">{label}</div>
                    <div className="text-sm text-[#64748b]">{description}</div>
                </div>
            </div>
            <button
                onClick={onChange}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked
                    ? isPremium ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm" : "bg-[#0ea5a3]"
                    : "bg-[#cbd5e1]"
                    }`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center ${checked ? "translate-x-6" : ""
                        }`}
                >
                    {isPremium && checked && <FiCheck size={10} className="text-emerald-600" />}
                </div>
            </button>
        </div>
    );
}
