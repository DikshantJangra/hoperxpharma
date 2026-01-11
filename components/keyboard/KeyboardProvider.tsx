'use client';

import { useEffect } from 'react';
import { globalKeyboardEngine } from '@/lib/keyboard/engine';
import { useNavigationMode } from '@/hooks/useNavigationMode';

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    // Initialize the global keyboard engine
    useEffect(() => {
        globalKeyboardEngine.init();
        return () => globalKeyboardEngine.destroy();
    }, []);

    return <>{children}</>;
}
