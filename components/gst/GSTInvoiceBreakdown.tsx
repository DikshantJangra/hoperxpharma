
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types (simplified for UI)
interface TaxItem {
    name: string;
    hsn: string;
    qty: number;
    rate: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

interface GSTInvoiceBreakdownProps {
    items: TaxItem[];
    invoiceNumber: string;
    date: string;
    customerState?: string;
    storeState?: string;
}

export function GSTInvoiceBreakdown({ items, invoiceNumber, date, customerState, storeState }: GSTInvoiceBreakdownProps) {
    const totalTaxable = items.reduce((sum, item) => sum + item.taxable, 0);
    const totalCGST = items.reduce((sum, item) => sum + item.cgst, 0);
    const totalSGST = items.reduce((sum, item) => sum + item.sgst, 0);
    const totalIGST = items.reduce((sum, item) => sum + item.igst, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const isInterState = customerState && storeState && customerState.toLowerCase() !== storeState.toLowerCase();

    return (
        <Card className="w-full">
            <CardHeader className="pb-2 bg-muted/20">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Tax Invoice Breakdown</CardTitle>
                        <p className="text-sm text-muted-foreground">Invoice #: {invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">Date: {new Date(date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p>Place of Supply: <span className="font-semibold">{customerState || 'N/A'}</span></p>
                        <p>Type: <span className="font-semibold text-primary">{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</span></p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="p-3 text-left">Item / HSN</th>
                                <th className="p-3 text-right">Taxable Val</th>
                                <th className="p-3 text-center">Rate</th>
                                {!isInterState && <th className="p-3 text-right">CGST</th>}
                                {!isInterState && <th className="p-3 text-right">SGST</th>}
                                {isInterState && <th className="p-3 text-right">IGST</th>}
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                                    <td className="p-3">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">HSN: {item.hsn}</div>
                                    </td>
                                    <td className="p-3 text-right">₹{item.taxable.toFixed(2)}</td>
                                    <td className="p-3 text-center">{item.rate}%</td>
                                    {!isInterState && <td className="p-3 text-right">₹{item.cgst.toFixed(2)}</td>}
                                    {!isInterState && <td className="p-3 text-right">₹{item.sgst.toFixed(2)}</td>}
                                    {isInterState && <td className="p-3 text-right">₹{item.igst.toFixed(2)}</td>}
                                    <td className="p-3 text-right font-medium">₹{item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-muted/20 font-bold border-t">
                            <tr>
                                <td className="p-3">Totals</td>
                                <td className="p-3 text-right">₹{totalTaxable.toFixed(2)}</td>
                                <td className="p-3"></td>
                                {!isInterState && <td className="p-3 text-right">₹{totalCGST.toFixed(2)}</td>}
                                {!isInterState && <td className="p-3 text-right">₹{totalSGST.toFixed(2)}</td>}
                                {isInterState && <td className="p-3 text-right">₹{totalIGST.toFixed(2)}</td>}
                                <td className="p-3 text-right">₹{grandTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
