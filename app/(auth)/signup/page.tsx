"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { FiArrowRight } from "react-icons/fi";
import { BsTelephone } from "react-icons/bs";
import { MdOutlineMailLock } from "react-icons/md";
import { PiPassword } from "react-icons/pi";
import { BiCheckShield, BiUser } from "react-icons/bi";
import { RiSecurePaymentFill } from "react-icons/ri";
import { HiEye, HiEyeOff } from "react-icons/hi";
import Link from "next/link"

export default function Signup(){
    const [name, setName] = useState("");
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
        }, 20000);
        return () => clearTimeout(timer);
    }, []);

    const signupuser = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");

        if (!name || !number || !email || !password || !confirmPassword) {
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
                credentials: "include",
                body: JSON.stringify({ name, email, password, confirmPassword, phoneNumber: fullNumber })
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
        <div className="h-screen w-screen bg-white flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg px-9 py-5">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative mb-4 flex justify-center items-center w-[98px] h-[98px]">
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/15"></div>
                        {showAnimation && (
                            <>
                                <span className="animate-ping absolute inline-flex h-[66px] w-[66px] rounded-full bg-[#12B981]/75" style={{ animationDuration: '3s', animationIterationCount: 2 }}></span>
                                <span className="animate-ping absolute inline-flex h-[66px] w-[66px] rounded-full bg-[#12B981]/75" style={{ animationDuration: '3s', animationIterationCount: 2, animationDelay: '2s' }}></span>
                            </>
                        )}
                        <div className="relative flex justify-center items-center font-bold text-white text-[26px] w-[66px] h-[66px] rounded-full bg-[#12B981]">
                            <span className="absolute" style={{ transform: 'translate(-6.5px, -1px)' }}>R</span>
                            <span className="absolute" style={{ transform: 'translate(6.5px, 1px)' }}>X</span>
                        </div>
                    </div>
                    
                    <h1 className="text-[32px] font-bold tracking-tighter mb-3">
                        <span className="text-[#A0A0A0]">Hope</span><span className="text-[#12B981] relative">Rx<span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span><span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span></span><span className="text-[#A0A0A0]">Pharma</span>
                    </h1>
                    
                    <h2 className="text-[26px] font-black text-black/70 leading-tight mt-4 mb-2">
                        Start Optimizing Your<br/>Pharmacy's Profit
                    </h2>
                    
                    <p className="text-black/50 text-sm leading-tight">
                        Secure & Simple! Automate, compliance<br/>& Save on Inventory
                    </p>
                </div>
                
                <form onSubmit={signupuser} className="space-y-3.5">
                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Phone Number (India only)
                        </label>
                        <div className="relative">
                            <BsTelephone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type="tel" 
                                value={number}
                                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-12 pr-4 py-2.5 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400 text-[15px]"
                                placeholder="9812080390"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Full Name
                        </label>
                        <div className="relative">
                            <BiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400 text-[15px]"
                                placeholder="Krishan Kumar"
                            />
                        </div>
                    </div>

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
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <HiEyeOff className="text-[#000000]/20" size={18} /> : <HiEye className="text-[#000000]/20" size={18} />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-black/70 text-sm font-medium mb-1.5 text-left">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <PiPassword className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <span className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-px bg-gray-300"></span>
                            <input 
                                type={showConfirmPass ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-2.5 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-black/5 text-gray-700 placeholder:text-gray-400 text-[15px]"
                                placeholder="**************"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                {showConfirmPass ? <HiEyeOff className="text-[#000000]/20" size={18} /> : <HiEye className="text-[#000000]/20" size={18} />}
                            </div>
                        </div>
                    </div>

                    <div className="h-5 text-center">
                        {err && (
                            <p className="text-red-600 text-xs">{err}</p>
                        )}
                    </div>

                    <div className="pt-1">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {loading ? "Signing up..." : "Sign up"}
                                {!loading && <FiArrowRight />}
                            </span>
                        </button>
                    </div>
                </form>

                <p className="text-center text-gray-600 text-xs mt-4">
                    Already a user? <Link href="/login" className="text-emerald-500 hover:text-emerald-600 font-medium">Login</Link>
                </p>

                <div className="mt-5 flex justify-center items-center gap-2 text-xs sm:fixed sm:p-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:justify-end">
                    <div className="relative group flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2">
                        <BiCheckShield size={15} className="text-[#12B981]" />
                        <span>HIPPA Compliant</span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-80 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                            HIPAA-secured. No compromises on your privacy
                        </div>
                    </div>
                    <div className="relative group flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2">
                        <RiSecurePaymentFill size={15} className="text-[#12B981]" />
                        <span>256-bit SSL Secured</span>
                        <div className="absolute bottom-full right-1 mb-2 hidden group-hover:block w-80 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                            256-bit SSL — tough security, zero compromise.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
