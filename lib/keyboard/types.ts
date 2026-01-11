export type CommandId = string;
export type ZoneId = string;
export type ContextId = string;

export interface KeyBinding {
    commandId: CommandId;
    keys: string; // e.g. "ctrl+s", "enter"
    scope?: ContextScope;
    condition?: (context: KeyboardContext) => boolean;
}

export interface ContextScope {
    zone?: ZoneId; // e.g. "pos-grid", "modal"
    focusType?: string; // e.g. "input", "cell"
}

export interface KeyboardContext {
    activeZone: ZoneId;
    activeElement: HTMLElement | null;
    focusType: string | null; // Derived from activeElement
    isInputActive: boolean;
}

export interface Command {
    id: CommandId;
    label: string;
    description?: string;
    defaultKey?: string;
    category?: 'navigation' | 'action' | 'contextual';
}

export type CommandHandler = (context: KeyboardContext) => void;
