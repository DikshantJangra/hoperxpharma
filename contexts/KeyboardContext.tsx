'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { userApi } from '@/lib/api/user';

export type NavigationMode = 'tab' | 'enter';

export interface KeyBindings {
    [commandId: string]: string; // Command ID -> Key Combination
}

interface KeyboardContextType {
    navigationMode: NavigationMode;
    toggleNavigationMode: () => void;
    setNavigationMode: (mode: NavigationMode) => void;
    keyBindings: KeyBindings;
    updateKeyBinding: (commandId: string, key: string) => void;
}

const defaultKeyBindings: KeyBindings = {
    // These will eventually be loaded from the Command Registry
    'nav.next': 'Tab',
    'nav.prev': 'Shift+Tab',
    'action.submit': 'Enter',
};

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

const PREF_KEY = 'keyboardNavigationMode';

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    const [navigationMode, setNavigationModeState] = useState<NavigationMode>('tab');
    const [keyBindings, setKeyBindings] = useState<KeyBindings>(defaultKeyBindings);

    const { user, updateUser } = useAuthStore();

    const BINDINGS_PREF_KEY = 'customKeyBindings';

    // Load preference from User Profile (priority) or LocalStorage (fallback)
    useEffect(() => {
        // 1. Navigation Mode
        if (user?.preferences?.keyboard?.navigationMode) {
            setNavigationModeState(user.preferences.keyboard.navigationMode as NavigationMode);
        } else {
            const savedMode = localStorage.getItem(PREF_KEY) as NavigationMode;
            if (savedMode && (savedMode === 'tab' || savedMode === 'enter')) {
                setNavigationModeState(savedMode);
            }
        }

        // 2. Custom Key Bindings
        let savedBindings: KeyBindings = {};
        if (user?.preferences?.keyboard?.keyBindings) {
            savedBindings = user.preferences.keyboard.keyBindings;
        } else {
            const localBindings = localStorage.getItem(BINDINGS_PREF_KEY);
            if (localBindings) {
                try {
                    savedBindings = JSON.parse(localBindings);
                } catch (e) {
                    console.error('Failed to parse local key bindings', e);
                }
            }
        }

        // Merge saved bindings with defaults to ensure new commands are present
        setKeyBindings(prev => ({
            ...prev,
            ...savedBindings
        }));

    }, [user?.preferences]);

    const setNavigationMode = async (mode: NavigationMode) => {
        // 1. Optimistically update state and LocalStorage immediately
        setNavigationModeState(mode);
        localStorage.setItem(PREF_KEY, mode);

        // 2. Try to sync with backend (non-blocking, fire-and-forget)
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

                const updatedUser = await userApi.updateUserProfile({
                    preferences: updatedPrefs
                });
                updateUser(updatedUser);
            } catch (error) {
                // Silently fail - LocalStorage is already updated
                console.warn("Backend sync failed for keyboard preference, using local storage:", error);
            }
        }
    };

    const toggleNavigationMode = () => {
        setNavigationMode(navigationMode === 'tab' ? 'enter' : 'tab');
    };

    const updateKeyBinding = async (commandId: string, key: string) => {
        const newBindings = {
            ...keyBindings,
            [commandId]: key
        };

        // 1. Update State and LocalStorage immediately
        setKeyBindings(newBindings);
        localStorage.setItem(BINDINGS_PREF_KEY, JSON.stringify(newBindings));

        // 2. Try to sync with backend (non-blocking)
        if (user) {
            try {
                const currentPrefs = user.preferences || {};
                const updatedPrefs = {
                    ...currentPrefs,
                    keyboard: {
                        ...currentPrefs.keyboard,
                        keyBindings: newBindings
                    }
                };

                const updatedUser = await userApi.updateUserProfile({
                    preferences: updatedPrefs
                });
                updateUser(updatedUser);
            } catch (error) {
                // Silently fail - LocalStorage is already updated
                console.warn("Backend sync failed for key binding, using local storage:", error);
            }
        }
    };

    return (
        <KeyboardContext.Provider
            value={{
                navigationMode,
                toggleNavigationMode,
                setNavigationMode,
                keyBindings,
                updateKeyBinding
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
