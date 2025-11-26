import { useEffect, useRef, useCallback } from 'react';

export type ShortcutKey = string; // e.g., 'ctrl+s', 'ctrl+enter', '/', 'alt+q'
export type ShortcutHandler = () => void;

/**
 * Keyboard Shortcuts Manager
 * Centralized keyboard shortcut handling for the efficient PO composer
 */
export function useKeyboardShortcuts() {
    const shortcuts = useRef<Map<ShortcutKey, ShortcutHandler>>(new Map());
    const isEnabled = useRef(true);

    /**
     * Register a keyboard shortcut
     */
    const registerShortcut = useCallback((key: ShortcutKey, handler: ShortcutHandler) => {
        shortcuts.current.set(key.toLowerCase(), handler);
    }, []);

    /**
     * Unregister a keyboard shortcut
     */
    const unregisterShortcut = useCallback((key: ShortcutKey) => {
        shortcuts.current.delete(key.toLowerCase());
    }, []);

    /**
     * Enable/disable all shortcuts
     */
    const setEnabled = useCallback((enabled: boolean) => {
        isEnabled.current = enabled;
    }, []);

    /**
     * Convert keyboard event to shortcut key string
     */
    const eventToKey = (e: KeyboardEvent): string => {
        const parts: string[] = [];

        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        // Normalize key
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'escape') key = 'esc';

        parts.push(key);

        return parts.join('+');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEnabled.current) return;

            // Don't trigger shortcuts when typing in inputs (except for specific keys like '/')
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            const key = eventToKey(e);
            const handler = shortcuts.current.get(key);

            if (handler) {
                // Allow '/' to work even in inputs (for search focus)
                if (key === '/' || !isInput) {
                    e.preventDefault();
                    handler();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        registerShortcut,
        unregisterShortcut,
        setEnabled
    };
}

/**
 * Hook to show keyboard shortcut help
 */
export function useShortcutHelp() {
    const shortcuts = [
        { key: 'Ctrl+S', description: 'Save Draft' },
        { key: 'Ctrl+Enter', description: 'Send Order' },
        { key: 'Ctrl+Shift+Enter', description: 'Request Approval' },
        { key: '/', description: 'Focus Product Search' },
        { key: 'Alt+Q', description: 'Quick Add from Suggestions' },
        { key: 'Esc', description: 'Cancel / Close' },
        { key: '↑/↓', description: 'Navigate Results' },
        { key: 'Enter', description: 'Select Item' }
    ];

    return shortcuts;
}
