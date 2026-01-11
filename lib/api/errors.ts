/**
 * API Error class
 */
export class ApiRequestError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiRequestError';
    }
}

export class OfflineError extends Error {
    constructor() {
        super('Network offline. Action queued for sync.');
        this.name = 'OfflineError';
    }
}
