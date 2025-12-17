/**
 * Network utility functions
 */

export function isNetworkError(error: any): boolean {
    return (
        error instanceof TypeError &&
        error.message === 'Failed to fetch'
    ) || (
            error?.name === 'NetworkError'
        ) || (
            error?.name === 'OfflineError'
        ) || (
            error?.statusCode === 503
        ) || (
            error?.code === 'NETWORK_ERROR'
        ) || (
            error?.message === 'Network connection failed'
        ) || (
            typeof navigator !== 'undefined' && !navigator.onLine
        );
}

export function isTimeoutError(error: any): boolean {
    return (
        error?.name === 'AbortError' ||
        error?.statusCode === 408 ||
        error?.message?.includes('timeout')
    );
}

export function isAuthError(error: any): boolean {
    return error?.statusCode === 401 || error?.statusCode === 403;
}

export async function checkNetworkConnectivity(): Promise<boolean> {
    if (typeof navigator === 'undefined') return true;

    if (!navigator.onLine) return false;

    try {
        // Try to fetch a small resource to verify actual connectivity
        const response = await fetch('/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

export function getNetworkErrorMessage(error: any): string {
    if (isNetworkError(error)) {
        return 'Network connection failed. Please check your internet connection.';
    }

    if (isTimeoutError(error)) {
        return 'Request timed out. Please try again.';
    }

    if (isAuthError(error)) {
        return 'Authentication failed. Please log in again.';
    }

    return error?.message || 'An unexpected error occurred.';
}