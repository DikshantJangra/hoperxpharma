'use client';

import { useEffect, useState, useRef } from 'react';
import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { PREMIUM_CAPABILITIES } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses, sleep } from '@/lib/animations/welcomeAnimations';

/**
 * Section 3: Capability
 * Purpose: Affirm value without selling
 * Duration: 4s (progressive reveal)
 */
export function CapabilitySection({ isActive, onComplete }: WelcomeSectionProps) {
    // Generate a long list of "modules" for effect
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (!isActive) return;

        const modules = [
            "CORE_KERNEL_V2", "NEURAL_ENGINE", "PAYMENT_GATEWAY_BRIDGE", "INVENTORY_SYNC_DAEMON",
            "USER_AUTH_SERVICE", "DATA_ENCRYPTION_MODULE", "UI_RENDERER_ENGINE", "ANALYTICS_PROXY",
            "NOTIFICATION_DISPATCHER", "BACKUP_PROTOCOL_MANAGER", "API_RATE_LIMITER", "CACHE_INVALIDATOR",
            "SEARCH_INDEX_BUILDER", "IMAGE_OPTIMIZER", "PDF_GENERATOR_SERVICE", "EMAIL_SMTP_CLIENT",
            "WHATSAPP_INTEGRATION_BOT", "SYSTEM_HEALTH_MONITOR", "ERROR_LOGGING_DAEMON", "PERFORMANCE_TRACER",
            "NETWORK_SECURITY_FIREWALL", "DATABASE_CONNECTION_POOL", "REDIS_CACHE_STORE", "ELASTICSEARCH_NODE"
        ];

        let currentIndex = 0;

        // Fast scroll effect
        const interval = setInterval(() => {
            if (currentIndex >= modules.length) {
                clearInterval(interval);
                setTimeout(onComplete, 1000); // Finish after logs done
                return;
            }

            setLogs(prev => [...prev, `LOADING_MODULE: ${modules[currentIndex]}... [OK]`]);
            currentIndex++;
        }, 150); // New log every 150ms

        return () => clearInterval(interval);
    }, [isActive, onComplete]);

    // Auto-scroll to bottom
    const logsEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono selection:bg-emerald-500/30">
            {/* Primary Message */}
            <h1
                className={`text-2xl md:text-4xl font-bold text-white uppercase tracking-tight mb-8 ${getAnimationClass(animationClasses.fadeInUp)}`}
            >
                INSTALLING_MODULES<span className="animate-pulse text-emerald-500">_</span>
            </h1>

            {/* Terminal Window */}
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-sm p-4 h-64 overflow-hidden relative shadow-inner">
                {/* Scanline overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />

                <div className="flex flex-col justify-end min-h-full font-mono text-xs md:text-sm space-y-1 text-emerald-500/80">
                    {logs.map((log, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <span className="text-neutral-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            <div className="h-8 mt-6 flex items-center">
                <span className="text-neutral-500 text-xs animate-pulse">
                    &gt; OPTIMIZING_PERFORMANCE...
                </span>
            </div>
        </div>
    );
}
