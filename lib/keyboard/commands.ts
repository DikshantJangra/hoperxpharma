import { Command } from './types';

export const COMMANDS: Record<string, Command> = {
    // Navigation
    NAV_NEXT: {
        id: 'nav.next',
        label: 'Next Field',
        defaultKey: 'Tab',
        category: 'navigation',
        description: 'Move focus to the next element'
    },
    NAV_PREV: {
        id: 'nav.prev',
        label: 'Previous Field',
        defaultKey: 'Shift+Tab',
        category: 'navigation',
        description: 'Move focus to the previous element'
    },
    NAV_UP: {
        id: 'nav.up',
        label: 'Move Up',
        defaultKey: 'ArrowUp',
        category: 'navigation'
    },
    NAV_DOWN: {
        id: 'nav.down',
        label: 'Move Down',
        defaultKey: 'ArrowDown',
        category: 'navigation'
    },

    // Actions
    ACTION_SUBMIT: {
        id: 'action.submit',
        label: 'Submit',
        defaultKey: 'Ctrl+Enter',
        category: 'action'
    },
    ACTION_ESCAPE: {
        id: 'action.escape',
        label: 'Close / Cancel',
        defaultKey: 'Escape',
        category: 'action'
    },

    // Global
    GLOBAL_SEARCH: {
        id: 'global.search',
        label: 'Global Search',
        defaultKey: '/',
        category: 'action'
    },
    GLOBAL_HELP: {
        id: 'global.help',
        label: 'Show Shortcuts',
        defaultKey: '?', // eventToKey handles shift+? as just ? if we want, or Shift+?
        // Actually event.key for '?' is '?' (shifted /). 
        // My engine normalizes e.key.toLowerCase(). '?' lower is '?'. 
        // But if shift is pressed, e.key is '?'. 
        // If I press Shift+/, e.key is '?'. 
        // My engine logic: parts.push('shift') if shiftKey. 
        // So it produces "shift+?". 
        // Let's expect "shift+?" or just "?" if we rely on the char.
        // Standard: "Shift+?" 
        category: 'action'
    },

    // Dashboard Interactions
    ACTION_NEW_RX: {
        id: 'action.newRx',
        label: 'New Prescription',
        defaultKey: 'n',
        category: 'action'
    },
    ACTION_START_FILL: {
        id: 'action.startFill',
        label: 'Start Fill',
        defaultKey: 's',
        category: 'action'
    },
    NAV_NEXT_ITEM: {
        id: 'nav.itemNext',
        label: 'Next Item',
        defaultKey: 'j',
        category: 'navigation'
    },
    NAV_PREV_ITEM: {
        id: 'nav.itemPrev',
        label: 'Previous Item',
        defaultKey: 'k',
        category: 'navigation'
    },

    // POS Function Keys
    POS_SAVE_DRAFT: {
        id: 'pos.saveDraft',
        label: 'Save Draft',
        defaultKey: 'F2',
        category: 'action'
    },
    POS_CUSTOMER_SEARCH: {
        id: 'pos.customerSearch',
        label: 'Customer Search',
        defaultKey: 'F4',
        category: 'action'
    },
    POS_PRESCRIPTION: {
        id: 'pos.prescription',
        label: 'Prescription Import',
        defaultKey: 'F6',
        category: 'action'
    },
    POS_PARK_SALE: {
        id: 'pos.parkSale',
        label: 'Park Sale',
        defaultKey: 'F8',
        category: 'action'
    },
    POS_SPLIT_PAYMENT: {
        id: 'pos.splitPayment',
        label: 'Split Payment',
        defaultKey: 'F9',
        category: 'action'
    },
    POS_QUICK_PAY: {
        id: 'pos.quickPay',
        label: 'Quick Pay (Cash)',
        defaultKey: 'F12',
        category: 'action'
    },
    POS_PRINT_LAST: {
        id: 'pos.printLast',
        label: 'Print Last Receipt',
        defaultKey: 'ctrl+p',
        category: 'action'
    },

    GLOBAL_DASHBOARD: {
        id: 'global.dashboard',
        label: 'Go to Dashboard',
        defaultKey: 'g+d',
        category: 'navigation'
    }
};

export const getCommandById = (id: string): Command | undefined => {
    return Object.values(COMMANDS).find(c => c.id === id);
}
