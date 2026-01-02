"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { HiArrowLeft, HiEye, HiEyeOff } from "react-icons/hi";
import { toast } from 'react-hot-toast';
import { IoMdBriefcase } from 'react-icons/io';
import { FiArrowRight } from "react-icons/fi";
import { MdOutlineMailLock } from "react-icons/md";
import { PiPassword } from "react-icons/pi";
import { AuthChoiceScreen } from "@/components/auth/AuthChoiceScreen";
import { EmailLinkForm } from "@/components/auth/EmailLinkForm";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

type AuthMethod = null | 'google' | 'link' | 'password';

export default function Signup() {
    const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
    const router = useRouter();

    // Simplified signup state - only email and password
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { handleKeyDown } = useKeyboardNavigation();

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

    const signupuser = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");

        if (!email || !password) {
            setErr("Email and password are required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErr("Please enter a valid email.");
            return;
        }

        if (password.length < 8) {
            setErr("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const authApi = (await import('@/lib/api/auth')).default;
            const toast = (await import('react-hot-toast')).default;

            // Simple signup with just email and password
            // Name and phone will be collected during onboarding
            await authApi.signup({
                firstName: 'User', // Placeholder - will be updated during onboarding
                lastName: '',
                email,
                password,
                phoneNumber: '0000000000' // Placeholder - will be updated during onboarding
            });

            toast.success('Account created! Please check your email to verify.');

            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (error: any) {
            const toast = (await import('react-hot-toast')).default;

            console.error('Signup error:', error);

            if (error.statusCode === 409) {
                setErr("User already exists. Please login.");
                toast.error("User already exists!");
            } else {
                setErr(error.message || "Signup failed! Please try again.");
                toast.error(error.message || "Signup failed!");
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
                    <AuthChoiceScreen mode="signup" onSelectMethod={handleMethodSelect} />
                ) : authMethod === 'link' ? (
                    /* Email Link Form - Inline */
                    <EmailLinkForm mode="signup" onBack={() => setAuthMethod(null)} />
                ) : authMethod === 'password' ? (
                    /* Password Signup Form - Simplified */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center space-y-2 mb-6">
                            <h2 className="text-[24px] font-black text-black/70">Create your account</h2>
                            <p className="text-black/50 text-sm">Enter your email and password</p>
                        </div>

                        <form onSubmit={signupuser} className="space-y-4" onKeyDown={handleKeyDown}>
                            {/* Email */}
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
                                        placeholder="pharmacy@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
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
                                        placeholder="At least 8 characters"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <HiEyeOff className="text-[#000000]/20" size={18} /> : <HiEye className="text-[#000000]/20" size={18} />}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Min. 8 characters</p>
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
                                    {loading ? "Creating account..." : "Create account"}
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
