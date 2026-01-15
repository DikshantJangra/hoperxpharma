/**
 * Emergency utility to clear stuck sync queue
 * Use in browser console: clearSyncQueue()
 */

export async function clearSyncQueue() {
    try {
        const { syncManager } = await import('@/lib/offline/sync-manager');
        await syncManager.clearAllMutations();
        console.log('✅ Sync queue cleared successfully');
        window.location.reload();
    } catch (error) {
        console.error('❌ Failed to clear sync queue:', error);
    }
}

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    (window as any).clearSyncQueue = clearSyncQueue;
}
