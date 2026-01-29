/**
 * Medicine Cache Manager Component
 * 
 * UI for managing local medicine cache
 * - Download full database
 * - Sync incremental updates
 * - View cache status
 * - Clear cache
 */

'use client';

import { useState } from 'react';
import { useMedicineCache } from '@/hooks/useMedicineCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Download, RefreshCw, Trash2, Database, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MedicineCacheManager() {
    const {
        cacheStatus,
        syncStatus,
        updateAvailable,
        loadMedicines,
        syncCache,
        clearCache,
        refreshCacheStatus
    } = useMedicineCache();

    const [actionInProgress, setActionInProgress] = useState(false);

    const handleLoadMedicines = async () => {
        setActionInProgress(true);
        try {
            await loadMedicines();
        } catch (error) {
            console.error('Failed to load medicines:', error);
        } finally {
            setActionInProgress(false);
        }
    };

    const handleSync = async () => {
        setActionInProgress(true);
        try {
            await syncCache();
        } catch (error) {
            console.error('Failed to sync:', error);
        } finally {
            setActionInProgress(false);
        }
    };

    const handleClear = async () => {
        if (confirm('Are you sure you want to clear the local medicine cache? You will need to download it again.')) {
            setActionInProgress(true);
            try {
                await clearCache();
            } catch (error) {
                console.error('Failed to clear cache:', error);
            } finally {
                setActionInProgress(false);
            }
        }
    };

    const formatTime = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <CardTitle>Local Medicine Database</CardTitle>
                </div>
                <CardDescription>
                    Download and cache medicines for ultra-fast offline search
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Display */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-medium flex items-center gap-1">
                            {cacheStatus.hasCache ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>Loaded</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 text-gray-400" />
                                    <span>Not loaded</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Medicines</div>
                        <div className="font-medium">{cacheStatus.count.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-muted-foreground">Cache Size</div>
                        <div className="font-medium">{cacheStatus.estimatedMB} MB</div>
                    </div>
                </div>

                {/* Last Sync */}
                <div className="text-sm">
                    <div className="text-muted-foreground">Last synced</div>
                    <div className="font-medium">{formatTime(cacheStatus.lastSync)}</div>
                </div>

                {/* Update Available Alert */}
                {updateAvailable && !syncStatus.isLoading && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Updates available. Sync to get the latest medicine data.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading Progress */}
                {syncStatus.isLoading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {syncStatus.total > 0
                                    ? `Loading: ${syncStatus.loaded.toLocaleString()} / ${syncStatus.total.toLocaleString()}`
                                    : 'Syncing...'}
                            </span>
                            <span className="font-medium">{syncStatus.progress}%</span>
                        </div>
                        <Progress value={syncStatus.progress} />
                    </div>
                )}

                {/* Error Message */}
                {syncStatus.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{syncStatus.error}</AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {!cacheStatus.hasCache ? (
                        <Button
                            onClick={handleLoadMedicines}
                            disabled={actionInProgress || syncStatus.isLoading}
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Database
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleSync}
                                disabled={actionInProgress || syncStatus.isLoading}
                                variant={updateAvailable ? "default" : "outline"}
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {updateAvailable ? 'Sync Updates' : 'Check for Updates'}
                            </Button>
                            <Button
                                onClick={handleClear}
                                disabled={actionInProgress || syncStatus.isLoading}
                                variant="outline"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Cache
                            </Button>
                        </>
                    )}
                </div>

                {/* Benefits */}
                {cacheStatus.hasCache && (
                    <div className="bg-muted rounded-lg p-3 flex items-start gap-2 text-sm">
                        <Zap className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="font-medium">Fast Search Enabled</div>
                            <div className="text-muted-foreground text-xs">
                                Searches will use your local cache for instant results
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
