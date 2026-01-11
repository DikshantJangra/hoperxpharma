'use client';

import React, { useState, useEffect } from 'react';
import { globalKeyboardEngine } from '@/lib/keyboard/engine';
import { CommandId } from '@/lib/keyboard/types';

export default function KeyboardDebugger() {
    const [isVisible, setIsVisible] = useState(false);
    const [lastCommand, setLastCommand] = useState<{ id: CommandId, timestamp: number } | null>(null);
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [contextInfo, setContextInfo] = useState<any>(null);

    useEffect(() => {
        // Toggle debugger with Ctrl+Shift+K
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                setIsVisible(v => !v);
            }

            setActiveKeys(prev => {
                const newSet = new Set(prev);
                newSet.add(e.key);
                return newSet;
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            setActiveKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(e.key);
                return newSet;
            });
        };

        // Listen for internal command dispatch events (needs engine support or patching)
        // For now, we'll poll the engine state if possible or rely on a simple interval to update context info

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Periodically update context info when visible
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            if (typeof document !== 'undefined') {
                const activeElement = document.activeElement;
                const zone = activeElement?.closest('[data-zone]')?.getAttribute('data-zone') || 'global';
                setContextInfo({
                    activeElement: activeElement?.tagName,
                    activeZone: zone,
                    activeId: activeElement?.id,
                    time: new Date().toLocaleTimeString()
                });
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isVisible]);


    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/80 text-green-400 font-mono text-xs rounded-lg shadow-xl backdrop-blur-md border border-green-500/30 max-w-sm pointer-events-none select-none">
            <div className="uppercase font-bold mb-2 border-b border-green-500/30 pb-1 flex justify-between">
                <span>Keyboard Engine Debug</span>
                <span className="text-[10px] opacity-70">Ctrl+Shift+K to toggle</span>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="opacity-70">Context Zone:</span>
                    <span className="font-bold text-white">{contextInfo?.activeZone || 'unknown'}</span>
                </div>

                <div className="flex justify-between">
                    <span className="opacity-70">Focus Element:</span>
                    <span>{contextInfo?.activeElement || 'none'} {contextInfo?.activeId ? `#${contextInfo.activeId}` : ''}</span>
                </div>

                <div className="mt-2 border-t border-green-500/30 pt-1">
                    <div className="opacity-70 mb-1">Active Keys:</div>
                    <div className="flex gap-1 flex-wrap min-h-[20px]">
                        {Array.from(activeKeys).map(key => (
                            <span key={key} className="bg-green-900/50 px-1 rounded text-white">{key}</span>
                        ))}
                        {activeKeys.size === 0 && <span className="opacity-30 italic">none</span>}
                    </div>
                </div>

                {lastCommand && (
                    <div className="mt-2 border-t border-green-500/30 pt-1">
                        <div className="opacity-70">Last Command:</div>
                        <div className="text-white font-bold">{lastCommand.id}</div>
                        <div className="text-[10px] opacity-50">{(Date.now() - lastCommand.timestamp)}ms ago</div>
                    </div>
                )}
            </div>
        </div>
    );
}
