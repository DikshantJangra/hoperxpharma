import { CommandId, KeyBinding, KeyboardContext, CommandHandler } from './types';
import { COMMANDS, getCommandById } from './commands';
import { ContextResolver } from './context-resolver';

type KeyListener = (e: KeyboardEvent) => void;

class KeyboardEngine {
    private isEnabled: boolean = true;
    private bindings: Map<string, CommandId> = new Map(); // key -> commandId
    private handlers: Map<CommandId, Set<CommandHandler>> = new Map();
    private debugMode: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initDefaultBindings();
            // We don't attach listener here, we let the Provider do it to handle cleanup? 
            // Or singleton pattern? Singleton is better for global engine.
        }
    }

    public init() {
        if (typeof window === 'undefined') return;
        window.addEventListener('keydown', this.handleKeyDown);
        console.log('Keyboard Engine Initialized');
    }

    public destroy() {
        if (typeof window === 'undefined') return;
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    public setDebug(enabled: boolean) {
        this.debugMode = enabled;
    }

    private initDefaultBindings() {
        // Load defaults from COMMANDS
        Object.values(COMMANDS).forEach(cmd => {
            if (cmd.defaultKey) {
                this.bindKey(cmd.defaultKey, cmd.id);
            }
        });
    }

    public bindKey(key: string, commandId: CommandId) {
        // Normalize key string here eventually
        this.bindings.set(key.toLowerCase(), commandId);
    }

    public registerHandler(commandId: CommandId, handler: CommandHandler): () => void {
        if (!this.handlers.has(commandId)) {
            this.handlers.set(commandId, new Set());
        }
        const set = this.handlers.get(commandId)!;
        set.add(handler);

        return () => {
            set.delete(handler);
        };
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.isEnabled) return;

        const context = ContextResolver.resolve();
        const key = this.eventToKey(e);

        if (this.debugMode) {
            console.log(`[KeyboardEngine] Key: ${key}, Context:`, context);
        }

        const commandId = this.bindings.get(key);
        if (!commandId) return;

        // Command Found
        if (this.debugMode) {
            console.log(`[KeyboardEngine] Command Triggered: ${commandId}`);
        }

        // Safety Checks
        if (context.isInputActive) {
            // If typing, only allow specific commands (e.g., Submit, Escape, or if whitelisted)
            // For now, let's just block most, but maybe allow 'action.submit' (Ctrl+Enter)
            const command = getCommandById(commandId);

            // Simplistic rule: if it's a single character key and no modifier, it's typing.
            // If modifier is used, or special key (Escape, Enter), it MIGHT be a command.

            const isSimpleTyping = key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
            if (isSimpleTyping) return;

            // Special case: / for search should usually act as search, EXCEPT in an input.
            if (key === '/' && context.isInputActive) return;
        }

        // Execute Handlers
        const handlers = this.handlers.get(commandId);
        if (handlers && handlers.size > 0) {
            e.preventDefault(); // Take over
            handlers.forEach(handler => handler(context));
        }
    };

    private eventToKey(e: KeyboardEvent): string {
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.metaKey) parts.push('meta'); // Treat cmd as separate or normalize to ctrl? Let's keep distinct for now.
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');

        // Safety check: ensure e.key exists before calling toLowerCase
        if (!e.key) {
            console.warn('[KeyboardEngine] Keyboard event has no key property', e);
            return '';
        }

        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'escape') key = 'escape';

        parts.push(key);
        return parts.join('+');
    }
}

export const globalKeyboardEngine = new KeyboardEngine();
