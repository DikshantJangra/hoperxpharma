import { KeyboardContext, ZoneId } from './types';

export class ContextResolver {

    static resolve(): KeyboardContext {
        if (typeof window === 'undefined') {
            return {
                activeZone: 'global',
                activeElement: null,
                focusType: null,
                isInputActive: false
            };
        }

        const activeElement = document.activeElement as HTMLElement;
        const activeZone = this.resolveActiveZone(activeElement);
        const focusType = this.resolveFocusType(activeElement);
        const isInputActive = this.isInput(activeElement);

        return {
            activeZone,
            activeElement,
            focusType,
            isInputActive
        };
    }

    private static resolveActiveZone(element: HTMLElement | null): ZoneId {
        if (!element) return 'global';

        // Traverse up to find a data-zone attribute
        let current: HTMLElement | null = element;
        while (current) {
            if (current.dataset && current.dataset.zone) {
                return current.dataset.zone;
            }
            current = current.parentElement;
        }

        return 'global';
    }

    private static resolveFocusType(element: HTMLElement | null): string | null {
        if (!element) return null;
        return element.tagName.toLowerCase(); // simplified for now
    }

    private static isInput(element: HTMLElement | null): boolean {
        if (!element) return false;
        const tagName = element.tagName;
        const isContentEditable = element.isContentEditable;

        return (
            tagName === 'INPUT' ||
            tagName === 'TEXTAREA' ||
            tagName === 'SELECT' ||
            isContentEditable
        );
    }
}
