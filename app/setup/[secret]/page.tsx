"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { HiOutlineMail, HiOutlineKey, HiCheck, HiX, HiExternalLink, HiLockClosed } from "react-icons/hi";
import { FiLoader, FiSend, FiSave, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { getEmailConfig, saveEmailConfig, testEmailConnection, verifySetupPassword, getGmailAuthUrl, disconnectGmail } from "@/lib/api/platform";

// Valid secret - must match backend SETUP_SECRET
const VALID_SECRET = 'hrp-ml-config';

interface PageProps {
    params: Promise<{ secret: string }>;
}

export default function SetupPage({ params }: PageProps) {
    const { secret } = use(params);
    const searchParams = useSearchParams();

    // Secret validation - check FIRST before everything
    const [secretValid, setSecretValid] = useState<boolean | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OAuth state
    const [oauthConfigured, setOauthConfigured] = useState(false);
    const [oauthEmail, setOauthEmail] = useState<string | null>(null);
    const [oauthAvailable, setOauthAvailable] = useState(false);

    // Config state
    const [isConfigured, setIsConfigured] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<boolean | null>(null);
    const [authMethod, setAuthMethod] = useState<'oauth' | 'smtp' | null>(null);

    // Validate secret on mount - BEFORE showing anything
    useEffect(() => {
        // Simple client-side check - the secret must match exactly
        if (secret === VALID_SECRET) {
            setSecretValid(true);
        } else {
            setSecretValid(false);
        }
    }, [secret]);

    // Handle OAuth callback
    useEffect(() => {
        if (!secretValid) return;

        const success = searchParams?.get('success');
        const err = searchParams?.get('error');

        if (success === 'gmail_connected') {
            toast.success('Gmail connected successfully!');
            setIsAuthenticated(true);
            loadConfig();
            // Clean URL
            window.history.replaceState({}, '', `/setup/${secret}`);
        } else if (err) {
            toast.error(decodeURIComponent(err));
            window.history.replaceState({}, '', `/setup/${secret}`);
        }
    }, [searchParams, secret, secretValid]);

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
                setLoading(true);
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

            // Check OAuth status
            if (result.oauth) {
                setOauthConfigured(result.oauth.configured);
                setOauthEmail(result.oauth.email);
                if (result.oauth.configured) {
                    setAuthMethod('oauth');
                    setIsActive(result.oauth.isActive);
                    setLastTestResult(result.oauth.lastTestResult);
                }
            }

            setOauthAvailable(result.oauthAvailable);
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

    const handleConnectGmail = async () => {
        try {
            setConnecting(true);
            const result = await getGmailAuthUrl(secret);
            if (result.authUrl) {
                window.location.href = result.authUrl;
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to connect Gmail");
            setConnecting(false);
        }
    };

    const handleDisconnectGmail = async () => {
        if (!confirm('Are you sure you want to disconnect Gmail?')) return;

        try {
            setDisconnecting(true);
            await disconnectGmail(secret);
            toast.success('Gmail disconnected');
            setOauthConfigured(false);
            setOauthEmail(null);
            setIsActive(false);
            setAuthMethod(null);
            setIsConfigured(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to disconnect");
        } finally {
            setDisconnecting(false);
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

    // Loading state while validating secret
    if (secretValid === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <FiLoader className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Invalid secret - show generic 404 (don't reveal the setup page exists!)
    if (!secretValid) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">Page not found</p>
                    <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Go to Homepage
                    </a>
                </div>
            </div>
        );
    }

    // Password Gate UI - only shown if secret is valid
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
                                Wait {retryAfter} seconds before trying again
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
                        3 attempts per minute
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
                    <p className="text-gray-600">Connect Gmail for magic link authentication</p>
                </div>

                {/* Status Banner */}
                <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${isActive ? "bg-emerald-50 border border-emerald-200" : isConfigured ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"
                    }`}>
                    {isActive ? (
                        <>
                            <HiCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">
                                Email active via {authMethod === 'oauth' ? 'Gmail OAuth' : 'SMTP'}
                                {oauthEmail && ` (${oauthEmail})`}
                            </span>
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

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Gmail OAuth Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FcGoogle className="w-6 h-6" />
                            Gmail OAuth (Recommended)
                        </h2>

                        <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                            <p className="text-emerald-800 text-sm">
                                Connect your Gmail account securely via OAuth. No passwords stored - Google-recommended for SaaS platforms.
                            </p>
                        </div>

                        {oauthConfigured ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FcGoogle className="w-8 h-8" />
                                    <div>
                                        <p className="font-medium text-gray-900">{oauthEmail}</p>
                                        <p className="text-sm text-gray-500">Connected via OAuth</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDisconnectGmail}
                                    disabled={disconnecting}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                </button>
                            </div>
                        ) : oauthAvailable ? (
                            <button
                                onClick={handleConnectGmail}
                                disabled={connecting}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            >
                                {connecting ? (
                                    <>
                                        <FiLoader className="w-5 h-5 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <FcGoogle className="w-6 h-6" />
                                        Connect Gmail Account
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                <p className="font-medium mb-1">Gmail OAuth not configured</p>
                                <p>Set <code className="bg-yellow-100 px-1 rounded">GMAIL_CLIENT_ID</code> and <code className="bg-yellow-100 px-1 rounded">GMAIL_CLIENT_SECRET</code> environment variables.</p>
                            </div>
                        )}
                    </div>

                    {/* Test Connection Button */}
                    {isConfigured && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleTest}
                                disabled={testing}
                                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {testing ? (
                                    <>
                                        <FiLoader className="w-4 h-4 animate-spin" />
                                        Testing Connection...
                                    </>
                                ) : (
                                    <>
                                        <FiRefreshCw className="w-4 h-4" />
                                        Test Connection
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    This configuration is used for magic link authentication emails
                </p>
            </div>
        </div>
    );
}
