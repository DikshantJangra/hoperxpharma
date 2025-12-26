'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PremiumSuccess({ className = "" }: { className?: string }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Orchestrate the animation sequence
        const timer1 = setTimeout(() => setStep(1), 100); // Start expansion
        const timer2 = setTimeout(() => setStep(2), 500); // Draw checkmark

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Pulsing Blue Background Circles */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: step >= 1 ? 1 : 0,
                    opacity: step >= 1 ? 1 : 0
                }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                className="absolute w-28 h-28 bg-blue-100 rounded-full"
            />

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: step >= 1 ? 1 : 0,
                    opacity: step >= 1 ? 1 : 0
                }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className="absolute w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
                {/* SVG Checkmark */}
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="z-10"
                >
                    <motion.path
                        d="M5 13L9 17L19 7"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: step >= 2 ? 1 : 0,
                            opacity: step >= 2 ? 1 : 0
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </svg>
            </motion.div>

            {/* Confetti Particles (Optional Flair) */}
            {step >= 2 && (
                <>
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full"
                            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                            animate={{
                                x: (Math.cos(i * 60 * (Math.PI / 180)) * 50),
                                y: (Math.sin(i * 60 * (Math.PI / 180)) * 50),
                                opacity: 0,
                                scale: 1
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
