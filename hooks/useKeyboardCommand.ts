import { useEffect } from 'react';
import { CommandId, CommandHandler } from '@/lib/keyboard/types';
import { globalKeyboardEngine } from '@/lib/keyboard/engine';

export function useKeyboardCommand(commandId: CommandId, handler: CommandHandler, deps: any[] = []) {
    useEffect(() => {
        // Register handler with the engine
        const unregister = globalKeyboardEngine.registerHandler(commandId, handler);
        return unregister;
    }, deps); // Re-register if deps change
}
