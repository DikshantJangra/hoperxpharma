"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { FiArrowRight } from "react-icons/fi";
import { BsTelephone } from "react-icons/bs";
import { MdOutlineMailLock } from "react-icons/md";
import { PiPassword } from "react-icons/pi";
import { BiCheckShield } from "react-icons/bi";
import { RiSecurePaymentFill } from "react-icons/ri";
import { HiEye, HiEyeOff } from "react-icons/hi";
import Link from "next/link"

export default function Signup(){
    const [number, setNumber] = useState("");
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const router = useRouter();
    const [showAnimation, setShowAnimation] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnimation(false);
        }, 20000); // Stop animation after 20s

        return () => clearTimeout(timer);
    }, []);

    const signupuser = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");

        // Frontend Validation
        if (!number || !email || !password || !confirmPassword) {
            setErr("All fields are required.");
            return;
        }
        if (number.length !== 10) {
            setErr("Phone number must be 10 digits.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErr("Please enter a valid email address.");
            return;
        }
        if (password.length < 8) {
            setErr("Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setErr("Passwords do not match.");
            return;
        }

        setLoading(true);
        try{
            const fullNumber = "+91" + number;
            const res = await fetch("https://hoperxpharma.onrender.com/api/auth/signup", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ email, password, confirmPassword, phoneNumber: fullNumber })
            })
            const message = await res.json()
            if (!res.ok) {
                setErr(message.message || `Server error: ${res.status}`)
                return
            }
            router.push("/login");
        }catch(err){
            setErr("Network error. Please try again.")
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="min-h-screen bg-white flex items-center justify-center relative">
            <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg px-10 py-5">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative mb-5 flex justify-center items-center w-[104px] h-[104px]">
                        {/* The final static background circle */}
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/15"></div>

                        {/* Conditional animation waves */}
                        {showAnimation && (
                            <>
                                <span 
                                    className="animate-ping absolute inline-flex h-[72px] w-[72px] rounded-full bg-[#12B981]/75"
                                    style={{ animationDuration: '3Maks', animationIterationCount: 2 }}
                                ></span>
                                <span 
                                    className="animate-ping absolute inline-flex h-[72px] w-[72px] rounded-full bg-[#12B981]/75"
                                    style={{ animationDuration: '3Maks', animationIterationCount: 2, animationDelay: '2s' }}
                                ></span>
                            </>
                        )}

                        {/* The inner solid circle */}
                        <div className="relative flex justify-center items-center font-bold text-white text-3xl w-[72px] h-[72px] rounded-full bg-[#12B981]">
                            <span className="absolute" style={{ transform: 'translate(-7px, -1px)' }}>R</span>
                            <span className="absolute" style={{ transform: 'translate(7px, 1px)' }}>X</span>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold tracking-tighter mb-4">
                        <span className="text-[#A0A0A0]">Hope</span><span className="text-[#12B981] relative">Rx<span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span><span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span></span><span className="text-[#A0A0A0]">Pharma</span>
                    </h1>
                    
                    <h2 className="text-3xl font-black text-black/70 leading-tighter mt-5 mb-2">
                        Start Optimizing Your<br/>Pharmacy’s Profit
                    </h2>
                    
                    <p className="text-black/50 text-base leading-tight">
                        Secure & Simple! Automate, compliance<br/>& Save on Inventory
                    </p>
                </div>
                
                <form onSubmit={signupuser} className="space-y-4">
                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Phone Number (India only)
                        </label>
                        <div className="relative">
                            <BsTelephone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type="tel" 
                                value={number}
                                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-12 pr-4 py-3 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400"
                                placeholder="9812080390"
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Email Address
                        </label>
                        <div className="relative">
                            <MdOutlineMailLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400"
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
                            <PiPassword className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400"
                                placeholder="**************"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <HiEyeOff className="text-[#000000]/20" size={20} /> : <HiEye className="text-[#000000]/20" size={20} />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <PiPassword className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type={showConfirmPass ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400"
                                placeholder="**************"
                                required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                {showConfirmPass ? <HiEyeOff className="text-[#000000]/20" size={20} /> : <HiEye className="text-[#000000]/20" size={20} />}
                            </div>
                        </div>
                    </div>

                    <div className="h-6 text-center">
                        {err && (
                            <p className="text-red-600 text-sm">{err}</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base py-3 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {loading ? "Signing up..." : "Sign up"}
                                {!loading && <FiArrowRight />}
                            </span>
                        </button>
                    </div>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Already a user? <Link href="/login" className="text-emerald-500 hover:text-emerald-600 font-medium">Login</Link>
                </p>

                <div className="mt-8 flex justify-center items-center gap-3 text-xs sm:fixed sm:p-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:justify-end">
                    <div className="flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2">
                        <BiCheckShield size={16} className="text-[#12B981]" />
                        <span>HIPPA Compliant</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2">
                        <RiSecurePaymentFill size={16} className="text-[#12B981]" />
                        <span>256-bit SSL Secured</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
