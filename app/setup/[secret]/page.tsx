"use client";

import { useState, useEffect, use } from "react";
import { toast } from "react-hot-toast";
import { HiOutlineMail, HiOutlineKey, HiOutlineServer, HiCheck, HiX, HiExternalLink, HiLockClosed } from "react-icons/hi";
import { FiLoader, FiSend, FiSave } from "react-icons/fi";
import { getEmailConfig, saveEmailConfig, testEmailConnection, verifySetupPassword } from "@/lib/api/platform";

interface PageProps {
    params: Promise<{ secret: string }>;
}

export default function SetupPage({ params }: PageProps) {
    const { secret } = use(params);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [smtpUser, setSmtpUser] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [smtpFromName, setSmtpFromName] = useState("HopeRxPharma");

    // Config state
    const [isConfigured, setIsConfigured] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<boolean | null>(null);

    // Countdown timer for rate limit
    useEffect(() => {
        if (retryAfter && retryAfter > 0) {
            const timer = setInterval(() => {
                setRetryAfter(prev => {
                    if (prev && prev > 1) return prev - 1;
                    return null;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [retryAfter]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim() || retryAfter) return;

        try {
            setVerifying(true);
            setAuthError(null);
            const result = await verifySetupPassword(secret, password);

            if (result.success) {
                setIsAuthenticated(true);
                setLoading(true); // Show loading state immediately
                toast.success("Access granted!");
                loadConfig();
            }
        } catch (err: any) {
            if (err.retryAfter) {
                setRetryAfter(err.retryAfter);
                setAuthError(err.message);
            } else {
                setAuthError(err.message);
                if (err.remainingAttempts !== undefined) {
                    setRemainingAttempts(err.remainingAttempts);
                }
            }
        } finally {
            setVerifying(false);
            setPassword("");
        }
    };

    const loadConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getEmailConfig(secret);

            if (result.data) {
                setSmtpUser(result.data.smtpUser || "");
                setSmtpFromName(result.data.smtpFromName || "HopeRxPharma");
                setIsActive(result.data.isActive);
                setLastTestResult(result.data.lastTestResult);
            }
            setIsConfigured(result.configured);
        } catch (err: any) {
            if (err.message === "Invalid setup URL") {
                setError("Invalid setup URL. Please check the link.");
            } else {
                setError(err.message || "Failed to load configuration");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!smtpUser || !smtpPassword) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setSaving(true);
            const result = await saveEmailConfig(secret, {
                smtpUser,
                smtpPassword,
                smtpFromName
            });

            if (result.success) {
                toast.success(result.message);
                setIsConfigured(true);
                setSmtpPassword(""); // Clear password after save
                await loadConfig();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        try {
            setTesting(true);
            const result = await testEmailConnection(secret);

            if (result.success) {
                toast.success(result.message);
                setIsActive(true);
                setLastTestResult(true);
            } else {
                toast.error(result.message);
                setLastTestResult(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Connection test failed");
            setLastTestResult(false);
        } finally {
            setTesting(false);
        }
    };

    // Password Gate UI
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiLockClosed className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Protected Setup</h1>
                        <p className="text-gray-600 text-sm">Enter the setup password to access platform configuration</p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter setup password"
                                disabled={!!retryAfter}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                                autoFocus
                            />
                        </div>

                        {authError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                {authError}
                            </div>
                        )}

                        {retryAfter && (
                            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm text-center">
                                ⏳ Wait {retryAfter} seconds before trying again
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={verifying || !password.trim() || !!retryAfter}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {verifying ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <HiLockClosed className="w-4 h-4" />
                                    Unlock
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 text-xs mt-6">
                        3 attempts per minute • Contact admin for password
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FiLoader className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiX className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiOutlineMail className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Email Setup</h1>
                    <p className="text-gray-600">Configure Gmail SMTP for magic link authentication</p>
                </div>

                {/* Status Banner */}
                <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${isActive ? "bg-emerald-50 border border-emerald-200" : isConfigured ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"
                    }`}>
                    {isActive ? (
                        <>
                            <HiCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Email is configured and active</span>
                        </>
                    ) : isConfigured ? (
                        <>
                            <div className="w-5 h-5 rounded-full bg-yellow-400" />
                            <span className="text-yellow-700 font-medium">Configuration saved - needs testing</span>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 rounded-full bg-gray-400" />
                            <span className="text-gray-700 font-medium">Not configured</span>
                        </>
                    )}
                </div>

                {/* Main Form */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Gmail Instructions */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">📧 Gmail App Password Required</h3>
                        <p className="text-blue-800 text-sm mb-3">
                            Gmail requires an App Password for SMTP. Regular passwords won&apos;t work.
                        </p>
                        <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            Generate App Password
                            <HiExternalLink className="w-4 h-4" />
                        </a>
                        <ol className="text-blue-800 text-sm mt-3 space-y-1 list-decimal list-inside">
                            <li>Enable 2-Factor Authentication on your Google account</li>
                            <li>Go to App Passwords (link above)</li>
                            <li>Create a new app password for &quot;Mail&quot;</li>
                            <li>Copy the 16-character password here</li>
                        </ol>
                    </div>

                    <div className="space-y-5">
                        {/* Gmail Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Gmail Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={smtpUser}
                                    onChange={(e) => setSmtpUser(e.target.value)}
                                    placeholder="your-email@gmail.com"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* App Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                App Password <span className="text-red-500">*</span>
                                {isConfigured && <span className="text-gray-500 font-normal ml-2">(leave blank to keep existing)</span>}
                            </label>
                            <div className="relative">
                                <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={smtpPassword}
                                    onChange={(e) => setSmtpPassword(e.target.value)}
                                    placeholder={isConfigured ? "••••••••••••••••" : "16-character app password"}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* From Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                From Name
                            </label>
                            <div className="relative">
                                <HiOutlineServer className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={smtpFromName}
                                    onChange={(e) => setSmtpFromName(e.target.value)}
                                    placeholder="HopeRxPharma"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">This name appears in the &quot;From&quot; field of emails</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={handleSave}
                            disabled={saving || (!smtpPassword && !isConfigured)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" />
                                    Save Configuration
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleTest}
                            disabled={testing || !isConfigured}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {testing ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <FiSend className="w-4 h-4" />
                                    Test Connection
                                </>
                            )}
                        </button>
                    </div>

                    {/* Last Test Result */}
                    {lastTestResult !== null && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${lastTestResult ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {lastTestResult
                                ? "✓ Last connection test was successful"
                                : "✗ Last connection test failed - please check credentials"
                            }
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    This is a secret configuration page. Keep this URL private.
                </p>
            </div>
        </div>
    );
}
