/**
 * Scenario Context
 * Shared mutable state across scenario steps
 */

import { ExecutionMode, ScenarioContext as IScenarioContext } from '../types';

export class ScenarioContext implements IScenarioContext {
    #data: Map<string, unknown> = new Map();

    public readonly mode: ExecutionMode;
    public storeId: string = '';
    public userId: string = '';
    public authToken: string = '';

    constructor(mode: ExecutionMode) {
        this.mode = mode;
    }

    get<T>(key: string): T {
        if (!this.#data.has(key)) {
            throw new Error(`Context key "${key}" not found. Available keys: ${Array.from(this.#data.keys()).join(', ')}`);
        }
        return this.#data.get(key) as T;
    }

    set<T>(key: string, value: T): void {
        this.#data.set(key, value);
    }

    has(key: string): boolean {
        return this.#data.has(key);
    }

    snapshot(): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        this.#data.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Set auth credentials in context
     */
    setAuth(userId: string, storeId: string, authToken: string): void {
        this.userId = userId;
        this.storeId = storeId;
        this.authToken = authToken;
        this.set('authToken', authToken);
        this.set('userId', userId);
        this.set('storeId', storeId);
    }

    /**
     * Clear all data (for cleanup)
     */
    clear(): void {
        this.#data.clear();
        this.storeId = '';
        this.userId = '';
        this.authToken = '';
    }
}
