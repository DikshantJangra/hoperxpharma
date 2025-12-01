import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';

interface UsePatientHotkeysOptions {
    onSearch?: () => void;
    onQuickAdd?: () => void;
    onCreateSale?: (patientId?: string) => void;
    onEdit?: () => void;
    onHold?: () => void;
    enabled?: boolean;
}

/**
 * Custom hook for patient-related keyboard shortcuts
 * 
 * Shortcuts:
 * - F2: Focus search input
 * - F3: Open quick add patient modal
 * - F4: Edit selected patient
 * - F9: Hold current action
 * - F12: Create sale for patient
 * - Ctrl+Enter: Submit form
 * - Esc: Close modal/drawer
 */
export function usePatientHotkeys(options: UsePatientHotkeysOptions = {}) {
    const {
        onSearch,
        onQuickAdd,
        onCreateSale,
        onEdit,
        onHold,
        enabled = true,
    } = options;

    const router = useRouter();

    // F2 - Focus search
    useHotkeys(
        'f2',
        (e) => {
            e.preventDefault();
            if (onSearch) {
                onSearch();
            } else {
                // Default: focus search input
                const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"]');
                searchInput?.focus();
            }
        },
        { enabled },
        [onSearch]
    );

    // F3 - Quick add patient
    useHotkeys(
        'f3',
        (e) => {
            e.preventDefault();
            if (onQuickAdd) {
                onQuickAdd();
            }
        },
        { enabled },
        [onQuickAdd]
    );

    // F4 - Edit selected patient
    useHotkeys(
        'f4',
        (e) => {
            e.preventDefault();
            if (onEdit) {
                onEdit();
            }
        },
        { enabled },
        [onEdit]
    );

    // F9 - Hold current action
    useHotkeys(
        'f9',
        (e) => {
            e.preventDefault();
            if (onHold) {
                onHold();
            }
        },
        { enabled },
        [onHold]
    );

    // F12 - Create sale
    useHotkeys(
        'f12',
        (e) => {
            e.preventDefault();
            if (onCreateSale) {
                onCreateSale();
            }
        },
        { enabled },
        [onCreateSale]
    );

    // Ctrl+Enter - Submit form (handled by individual forms)
    // Esc - Close modal (handled by individual modals)

    return {
        // Expose methods for programmatic triggering
        triggerSearch: onSearch,
        triggerQuickAdd: onQuickAdd,
        triggerCreateSale: onCreateSale,
        triggerEdit: onEdit,
        triggerHold: onHold,
    };
}
