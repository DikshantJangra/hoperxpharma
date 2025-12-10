import { useCallback } from 'react';
import { useKeyboard } from '@/contexts/KeyboardContext';

export function useKeyboardNavigation() {
    const { navigationMode } = useKeyboard();

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (navigationMode === 'enter' && e.key === 'Enter') {
            const target = e.target as HTMLElement;

            // 1. Allow default behavior for TextAreas (newlines)
            if (target instanceof HTMLTextAreaElement) {
                return;
            }

            // 2. Allow default behavior for Submit Buttons
            if (target instanceof HTMLButtonElement && target.type === 'submit') {
                return;
            }

            // 3. Allow default behavior for links
            if (target instanceof HTMLAnchorElement) {
                return;
            }

            e.preventDefault();

            // 4. Find all focusable elements in the current form or widely in the modal/document
            // We search in the closest form first, or fallback to the document body
            const container = target.closest('form') || target.closest('[role="dialog"]') || document.body;

            const focusableQuery = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
            const focusableElements = Array.from(container.querySelectorAll(focusableQuery)) as HTMLElement[];

            // Filter out hidden elements (offsetParent is null for hidden elements)
            const visibleFocusableElements = focusableElements.filter(el =>
                el.offsetParent !== null &&
                !el.hasAttribute('aria-hidden') &&
                el.style.display !== 'none' &&
                el.style.visibility !== 'hidden'
            );

            const index = visibleFocusableElements.indexOf(target);

            if (index > -1) {
                if (index < visibleFocusableElements.length - 1) {
                    // Move to next element
                    visibleFocusableElements[index + 1].focus();
                } else {
                    // It's the last element. Check if we should loop (Focus Trap)
                    const isFocusTrap = container.getAttribute('data-focus-trap') === 'true';

                    if (isFocusTrap && visibleFocusableElements.length > 0) {
                        // Loop back to first element
                        visibleFocusableElements[0].focus();
                        e.preventDefault(); // Ensure we don't submit even if it's the last element
                    } else {
                        // Default behavior: try to submit form if it exists
                        const form = target.closest('form');
                        if (form) {
                            form.requestSubmit();
                        }
                    }
                }
            }
        }
    }, [navigationMode]);

    return { handleKeyDown };
}
