
import { Decimal } from '@prisma/client/runtime/library';

export enum GSTEventType {
    SALE = 'SALE',
    PURCHASE = 'PURCHASE',
    SALE_RETURN = 'SALE_RETURN',
    PURCHASE_RETURN = 'PURCHASE_RETURN',
    EXPENSE = 'EXPENSE',
    STOCK_TRANSFER = 'STOCK_TRANSFER',
    WRITEOFF = 'WRITEOFF'
}

export interface GSTEventBase {
    eventId: string;
    storeId: string;
    date: Date;
    eventType: GSTEventType;
}

export interface GSTSaleItem {
    itemId: string;
    hsnCode: string;
    taxableValue: Decimal | number;
    quantity: number;
    discountAmount: Decimal | number;
    isService?: boolean;
}

export interface GSTSaleEvent extends GSTEventBase {
    eventType: GSTEventType.SALE;
    customerId?: string;
    customerState?: string; // For Place of Supply
    items: GSTSaleItem[];
    isExport?: boolean;
}

export interface GSTPurchaseItem {
    itemId: string;
    hsnCode: string;
    taxableValue: Decimal | number;
    taxPaid: Decimal | number; // Total tax paid to supplier
    quantity: number;
    eligibility: 'ELIGIBLE' | 'INELIGIBLE' | 'BLOCKED';
}

export interface GSTPurchaseEvent extends GSTEventBase {
    eventType: GSTEventType.PURCHASE;
    supplierId: string;
    supplierGstin?: string;
    supplierState?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    items: GSTPurchaseItem[];
}

export interface GSTReturnEvent extends GSTEventBase {
    eventType: GSTEventType.SALE_RETURN | GSTEventType.PURCHASE_RETURN;
    originalEventId: string;
    reason: string;
    items: (GSTSaleItem | GSTPurchaseItem)[];
}
