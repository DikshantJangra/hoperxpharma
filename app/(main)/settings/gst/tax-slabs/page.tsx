'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTaxSlabs, seedGSTDefaults, type TaxSlab } from '@/lib/api/gst';
import { AiOutlineLoading3Quarters, AiOutlinePlus } from 'react-icons/ai';

export default function TaxSlabsPage() {
    const [loading, setLoading] = useState(true);
    const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([]);
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTaxSlabs();
    }, []);

    const loadTaxSlabs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTaxSlabs();
            setTaxSlabs(data || []);
        } catch (error: any) {
            console.error('Failed to load tax slabs:', error);
            setError(error.response?.data?.message || 'Failed to load tax slabs. Please login and try again.');
            setTaxSlabs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!confirm('This will create default tax slabs (0%, 5%, 12%, 18%, 28%) and common pharmacy HSN codes. Continue?')) {
            return;
        }

        try {
            setSeeding(true);
            await seedGSTDefaults();
            alert('Default data seeded successfully!');
            loadTaxSlabs();
        } catch (error: any) {
            alert(`Failed to seed defaults: ${error.response?.data?.message || error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tax Slabs</h1>
                    <p className="text-muted-foreground">
                        Manage GST tax rates and configurations
                    </p>
                </div>
                <div className="flex gap-2">
                    {taxSlabs.length === 0 && (
                        <Button
                            onClick={handleSeedDefaults}
                            disabled={seeding}
                            variant="outline"
                        >
                            {seeding && <AiOutlineLoading3Quarters className="h-4 w-4 mr-2 animate-spin" />}
                            Seed Defaults
                        </Button>
                    )}
                    <Button>
                        <AiOutlinePlus className="h-4 w-4 mr-2" />
                        Add Tax Slab
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
            )}

            {(taxSlabs?.length === 0 && !loading && !error) ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                            No tax slabs configured. Click "Seed Defaults" to get started.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taxSlabs?.map((slab) => (
                        <Card key={slab.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{slab.name}</span>
                                    <span className={`text-sm px-2 py-1 rounded ${slab.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {slab.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{slab.taxType}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Rate:</span>
                                        <span className="font-medium">{slab.rate}%</span>
                                    </div>
                                    {slab.isSplit && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">CGST:</span>
                                                <span>{slab.cgstRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">SGST:</span>
                                                <span>{slab.sgstRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">IGST:</span>
                                                <span>{slab.igstRate}%</span>
                                            </div>
                                        </>
                                    )}
                                    {slab.cessRate && slab.cessRate > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cess:</span>
                                            <span>{slab.cessRate}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1">
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="ghost" className="flex-1">
                                        {slab.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
