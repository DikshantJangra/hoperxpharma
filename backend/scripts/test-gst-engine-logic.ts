
import { GSTEngine } from '../lib/gst/GSTEngine';
import { GSTSaleEvent, GSTEventType } from '../lib/gst/types';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
    console.log('Testing GST Calculation Logic...');

    // Test 1: Intra-state (Same State)
    const intraResult = GSTEngine.calculateTax(1000, 18, 'Delhi', 'Delhi');
    console.log('Intra-state (1000 @ 18%):', {
        cgst: intraResult.cgst.toString(),
        sgst: intraResult.sgst.toString(),
        igst: intraResult.igst.toString(),
        total: intraResult.totalTax.toString()
    });

    if (intraResult.cgst.equals(90) && intraResult.sgst.equals(90) && intraResult.igst.equals(0)) {
        console.log('✅ Intra-state logic passed');
    } else {
        console.error('❌ Intra-state logic failed');
    }

    // Test 2: Inter-state (Different State)
    const interResult = GSTEngine.calculateTax(1000, 18, 'Delhi', 'Haryana');
    console.log('Inter-state (1000 @ 18%):', {
        cgst: interResult.cgst.toString(),
        sgst: interResult.sgst.toString(),
        igst: interResult.igst.toString(),
        total: interResult.totalTax.toString()
    });

    if (interResult.cgst.equals(0) && interResult.sgst.equals(0) && interResult.igst.equals(180)) {
        console.log('✅ Inter-state logic passed');
    } else {
        console.error('❌ Inter-state logic failed');
    }
}

main().catch(console.error);
