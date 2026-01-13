'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/api/client';
import ReceivingTable from '@/components/grn/ReceivingTable';
import ModernReceivingTable from '@/components/grn/ModernReceivingTable';
import POSummaryCard from '@/components/grn/POSummaryCard';
import LiveSummaryPanel from '@/components/grn/LiveSummaryPanel';
import CompletionSummary from '@/components/grn/CompletionSummary';
import AttachmentUploader from '@/components/orders/AttachmentUploader';
import CompactAttachmentUploader from '@/components/grn/CompactAttachmentUploader';
import ValidationModal from '@/components/grn/ValidationModal';
import StatusConfirmationModal from '@/components/grn/StatusConfirmationModal';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { toast } from 'sonner';
import { grnApi } from '@/lib/api/grn';
import { purchaseOrderApi } from '@/lib/api/purchaseOrders';
import { scanApi } from '@/lib/api/scan';

export default function ReceiveShipmentPage() {
    const params = useParams();
    const router = useRouter();
    const poId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [grn, setGrn] = useState<any>(null);
    const [po, setPO] = useState<any>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false); // Track if ANY item is currently saving
    const [isFlushing, setIsFlushing] = useState(false); // Track if we're flushing pending updates before completion
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [useModernUI, setUseModernUI] = useState(true); // Toggle for new UI

    // Invoice details
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [notes, setNotes] = useState('');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        initializeGRN();
    }, [poId]);

    // Populate invoice details from GRN when it loads
    useEffect(() => {
        if (grn) {
            if (grn.supplierInvoiceNo) setInvoiceNo(grn.supplierInvoiceNo);
            if (grn.supplierInvoiceDate) {
                // Convert ISO date to YYYY-MM-DD format for input
                const date = new Date(grn.supplierInvoiceDate);
                const formattedDate = date.toISOString().split('T')[0];
                setInvoiceDate(formattedDate);
            } else {
                // Auto-set to today if not already set
                const today = new Date().toISOString().split('T')[0];
                setInvoiceDate(today);
            }
            if (grn.notes) setNotes(grn.notes);
        }
    }, [grn]);

    // Auto-save every 45 seconds to prevent data loss if browser crashes
    useEffect(() => {
        if (!grn) return;

        const autoSaveInterval = setInterval(() => {
            handleSaveDraft(true);
        }, 45000); // 45 seconds

        return () => clearInterval(autoSaveInterval);
    }, [grn, invoiceNo, invoiceDate, notes]);

    // DISABLED: Background sync was causing items to re-order
    // The optimistic updates + debounced API calls are sufficient
    // If needed in future, implement smart merging instead of full state replacement
    /*
    useEffect(() => {
        if (!grn) return;

        const syncInterval = setInterval(async () => {
            // Only sync if no pending updates
            if (pendingUpdatesRef.current.size === 0) {
                try {
                    const token = tokenManager.getAccessToken();
                    const response = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const grnData = await response.json();
                        setGrn(grnData.data);
                    }
                } catch (error) {
                    console.error('Background sync error:', error);
                }
            }
        }, 10000); // Sync every 10 seconds when idle

        return () => clearInterval(syncInterval);
    }, [grn?.id]);
    */

    const grnRef = React.useRef<any>(null);

    // Keep ref in sync with state for initialization/reloads
    useEffect(() => {
        if (grn) grnRef.current = grn;
    }, [grn]);

    const initializeGRN = async () => {
        setLoading(true);
        try {
            const grnData = await grnApi.createGRN(poId);

            if (grnData) {
                setGrn(grnData);
                grnRef.current = grnData; // Sync ref immediately

                // Set PO from GRN response if available, otherwise fetch it
                if (grnData.po && grnData.po.items) {
                    setPO(grnData.po);
                } else {
                    // Fallback: fetch PO details separately
                    try {
                        const poData = await purchaseOrderApi.getPOById(poId);
                        if (poData) {
                            setPO(poData);
                        } else {
                            console.error('Failed to fetch PO details');
                        }
                    } catch (poError) {
                        console.error('Error fetching PO:', poError);
                    }
                }

                setLastSaved(new Date());
            } else {
                throw new Error('Failed to create GRN');
            }
        } catch (error) {
            console.error('[ReceiveShipment] Error initializing GRN:', error);
            alert(`Error initializing GRN: ${error instanceof Error ? error.message : 'Unknown error'}`);
            router.push('/orders/pending');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async (isAutoSave = false) => {
        if (isAutoSave) {
            setAutoSaving(true);
        } else {
            setSaving(true);
        }

        const currentGrn = grnRef.current || grn;

        try {
            const payload: any = { status: 'IN_PROGRESS' };
            if (invoiceNo) payload.supplierInvoiceNo = invoiceNo;
            if (invoiceDate) payload.supplierInvoiceDate = new Date(invoiceDate).toISOString();
            if (notes) payload.notes = notes;

            await grnApi.updateGRN(currentGrn.id, payload);

            setLastSaved(new Date());
            if (!isAutoSave) {
                toast.success('Draft saved successfully!');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            if (!isAutoSave) {
                toast.error('Failed to save draft');
            }
        } finally {
            if (isAutoSave) {
                setAutoSaving(false);
            } else {
                setSaving(false);
            }
        }
    };

    // Use a Map to store timeouts for EACH item independently to prevent race conditions
    const updateTimeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
    const pendingUpdatesRef = React.useRef<Set<string>>(new Set());

    const handleItemUpdate = async (itemId: string, updates: any) => {
        // Define fields that should propagate from parent to children
        const PROPAGATABLE_FIELDS = ['batchNumber', 'expiryDate', 'mrp', 'unitPrice', 'discountPercent', 'discountType', 'gstPercent', 'location', 'manufacturerBarcode'];
        const isPropagatingUpdate = Object.keys(updates).some(key => PROPAGATABLE_FIELDS.includes(key));

        // Optimistic update (immediate UI feedback) with REF update
        setGrn((prevGrn: any) => {
            if (!prevGrn) return null;

            // Use prevGrn to calculate new state
            // Check if this is a parent item that should propagate updates
            const parentItem = prevGrn.items.find((i: any) => i.id === itemId);
            const shouldPropagate = parentItem && parentItem.isSplit && isPropagatingUpdate;

            const updatedItems = prevGrn.items.map((item: any) => {
                // 1. Update the item itself if it matches
                if (item.id === itemId) {
                    return { ...item, ...updates };
                }

                // 2. If this item has children, check if one of the children is the item being updated
                if (item.children && item.children.length > 0) {
                    const childIndex = item.children.findIndex((c: any) => c.id === itemId);
                    if (childIndex !== -1) {
                        // Found the child in this parent's children array
                        const updatedChildren = [...item.children];
                        updatedChildren[childIndex] = { ...updatedChildren[childIndex], ...updates };
                        return { ...item, children: updatedChildren };
                    }
                }

                // 3. Propagate to children if this is a parent item and propagation is enabled
                if (shouldPropagate && item.parentItemId === itemId) {
                    // Only apply updates for propagatable fields
                    const childUpdates: any = {};
                    PROPAGATABLE_FIELDS.forEach(field => {
                        if (updates[field] !== undefined) {
                            childUpdates[field] = updates[field];
                        }
                    });

                    // Note: If we are updating a child here via propagation, we don't need to check 
                    // if it has its own children (grand-children) as that's not supported
                    return { ...item, ...childUpdates };
                }

                // 4. Also propagate to children inside the children array of the parent
                if (shouldPropagate && item.id === itemId && item.children) {
                    const childUpdates: any = {};
                    PROPAGATABLE_FIELDS.forEach(field => {
                        if (updates[field] !== undefined) {
                            childUpdates[field] = updates[field];
                        }
                    });

                    const updatedChildren = item.children.map((child: any) => ({
                        ...child,
                        ...childUpdates
                    }));
                    return { ...item, ...updates, children: updatedChildren };
                }

                return item;
            });

            const newGrnState = { ...prevGrn, items: updatedItems };
            grnRef.current = newGrnState; // CRITICAL: Update ref synchronously
            return newGrnState;
        });

        // Track pending updates
        pendingUpdatesRef.current.add(itemId);

        const currentGrn = grnRef.current || grn;

        // If propagating, find children and add them to pending too
        // Note: We use the 'grnRef' which is fresh enough for finding relationships
        const isParent = currentGrn?.items?.find((i: any) => i.id === itemId)?.isSplit;
        let childIds: string[] = [];

        if (isParent && isPropagatingUpdate) {
            childIds = currentGrn.items
                .filter((i: any) => i.parentItemId === itemId)
                .map((i: any) => i.id);
            childIds.forEach((id: string) => pendingUpdatesRef.current.add(id));
        }

        // Set auto-saving state to true
        setIsAutoSaving(true);
        setLastSaved(null); // Clear last saved while saving

        // Debounce the API call PER ITEM to ensure all updates are saved
        const existingTimeout = updateTimeoutsRef.current.get(itemId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const newTimeout = setTimeout(async () => {
            // Remove this timeout from the map
            updateTimeoutsRef.current.delete(itemId);

            const token = tokenManager.getAccessToken();

            // Function to process a single item update
            const updateSingleItem = async (id: string, itemUpdates: any) => {
                try {
                    // Sanitize values - ONLY include fields explicitly being updated
                    const sanitizedUpdates: any = {};
                    const numericFields = ['receivedQty', 'freeQty', 'unitPrice', 'discountPercent', 'gstPercent', 'mrp'];

                    for (const [key, value] of Object.entries(itemUpdates)) {
                        if (numericFields.includes(key)) {
                            // CRITICAL FIX: Skip undefined/null/empty values to preserve existing DB values
                            // Don't default to 0 - that would overwrite previously set MRP!
                            if (value === null || value === undefined || value === '') {
                                continue;  // Don't include in update payload
                            } else {
                                const parsedValue = key.includes('Qty') ? parseInt(value as string) : parseFloat(value as string);
                                sanitizedUpdates[key] = isNaN(parsedValue) ? 0 : parsedValue;
                            }
                        } else {
                            sanitizedUpdates[key] = value;
                        }
                    }

                    await grnApi.updateItem(currentGrn.id, id, sanitizedUpdates);

                    // We don't need to consume the response data here because we already did optimistic updates.
                    // The only risk is if server transforms data differently, but we'll fetch fresh on save/complete.
                    pendingUpdatesRef.current.delete(id);

                    // If no more pending updates, we are done saving
                    if (pendingUpdatesRef.current.size === 0) {
                        setIsAutoSaving(false);
                        setLastSaved(new Date());
                    }
                    return true;
                } catch (error: any) {
                    console.error(`Error updating item ${id}:`, error);
                    pendingUpdatesRef.current.delete(id);
                    if (pendingUpdatesRef.current.size === 0) {
                        setIsAutoSaving(false);
                    }
                    // Show error toast only for real failures
                    toast.error(`Failed to save item update: ${error.message || 'Unknown error'}`);
                    return false;
                }


            };

            // 1. Update the parent item first
            await updateSingleItem(itemId, updates);

            // 2. If propagating, update all children with the SAME updates (filtered by propagatable fields)
            if (childIds.length > 0) {
                const childUpdates: any = {};
                PROPAGATABLE_FIELDS.forEach(field => {
                    if (updates[field] !== undefined) {
                        childUpdates[field] = updates[field];
                    }
                });

                // Update all children concurrently
                await Promise.all(childIds.map(childId => updateSingleItem(childId, childUpdates)));
            }

        }, 800); // Reduced from 1500ms for better UX

        // Store the new timeout for this specific item
        updateTimeoutsRef.current.set(itemId, newTimeout);
    };

    /**
     * CRITICAL FIX: Flush all pending updates before completion
     * This prevents data loss when users click "Receive Shipment" immediately after editing
     */
    const flushPendingUpdates = async (): Promise<boolean> => {
        // If nothing pending, return immediately
        if (pendingUpdatesRef.current.size === 0 && updateTimeoutsRef.current.size === 0) {
            return true;
        }

        setIsFlushing(true);
        toast.info('Saving pending changes...', { duration: 2000 });

        try {
            // 1. Cancel all debounce timeouts to prevent duplicate saves
            updateTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            updateTimeoutsRef.current.clear();

            // 2. Get current state snapshot from ref (has latest optimistic updates)
            const snapshot = grnRef.current;
            if (!snapshot || !snapshot.items) {
                return true;
            }

            // 3. Collect all items that need saving (both pending and all items to ensure consistency)
            const itemsToSave = snapshot.items.flatMap((item: any) => {
                // Include children if item is split
                if (item.isSplit && item.children) {
                    return item.children;
                }
                return [item];
            });

            // 4. Save all items with their current state
            const numericFields = ['receivedQty', 'freeQty', 'unitPrice', 'discountPercent', 'gstPercent', 'mrp'];

            const savePromises = itemsToSave.map(async (item: any) => {
                if (!item || !item.id) return true;

                try {
                    // Build complete update payload from current state
                    const payload: any = {};

                    // Include all fields that might have pending changes
                    if (item.receivedQty !== undefined) payload.receivedQty = parseInt(item.receivedQty) || 0;
                    if (item.freeQty !== undefined) payload.freeQty = parseInt(item.freeQty) || 0;
                    if (item.batchNumber) payload.batchNumber = item.batchNumber;
                    if (item.expiryDate) payload.expiryDate = item.expiryDate;
                    if (item.mrp !== undefined && item.mrp !== null && item.mrp !== '') {
                        payload.mrp = parseFloat(item.mrp) || 0;
                    }
                    if (item.unitPrice !== undefined) payload.unitPrice = parseFloat(item.unitPrice) || 0;
                    if (item.discountPercent !== undefined) payload.discountPercent = parseFloat(item.discountPercent) || 0;
                    if (item.gstPercent !== undefined) payload.gstPercent = parseFloat(item.gstPercent) || 0;
                    if (item.discountType) payload.discountType = item.discountType;
                    if (item.location) payload.location = item.location;
                    if (item.manufacturerBarcode) payload.manufacturerBarcode = item.manufacturerBarcode;

                    await grnApi.updateItem(snapshot.id, item.id, payload);
                    return true;
                } catch (error) {
                    console.error(`Error flushing item ${item.id}:`, error);
                    return false;
                }
            });

            const results = await Promise.all(savePromises);
            const allSucceeded = results.every(r => r === true);

            // 5. Clear pending trackers
            pendingUpdatesRef.current.clear();
            setIsAutoSaving(false);
            setLastSaved(new Date());

            if (allSucceeded) {
                toast.success('All changes saved!', { duration: 1500 });
            } else {
                toast.warning('Some changes may not have saved. Please verify.');
            }

            return allSucceeded;
        } catch (error) {
            console.error('Error flushing pending updates:', error);
            toast.error('Failed to save pending changes');
            return false;
        } finally {
            setIsFlushing(false);
        }
    };

    // Calculate detailed totals from items (client-side calculation)
    const calculatedTotals = useMemo(() => {
        if (!grn || !grn.items) {
            return {
                grossAmount: 0,
                discountAmount: 0,
                taxableAmount: 0,
                taxAmount: 0,
                totalAmount: 0,
                breakdown: {} as Record<number, { taxable: number, tax: number }>,
                rows: [] as any[]
            };
        }

        let grossAmount = 0;
        let discountAmount = 0;
        let taxableAmount = 0;
        let taxAmount = 0;
        let totalAmount = 0;
        const breakdown: Record<number, { taxable: number, tax: number }> = {};
        const rows: any[] = [];
        const processedIds = new Set<string>();

        const processItem = (item: any) => {
            if (processedIds.has(item.id)) return;
            processedIds.add(item.id);

            const receivedQty = parseFloat(item.receivedQty) || 0;
            const freeQty = parseFloat(item.freeQty) || 0;
            // Skip items with no received quantity if that's the desired behavior, 
            // but usually we want to see even 0 qty items in the list (just with 0 totals)

            const unitPrice = parseFloat(item.unitPrice) || 0;
            const discountPercent = parseFloat(item.discountPercent) || 0;
            const gstPercent = parseFloat(item.gstPercent) || 0;
            const discountType = item.discountType || 'BEFORE_GST';

            const itemGross = receivedQty * unitPrice;
            grossAmount += itemGross;

            let itemTaxable = 0;
            let itemTax = 0;
            let itemDiscount = 0;
            let itemTotal = 0;

            if (discountType === 'AFTER_GST') {
                // After GST: Tax is on Gross. Discount is on (Gross + Tax).
                // Taxable Value = Gross
                const tax = itemGross * (gstPercent / 100);
                const grossWithTax = itemGross + tax;
                const discount = grossWithTax * (discountPercent / 100);

                itemTaxable = itemGross;
                itemTax = tax;
                itemDiscount = discount;
                itemTotal = grossWithTax - discount;

                taxableAmount += itemGross;
                taxAmount += tax;
                discountAmount += discount;
                totalAmount += itemTotal;
            } else {
                // Before GST (Default): Discount is on Gross. Tax is on (Gross - Discount).
                // Taxable Value = Gross - Discount
                const discount = itemGross * (discountPercent / 100);
                const taxable = itemGross - discount;
                const tax = taxable * (gstPercent / 100);

                itemTaxable = taxable;
                itemTax = tax;
                itemDiscount = discount;
                itemTaxable = taxable;
                itemTax = tax;
                itemDiscount = discount;
                itemTotal = taxable + tax;

                taxableAmount += taxable;
                discountAmount += discount;
                taxAmount += tax;
                totalAmount += itemTotal;
            }

            // Fix: ensure rounding to 2 decimals for display consistency
            itemTaxable = Math.round(itemTaxable * 100) / 100;
            itemTax = Math.round(itemTax * 100) / 100;
            itemTotal = Math.round(itemTotal * 100) / 100;

            // Add to breakdown
            if (!breakdown[gstPercent]) {
                breakdown[gstPercent] = { taxable: 0, tax: 0 };
            }
            breakdown[gstPercent].taxable += itemTaxable;
            breakdown[gstPercent].tax += itemTax;

            // Add to itemized rows
            rows.push({
                id: item.id,
                drugId: item.drugId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                receivedQty,
                freeQty,
                unitPrice,
                mrp: item.mrp,
                discountPercent,
                gstPercent,
                gross: itemGross,
                discount: itemDiscount,
                taxable: itemTaxable,
                tax: itemTax,
                total: itemTotal
            });
        };

        for (const item of grn.items) {
            // Skip parent items that have been split (only count actual batches)
            if (item.isSplit) {
                // If the parent has children in its nested array, process them!
                // This covers the case where children might not be top-level in grn.items
                if (item.children && item.children.length > 0) {
                    item.children.forEach((child: any) => processItem(child));
                }
                continue;
            }

            processItem(item);
        }

        return {
            grossAmount,
            discountAmount,
            taxableAmount,
            taxAmount,
            totalAmount,
            breakdown,
            rows
        };
    }, [grn]);


    const handleBatchSplit = async (itemId: string, splitData: any[]) => {
        try {
            await grnApi.splitBatch(grn.id, itemId, splitData);

            toast.success(`Batch split into ${splitData.length} batches successfully!`);

            // Refresh GRN data
            const grnData = await grnApi.getGRN(grn.id);
            setGrn(grnData);
            grnRef.current = grnData; // Sync ref
        } catch (error) {
            console.error('Error splitting batch:', error);
            toast.error('Failed to split batch');
        }
    };

    const handleDiscrepancy = async (itemId: string, discrepancyData: any) => {
        try {
            await grnApi.addDiscrepancy(grn.id, discrepancyData);

            // Refresh GRN data
            const grnData = await grnApi.getGRN(grn.id);
            setGrn(grnData);
            grnRef.current = grnData; // Sync ref
        } catch (error) {
            console.error('Error recording discrepancy:', error);
        }
    };

    const handleDeleteBatch = async (itemId: string) => {
        try {
            await grnApi.deleteBatch(grn.id, itemId);

            toast.success('Batch deleted successfully');
            // Refresh GRN data
            const grnData = await grnApi.getGRN(grn.id);
            setGrn(grnData);
            grnRef.current = grnData; // Sync ref
        } catch (error) {
            console.error('Error deleting batch:', error);
            toast.error('Failed to delete batch');
        }
    };

    const validateGRN = () => {
        const errors: any[] = [];
        const currentGrn = grnRef.current || grn;

        // Invoice validation
        if (!invoiceNo || invoiceNo.trim() === '') {
            errors.push({ field: 'invoiceNo', message: 'Supplier invoice number is required' });
        }
        if (!invoiceDate) {
            errors.push({ field: 'invoiceDate', message: 'Invoice date is required' });
        }

        // Item validation
        if (currentGrn && currentGrn.items) {
            // Flatten items to include children of split batches
            const allItems = currentGrn.items.flatMap((item: any) =>
                item.isSplit && item.children ? item.children : [item]
            );

            // Check for TBD batch numbers
            const tbdItems = allItems.filter((item: any) => item.batchNumber === 'TBD');
            if (tbdItems.length > 0) {
                errors.push({
                    field: 'batchNumber',
                    message: `${tbdItems.length} item(s) still have batch number "TBD". Please update all batch numbers.`,
                    itemId: tbdItems[0].id,
                    drugName: 'Multiple items'
                });
            }

            allItems.forEach((item: any) => {
                // Skip validation for parent items that are split (already handled by flatMap logic above, but safety check)
                if (item.isSplit) return;

                const drugName = getDrugName(item.drugId);

                if (!item.batchNumber || item.batchNumber.trim() === '') {
                    errors.push({
                        field: 'batchNumber',
                        message: 'Batch number is required',
                        itemId: item.id,
                        drugName
                    });
                }

                if (!item.expiryDate) {
                    errors.push({
                        field: 'expiryDate',
                        message: 'Expiry date is required',
                        itemId: item.id,
                        drugName
                    });
                } else {
                    const expiryDate = new Date(item.expiryDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (expiryDate.getFullYear() === 1970) {
                        errors.push({
                            field: 'expiryDate',
                            message: 'Expiry date is required',
                            itemId: item.id,
                            drugName
                        });
                    } else if (expiryDate < today) {
                        errors.push({
                            field: 'expiryDate',
                            message: 'Expiry date must be in the future',
                            itemId: item.id,
                            drugName
                        });
                    }
                }

                if (!item.mrp || item.mrp <= 0) {
                    errors.push({
                        field: 'mrp',
                        message: 'MRP must be greater than 0',
                        itemId: item.id,
                        drugName
                    });
                }
            });

            // At least one item must be received
            const totalReceived = currentGrn.items.reduce((sum: number, item: any) => sum + (item.receivedQty || 0), 0);
            if (totalReceived === 0) {
                errors.push({ field: 'receivedQty', message: 'At least one item must be received (Received Qty > 0)' });
            }
        }

        return errors;
    };

    const getDrugName = (drugId: string) => {
        if (!po || !po.items) return 'Unknown';
        const poItem = po.items.find((pi: any) => pi.drugId === drugId);
        if (!poItem || !poItem.drug) return 'Unknown';
        return `${poItem.drug.name}${poItem.drug.strength ? ` ${poItem.drug.strength}` : ''}`;
    };

    // Calculate recommended status based on quantities
    const calculateRecommendedStatus = (): 'COMPLETED' | 'PARTIALLY_RECEIVED' => {
        if (!grn || !grn.items) return 'PARTIALLY_RECEIVED';

        const allFullyReceived = grn.items.every((item: any) => {
            // For split items, check children
            if (item.isSplit && item.children) {
                const totalChildReceived = item.children.reduce((sum: number, child: any) =>
                    sum + (Number(child.receivedQty) || 0), 0
                );
                return totalChildReceived === item.orderedQty;
            }
            // For regular items
            return Number(item.receivedQty) === item.orderedQty;
        });

        return allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
    };

    // Calculate total quantities
    const calculateTotals = () => {
        if (!grn || !grn.items) return { totalOrdered: 0, totalReceived: 0 };

        let totalOrdered = 0;
        let totalReceived = 0;

        grn.items.forEach((item: any) => {
            totalOrdered += item.orderedQty || 0;

            if (item.isSplit && item.children) {
                totalReceived += item.children.reduce((sum: number, child: any) =>
                    sum + (Number(child.receivedQty) || 0), 0
                );
            } else {
                totalReceived += Number(item.receivedQty) || 0;
            }
        });

        return { totalOrdered, totalReceived };
    };

    const handleCompleteClick = async () => {
        // CRITICAL FIX: Check for pending updates and flush them first
        if (pendingUpdatesRef.current.size > 0 || updateTimeoutsRef.current.size > 0 || isAutoSaving) {
            toast.info('Saving your changes first...', { duration: 2000 });
            const flushSuccess = await flushPendingUpdates();
            if (!flushSuccess) {
                toast.error('Failed to save changes. Please try again.');
                return;
            }
            // Small delay to ensure state is consistent
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Validate before showing barcode enrollment
        const errors = validateGRN();
        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }
        // If validation passes, show status confirmation
        setShowStatusModal(true);
    };

    // Barcode enrollment removed (handled inline in table)

    const handleComplete = async (targetStatus?: 'COMPLETED' | 'PARTIALLY_RECEIVED') => {
        setSaving(true);
        setCompleting(true);
        setShowStatusModal(false);
        try {
            await grnApi.completeGRN(grn.id, {
                supplierInvoiceNo: invoiceNo,
                supplierInvoiceDate: invoiceDate || null,
                targetStatus,
                ...(notes.trim() ? { notes: notes.trim() } : {})
            });

            toast.success('Order received successfully!');
            setTimeout(() => router.push('/orders/received'), 1000);
        } catch (error) {
            console.error('Error completing GRN:', error);
            toast.error('Failed to complete GRN');
            setCompleting(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (skipConfirm = false) => {
        if (!skipConfirm && !confirm('Are you sure you want to cancel this receiving process?')) {
            return;
        }

        setCanceling(true);
        try {
            await grnApi.discardDraft(grn.id, {});
            toast.success('Draft discarded successfully');
        } catch (error: any) {
            console.error('Error cancelling GRN:', error);
            toast.warning('Could not delete draft, but navigating away');
        } finally {
            // Always navigate away regardless of API success/failure
            router.push('/orders/pending');
        }
    };



    const formatCurrency = (amount: any) => {
        const num = Number(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!grn || !po) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1920px] mx-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
                    <button
                        onClick={() => {
                            if (confirm('Do you want to discard this draft? Click OK to Discard (Delete), Cancel to Keep Draft.')) {
                                handleCancel(true);
                            } else {
                                router.push('/orders/pending');
                            }
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                        Back to Pending Orders
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Receive Shipment</h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                PO: {po.poNumber} | Supplier: {po.supplier.name}
                            </p>
                        </div>
                        
                        {/* Auto-Save Status */}
                        <div className={`transition-all duration-300 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm ${
                            isAutoSaving
                                ? 'bg-blue-100 text-blue-700'
                                : lastSaved
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'opacity-0'
                        }`}>
                            {isAutoSaving ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-medium">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <HiOutlineCheck className="w-4 h-4" />
                                    <span className="text-xs font-medium">Saved</span>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleCancel(false)}
                                disabled={completing || canceling || saving}
                                className="px-3 py-1.5 border border-gray-300 rounded text-red-600 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {canceling ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Discarding...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineXMark className="h-4 w-4" />
                                        Discard
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleSaveDraft(false)}
                                disabled={saving || autoSaving || completing}
                                className="px-3 py-1.5 border border-emerald-600 text-emerald-600 rounded hover:bg-emerald-50 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={handleCompleteClick}
                                disabled={saving || completing || isFlushing || isAutoSaving}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isFlushing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Saving changes...
                                    </>
                                ) : saving || completing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Completing...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineCheck className="h-4 w-4" />
                                        Complete Receiving
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
                    {/* Main Content - Full Width */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Compact Invoice Details & Documents */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Invoice Details - 2/3 width */}
                                <div className="lg:col-span-2">
                                    <h2 className="text-base font-semibold text-gray-900 mb-3">Invoice Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Supplier Invoice Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={invoiceNo}
                                                onChange={(e) => setInvoiceNo(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === '/') e.stopPropagation();
                                                }}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="INV/2024/001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Invoice Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={invoiceDate}
                                                onChange={(e) => setInvoiceDate(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Notes
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Any additional notes..."
                                        />
                                    </div>
                                </div>

                                {/* Documents - 1/3 width */}
                                <div className="lg:col-span-1">
                                    <CompactAttachmentUploader
                                        poId={grn?.id}
                                        attachments={grn?.attachments || []}
                                        apiEndpoint="grn-attachments"
                                        onUpload={(attachment) => {
                                            setGrn((prev: any) => ({
                                                ...prev,
                                                attachments: [...(prev.attachments || []), attachment]
                                            }));
                                        }}
                                        onRemove={(attachmentId) => {
                                            setGrn((prev: any) => ({
                                                ...prev,
                                                attachments: (prev.attachments || []).filter((att: any) => att.id !== attachmentId)
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Minimal UI Toggle */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Receiving Interface</h3>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
                                    <button
                                        onClick={() => setUseModernUI(true)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            useModernUI 
                                                ? 'bg-white text-blue-600 shadow-sm' 
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Cards
                                    </button>
                                    <button
                                        onClick={() => setUseModernUI(false)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            !useModernUI 
                                                ? 'bg-white text-blue-600 shadow-sm' 
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Table
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Receiving Interface */}
                        {useModernUI ? (
                            <ModernReceivingTable
                                items={grn.items}
                                poItems={po?.items || []}
                                onItemUpdate={handleItemUpdate}
                                onBatchSplit={handleBatchSplit}
                            />
                        ) : (
                            <ReceivingTable
                                items={grn.items}
                                poItems={po?.items || []}
                                discrepancies={grn.discrepancies || []}
                                onItemUpdate={handleItemUpdate}
                                onBatchSplit={handleBatchSplit}
                                onDiscrepancy={handleDiscrepancy}
                                onDeleteBatch={handleDeleteBatch}
                            />
                        )}
                    </div>

                    {/* Right Sidebar - PO Summary + Progress */}
                    <div className="lg:col-span-3 space-y-3">
                        <POSummaryCard
                            poNumber={po.poNumber}
                            supplierName={po.supplier.name}
                            orderDate={po.createdAt}
                            totalItems={grn.items.filter((i: any) => !i.isSplit).length}
                        />
                        <LiveSummaryPanel
                            totalItems={grn.items.filter((i: any) => !i.isSplit).length}
                            verifiedItems={grn.items.filter((i: any) => !i.isSplit && i.receivedQty > 0 && i.batchNumber && i.batchNumber !== 'TBD').length}
                            totalValue={calculatedTotals.totalAmount}
                            showFinancials={true}
                        />
                    </div>
                </div>

                {/* Financial Breakdown - Full Width */}
                <div className="px-4 pb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-base font-semibold text-gray-900 mb-3 border-b pb-2">Financial Summary</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Side: Tax Breakdown Table */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider">GST Breakdown</h3>
                                <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Rate</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Value</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tax</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(calculatedTotals.breakdown).sort((a, b) => Number(a[0]) - Number(b[0])).map(([rate, data]: [string, any]) => (
                                        <tr key={rate}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rate}%</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">₹{formatCurrency(data.taxable)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                                <span className="text-xs text-gray-400 mr-1">({Number(rate) / 2}%)</span>
                                                ₹{formatCurrency(data.tax / 2)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                                <span className="text-xs text-gray-400 mr-1">({Number(rate) / 2}%)</span>
                                                ₹{formatCurrency(data.tax / 2)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">₹{formatCurrency(data.tax)}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(calculatedTotals.breakdown).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">No taxable items in this order</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">₹{formatCurrency(calculatedTotals.taxableAmount)}</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">₹{formatCurrency(calculatedTotals.taxAmount / 2)}</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">₹{formatCurrency(calculatedTotals.taxAmount / 2)}</td>
                                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">₹{formatCurrency(calculatedTotals.taxAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Right Side: Final Summary Statement */}
                    <div className="flex flex-col justify-center">
                        <div className="bg-emerald-50/50 p-6 rounded-lg border border-emerald-100">
                            <h3 className="text-sm font-medium text-emerald-800 mb-4 uppercase tracking-wider border-b border-emerald-200 pb-2">Final Settlement</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Total Gross Amount</span>
                                    <span className="text-gray-900 font-medium">₹{formatCurrency(calculatedTotals.grossAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Total Discount Applied</span>
                                    <span className="text-red-600 font-medium">- ₹{formatCurrency(calculatedTotals.discountAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-t border-dashed border-emerald-200">
                                    <span className="text-gray-700 font-medium text-sm">Net Taxable Value</span>
                                    <span className="text-gray-900 font-medium">₹{formatCurrency(calculatedTotals.taxableAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Total GST (CGST + SGST)</span>
                                    <span className="text-gray-900 font-medium">+ ₹{formatCurrency(calculatedTotals.taxAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t-2 border-white">
                                    <span className="text-emerald-900 font-bold text-lg">Grand Total Payable</span>
                                    <span className="text-2xl font-bold text-emerald-700">₹{formatCurrency(calculatedTotals.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                        </div>
                    </div>
                </div>

            {showSummary && (
                <CompletionSummary
                    grn={{
                        ...grn,
                        totals: {
                            subtotal: calculatedTotals.taxableAmount,
                            taxAmount: calculatedTotals.taxAmount,
                            total: calculatedTotals.totalAmount
                        }
                    }}
                    po={po}
                    onConfirm={handleComplete}
                    onCancel={() => setShowSummary(false)}
                    saving={saving}
                />
            )}

            {/* Validation Modal */}
            {showValidationModal && (
                <ValidationModal
                    errors={validationErrors}
                    onClose={() => setShowValidationModal(false)}
                />
            )}

            {/* Status Confirmation Modal */}
            {showStatusModal && (() => {
                const { totalOrdered, totalReceived } = calculateTotals();
                const recommendedStatus = calculateRecommendedStatus();
                const hasShortages = totalReceived !== totalOrdered;

                return (
                    <StatusConfirmationModal
                        isOpen={showStatusModal}
                        onClose={() => setShowStatusModal(false)}
                        onConfirm={handleComplete}
                        currentStatus={grn?.status || 'DRAFT'}
                        recommendedStatus={recommendedStatus}
                        invoiceNo={invoiceNo}
                        invoiceDate={invoiceDate}
                        totalOrdered={totalOrdered}
                        totalReceived={totalReceived}
                        hasShortages={hasShortages}
                        isSubmitting={saving}
                    />
                );
            })()}
            </div>
        </div>
    );
}
