'use client';

import { useEffect } from 'react';
import { useKeyboard } from '@/contexts/KeyboardContext';

/**
 * Global hook to implement navigation mode behavior (Tab vs Enter for field navigation)
 * Must be mounted at the app root level.
 */
export function useNavigationMode() {
    const { navigationMode } = useKeyboard();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            // Only apply to form elements
            const isFormElement =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.getAttribute('contenteditable') === 'true';

            if (!isFormElement) return;

            // In Enter mode: Enter moves to next field (like Tab)
            if (navigationMode === 'enter' && e.key === 'Enter' && !e.shiftKey) {
                // Don't interfere with textareas or if Ctrl/Alt/Meta is pressed
                if (target.tagName === 'TEXTAREA') return;
                if (e.ctrlKey || e.altKey || e.metaKey) return;

                e.preventDefault();
                focusNextElement(target);
            }

            // In Enter mode: Shift+Enter moves to previous field (like Shift+Tab)
            if (navigationMode === 'enter' && e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                focusPreviousElement(target);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [navigationMode]);
}

/**
 * Focus the next focusable element in the DOM
 */
function focusNextElement(currentElement: HTMLElement) {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
    }
}

/**
 * Focus the previous focusable element in the DOM
 */
function focusPreviousElement(currentElement: HTMLElement) {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex > 0) {
        focusableElements[currentIndex - 1].focus();
    }
}

/**
 * Get all focusable elements in the document, in DOM order
 */
function getFocusableElements(): HTMLElement[] {
    const selector = [
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
    ].join(',');

    return Array.from(document.querySelectorAll(selector))
        .filter((el) => {
            // Filter out invisible elements
            const element = el as HTMLElement;
            return element.offsetWidth > 0 && element.offsetHeight > 0;
        }) as HTMLElement[];
}
