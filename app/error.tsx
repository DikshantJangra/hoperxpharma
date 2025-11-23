'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BiError, BiRefresh, BiSupport, BiEnvelope, BiPhone } from 'react-icons/bi';
import { RiCustomerService2Line } from 'react-icons/ri';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10,
            },
        },
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/50 blur-3xl" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-100/50 blur-3xl" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 text-center overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75" />
                        <div className="relative bg-red-50 p-4 rounded-full border border-red-100">
                            <BiError className="w-12 h-12 text-red-500" />
                        </div>
                    </div>
                </motion.div>

                <motion.h2
                    variants={itemVariants}
                    className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 tracking-tight"
                >
                    Something went wrong!
                </motion.h2>

                <motion.p
                    variants={itemVariants}
                    className="text-gray-500 mb-8 text-lg leading-relaxed"
                >
                    We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-10">
                    <button
                        onClick={reset}
                        className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                    >
                        <BiRefresh className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Try Again
                    </button>
                </motion.div>

                <motion.div variants={itemVariants} className="border-t border-gray-100 pt-8">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                        Need immediate assistance?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <a
                            href="mailto:support@hoperx.com"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer"
                        >
                            <BiEnvelope className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">Email Support</span>
                        </a>
                        <a
                            href="tel:+1234567890"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer"
                        >
                            <BiPhone className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">Call Us</span>
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
