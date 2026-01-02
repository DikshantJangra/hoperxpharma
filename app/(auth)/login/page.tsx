"use client";

import { Suspense } from "react";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import { toast } from 'react-hot-toast';
// import { FiAlertCircle } from 'react-icons/fi';
import { IoMdBriefcase } from 'react-icons/io';

import { AuthChoiceScreen } from "@/components/auth/AuthChoiceScreen";
import { EmailLinkForm } from "@/components/auth/EmailLinkForm";

// Import existing password login UI elements
import { FiArrowRight } from "react-icons/fi";
import { MdOutlineMailLock } from "react-icons/md";
import { PiPassword } from "react-icons/pi";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

type AuthMethod = null | 'google' | 'link' | 'password';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function LoginForm() {
    const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Password login state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { handleKeyDown } = useKeyboardNavigation();

    // Check for error in URL (e.g. from Google OAuth)
    useEffect(() => {
        if (!searchParams) return;
        const error = searchParams.get('error');
        if (error) {
            // Decode URI component just in case, though get() usually handles it
            const message = decodeURIComponent(error);
            setErr(message);

            // Async import toast to avoid hydration mismatch if possible, or just use if available
            import('react-hot-toast').then(({ default: toast }) => {
                toast.error(message);
            });

            // Clean up URL
            router.replace('/login');
        }
    }, [searchParams, router]);

    const handleMethodSelect = (method: 'google' | 'magic' | 'password') => {
        if (method === 'google') {
            // TODO: Implement Google OAuth
            toast('Google OAuth coming soon!', {
                icon: <IoMdBriefcase className="text-blue-500" size={20} />,
                duration: 3000
            });
        } else if (method === 'magic') {
            setAuthMethod('link');
        } else if (method === 'password') {
            setAuthMethod('password');
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        if (!email || !password) {
            setErr("Email and password are required.");
            setLoading(false);
            return;
        }

        try {
            const toast = (await import('react-hot-toast')).default;
            const { useAuthStore } = await import('@/lib/store/auth-store');
            const login = useAuthStore.getState().login;

            await login({ email, password });

            toast.success('Login successful!');

            setTimeout(() => {
                router.push('/dashboard/overview');
            }, 500);
        } catch (error: any) {
            const toast = (await import('react-hot-toast')).default;

            console.error('Login error:', error);

            if (error.statusCode === 401) {
                setErr("Invalid email or password");
                toast.error("Invalid email or password");
            } else if (error.statusCode === 429) {
                setErr("Too many login attempts. Please try again later.");
                toast.error("Too many attempts. Please wait.");
            } else if (error.statusCode === 404) {
                setErr("User profile not found. Please contact support.");
                toast.error("Profile not found. Contact support.");
            } else {
                setErr(error.message || "Login failed! Please try again.");
                toast.error(error.message || "Login failed!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-10 py-10">

                {/* Logo and Brand - Always visible */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative mb-4 flex justify-center items-center w-[98px] h-[98px]">
                        {/* Animated rings */}
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/15 animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/15"></div>
                        <div className="relative flex justify-center items-center font-bold text-white text-[26px] w-[66px] h-[66px] rounded-full bg-[#12B981]">
                            <span className="absolute" style={{ transform: 'translate(-6.5px, -1px)' }}>R</span>
                            <span className="absolute" style={{ transform: 'translate(6.5px, 1px)' }}>x</span>
                        </div>
                    </div>

                    <h1 className="text-[32px] font-bold tracking-tighter mb-3">
                        <span className="text-[#A0A0A0]">Hope</span>
                        <span className="text-[#12B981] relative">
                            Rx
                            <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                            <span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                        </span>
                        <span className="text-[#A0A0A0]">Pharma</span>
                    </h1>
                </div>

                {/* Content Area */}
                {authMethod === null ? (
                    /* Choice Screen */
                    <AuthChoiceScreen mode="login" onSelectMethod={handleMethodSelect} />
                ) : authMethod === 'link' ? (
                    /* Email Link Form - Inline */
                    <EmailLinkForm mode="login" onBack={() => setAuthMethod(null)} />
                ) : authMethod === 'password' ? (
                    /* Password Login Form */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center space-y-2 mb-6">
                            <h2 className="text-[24px] font-black text-black/70">Sign in with password</h2>
                            <p className="text-black/50 text-sm">Enter your credentials</p>
                        </div>

                        <form onSubmit={handlePasswordLogin} className="space-y-4" onKeyDown={handleKeyDown}>
                            <div>
                                <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <MdOutlineMailLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-2.5 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400 text-[15px]"
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                                    Password
                                </label>
                                <div className="relative">
                                    <PiPassword className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-2.5 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400 text-[15px]"
                                        placeholder="**************"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <HiEyeOff className="text-[#000000]/20" size={18} /> : <HiEye className="text-[#000000]/20" size={18} />}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end mt-2">
                                    <Link href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-600 font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <div className="h-5 text-center">
                                {err && <p className="text-red-600 text-xs">{err}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-3 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {loading ? "Logging in..." : "Sign in"}
                                    {!loading && <FiArrowRight />}
                                </span>
                            </button>
                        </form>

                        {/* Back Button - At Bottom */}
                        <div className="text-center mt-6">
                            <button
                                onClick={() => setAuthMethod(null)}
                                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors w-full justify-center"
                            >
                                <HiArrowLeft size={16} />
                                <span className="text-xs font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-10 py-10 flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
