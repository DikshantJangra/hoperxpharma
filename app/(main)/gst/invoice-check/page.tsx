
'use client';

import { useState } from 'react';
import { GSTInvoiceBreakdown } from '@/components/gst/GSTInvoiceBreakdown';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiOutlineCalculator } from 'react-icons/ai';

export default function GSTInvoiceCheckPage() {
    // Mock Data Generator for Demonstration
    const [invoiceData, setInvoiceData] = useState<any>(null);

    const generateSample = (interState: boolean) => {
        const items = [
            {
                name: "Paracetamol 500mg",
                hsn: "3004",
                qty: 10,
                rate: 12,
                taxable: 450,
                cgst: interState ? 0 : 27,
                sgst: interState ? 0 : 27,
                igst: interState ? 54 : 0,
                total: 504
            },
            {
                name: "Cough Syrup",
                hsn: "300490",
                qty: 2,
                rate: 5,
                taxable: 200,
                cgst: interState ? 0 : 5,
                sgst: interState ? 0 : 5,
                igst: interState ? 10 : 0,
                total: 210
            }
        ];

        setInvoiceData({
            invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toISOString(),
            customerState: interState ? "Delhi" : "Maharashtra",
            storeState: "Maharashtra",
            items
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tax Invoice Validator</h1>
                    <p className="text-muted-foreground">Verify tax calculation and breakdown for invoices</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <h3 className="font-semibold">Simulate Invoice</h3>
                            <Button className="w-full" onClick={() => generateSample(false)}>
                                <AiOutlineCalculator className="mr-2" /> Load Intra-State (Local)
                            </Button>
                            <Button className="w-full" variant="secondary" onClick={() => generateSample(true)}>
                                <AiOutlineCalculator className="mr-2" /> Load Inter-State (IGST)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    {invoiceData ? (
                        <GSTInvoiceBreakdown {...invoiceData} />
                    ) : (
                        <div className="flex h-64 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                            Select a simulation to view breakdown
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
