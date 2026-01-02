/**
 * API Error class
 */
export class RequestError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'RequestError';
    }
}

export class OfflineError extends Error {
    constructor() {
        super('Network offline. Action queued for sync.');
        this.name = 'OfflineError';
    }
}
