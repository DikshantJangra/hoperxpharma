'use client';

import { motion } from 'framer-motion';

export default function ProcessingLoader({ size = "sm", color = "white" }: { size?: "sm" | "md" | "lg", color?: "white" | "blue" | "teal" }) {
    const dotSize = size === "sm" ? 6 : size === "md" ? 8 : 10;
    const containerHeight = size === "sm" ? 20 : size === "md" ? 24 : 32;

    const bgColors = {
        white: "bg-white",
        blue: "bg-blue-600",
        teal: "bg-teal-600"
    };

    return (
        <div className={`flex items-center justify-center gap-1.5 h-[${containerHeight}px]`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`rounded-full ${bgColors[color]}`}
                    style={{ width: dotSize, height: dotSize }}
                    animate={{
                        y: [-2, 4, -2],
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}
