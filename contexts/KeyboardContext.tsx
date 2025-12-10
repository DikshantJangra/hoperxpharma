'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type NavigationMode = 'tab' | 'enter';

interface KeyBindings {
    [key: string]: string;
}

interface KeyboardContextType {
    navigationMode: NavigationMode;
    toggleNavigationMode: () => void;
    setNavigationMode: (mode: NavigationMode) => void;
    keyBindings: KeyBindings;
}

const defaultKeyBindings: KeyBindings = {
    'Next Field': 'Tab',
    'Previous Field': 'Shift + Tab',
    'Submit': 'Enter (if mode is Tab)',
    'Next Field (Alt)': 'Enter (if mode is Enter)',
};

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

import { useAuthStore } from '@/lib/store/auth-store';
import { userApi } from '@/lib/api/user';

const PREF_KEY = 'keyboardNavigationMode';

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    const [navigationMode, setNavigationModeState] = useState<NavigationMode>('tab');
    const { user, updateUser } = useAuthStore();

    // Load preference from User Profile (priority) or LocalStorage (fallback)
    useEffect(() => {
        if (user?.preferences?.keyboard?.navigationMode) {
            setNavigationModeState(user.preferences.keyboard.navigationMode as NavigationMode);
        } else {
            const savedMode = localStorage.getItem(PREF_KEY) as NavigationMode;
            if (savedMode && (savedMode === 'tab' || savedMode === 'enter')) {
                setNavigationModeState(savedMode);
            }
        }
    }, [user?.preferences]);

    const setNavigationMode = async (mode: NavigationMode) => {
        // optimistically update state
        setNavigationModeState(mode);
        localStorage.setItem(PREF_KEY, mode);

        // Sync with backend if user is logged in
        if (user) {
            try {
                const currentPrefs = user.preferences || {};
                const updatedPrefs = {
                    ...currentPrefs,
                    keyboard: {
                        ...currentPrefs.keyboard,
                        navigationMode: mode
                    }
                };

                // Update via API
                const updatedUser = await userApi.updateUserProfile({
                    preferences: updatedPrefs
                });

                // Update local auth store to reflect new prefs
                updateUser(updatedUser);
            } catch (error) {
                console.error("Failed to save keyboard preference:", error);
            }
        }
    };

    const toggleNavigationMode = () => {
        setNavigationMode(navigationMode === 'tab' ? 'enter' : 'tab');
    };

    return (
        <KeyboardContext.Provider
            value={{
                navigationMode,
                toggleNavigationMode,
                setNavigationMode,
                keyBindings: defaultKeyBindings,
            }}
        >
            {children}
        </KeyboardContext.Provider>
    );
}

export function useKeyboard() {
    const context = useContext(KeyboardContext);
    if (context === undefined) {
        throw new Error('useKeyboard must be used within a KeyboardProvider');
    }
    return context;
}
