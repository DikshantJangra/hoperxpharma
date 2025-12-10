'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/api/client';
import ReceivingTable from '@/components/grn/ReceivingTable';
import CompletionSummary from '@/components/grn/CompletionSummary';
import AttachmentUploader from '@/components/orders/AttachmentUploader';
import ValidationModal from '@/components/grn/ValidationModal';
import StatusConfirmationModal from '@/components/grn/StatusConfirmationModal';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { toast } from 'sonner';

export default function ReceiveShipmentPage() {
    const params = useParams();
    const router = useRouter();
    const poId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [grn, setGrn] = useState<any>(null);
    const [po, setPO] = useState<any>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

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

    // DISABLED: Auto-save - only save when user clicks "Save Draft" button
    /*
    useEffect(() => {
        if (!grn) return;

        const autoSaveInterval = setInterval(() => {
            handleSaveDraft(true);
        }, 30000); // 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [grn, invoiceNo, invoiceDate, notes]);
    */

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
            const token = tokenManager.getAccessToken();

            // Create GRN from PO
            const response = await fetch(`${apiBaseUrl}/grn`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ poId })
            });

            if (response.ok) {
                const result = await response.json();
                setGrn(result.data);
                grnRef.current = result.data; // Sync ref immediately

                // Set PO from GRN response if available, otherwise fetch it
                if (result.data.po && result.data.po.items) {
                    setPO(result.data.po);
                } else {
                    // Fallback: fetch PO details separately
                    try {
                        const poResponse = await fetch(`${apiBaseUrl}/purchase-orders/${poId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (poResponse.ok) {
                            const poResult = await poResponse.json();
                            setPO(poResult.data);
                        } else {
                            console.error('Failed to fetch PO details');
                        }
                    } catch (poError) {
                        console.error('Error fetching PO:', poError);
                    }
                }

                setLastSaved(new Date());
            } else {
                const errorData = await response.json();
                console.error('Failed to initialize GRN:', errorData);
                alert(`Failed to initialize GRN: ${errorData.message || errorData.error || 'Unknown error'}`);
                router.push('/orders/pending');
            }
        } catch (error) {
            console.error('Error initializing GRN:', error);
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
            const token = tokenManager.getAccessToken();

            const payload: any = { status: 'IN_PROGRESS' };
            if (invoiceNo) payload.supplierInvoiceNo = invoiceNo;
            if (invoiceDate) payload.supplierInvoiceDate = new Date(invoiceDate).toISOString();
            if (notes) payload.notes = notes;

            const response = await fetch(`${apiBaseUrl}/grn/${currentGrn.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setLastSaved(new Date());
                if (!isAutoSave) {
                    toast.success('Draft saved successfully!');
                }
            } else {
                const error = await response.json();
                if (!isAutoSave) {
                    toast.error(error.error || error.message || 'Failed to save');
                }
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

    const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const pendingUpdatesRef = React.useRef<Set<string>>(new Set());

    const handleItemUpdate = async (itemId: string, updates: any) => {
        // Define fields that should propagate from parent to children
        const PROPAGATABLE_FIELDS = ['batchNumber', 'expiryDate', 'mrp', 'unitPrice', 'discountPercent', 'discountType', 'gstPercent', 'location'];
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

        // Debounce the API call
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(async () => {
            const token = tokenManager.getAccessToken();

            // Function to process a single item update
            const updateSingleItem = async (id: string, itemUpdates: any) => {
                try {
                    // Sanitize values
                    const sanitizedUpdates: any = {};
                    const numericFields = ['receivedQty', 'freeQty', 'unitPrice', 'discountPercent', 'gstPercent', 'mrp'];

                    for (const [key, value] of Object.entries(itemUpdates)) {
                        if (numericFields.includes(key)) {
                            if (value === '' || value === null || value === undefined) {
                                sanitizedUpdates[key] = 0;
                            } else {
                                const parsedValue = key.includes('Qty') ? parseInt(value as string) : parseFloat(value as string);
                                sanitizedUpdates[key] = isNaN(parsedValue) ? 0 : parsedValue;
                            }
                        } else {
                            sanitizedUpdates[key] = value;
                        }
                    }

                    const response = await fetch(`${apiBaseUrl}/grn/${currentGrn.id}/items/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sanitizedUpdates)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update');
                    }

                    // We don't need to consume the response data here because we already did optimistic updates.
                    // The only risk is if server transforms data differently, but we'll fetch fresh on save/complete.
                    pendingUpdatesRef.current.delete(id);
                    return true;
                } catch (error) {
                    console.error(`Error updating item ${id}:`, error);
                    pendingUpdatesRef.current.delete(id);
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

                if (childIds.length > 0) {
                    toast.success('Updated parent and propagation to split batches');
                }
            }

        }, 1500);
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
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/items/${itemId}/split`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ splitData })
            });

            if (response.ok) {
                toast.success(`Batch split into ${splitData.length} batches successfully!`);

                // Refresh GRN data
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
                grnRef.current = grnData.data; // Sync ref
            } else {
                const error = await response.json();
                toast.error(error.error || error.message || 'Failed to split batch');
            }
        } catch (error) {
            console.error('Error splitting batch:', error);
            toast.error('Failed to split batch');
        }
    };

    const handleDiscrepancy = async (itemId: string, discrepancyData: any) => {
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/discrepancies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(discrepancyData)
            });

            if (response.ok) {
                // Refresh GRN data
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
                grnRef.current = grnData.data; // Sync ref
            }
        } catch (error) {
            console.error('Error recording discrepancy:', error);
        }
    };

    const handleDeleteBatch = async (itemId: string) => {
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Batch deleted successfully');
                // Refresh GRN data
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
                grnRef.current = grnData.data; // Sync ref
            } else {
                const error = await response.json();
                toast.error(error.error || error.message || 'Failed to delete batch');
            }
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

    const handleCompleteClick = () => {
        // Validate before showing status modal
        const errors = validateGRN();
        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }
        // If validation passes, show status selection modal
        setShowStatusModal(true);
    };

    const handleComplete = async (targetStatus?: 'COMPLETED' | 'PARTIALLY_RECEIVED') => {
        setSaving(true);
        setShowStatusModal(false);
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplierInvoiceNo: invoiceNo,
                    supplierInvoiceDate: invoiceDate || null,
                    targetStatus,
                    ...(notes.trim() ? { notes: notes.trim() } : {})  // Only include if not empty
                })
            });

            if (response.ok) {
                toast.success('Order received successfully!');
                setTimeout(() => router.push('/orders/received'), 1000);
            } else {
                const error = await response.json();
                const errorMessage = error.error || error.message || 'Failed to complete GRN';

                if (errorMessage.toLowerCase().includes('already completed')) {
                    toast.success('GRN is already completed. Redirecting...');
                    setTimeout(() => router.push('/orders/received'), 1000);
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            console.error('Error completing GRN:', error);
            toast.error('Failed to complete GRN');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (skipConfirm = false) => {
        if (!skipConfirm && !confirm('Are you sure you want to cancel this receiving process?')) {
            return;
        }

        try {
            const token = tokenManager.getAccessToken();

            // Send invoice data even when cancelling so it's preserved
            const payload: any = {};
            if (invoiceNo) payload.supplierInvoiceNo = invoiceNo;
            if (invoiceDate) payload.supplierInvoiceDate = new Date(invoiceDate).toISOString();
            if (notes) payload.notes = notes;

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Draft discarded successfully');
                router.push('/orders/pending');
            } else {
                const error = await response.json();
                console.error('Failed to discard draft:', error);
                toast.error(error.message || 'Failed to discard draft');
            }
        } catch (error) {
            console.error('Error cancelling GRN:', error);
            toast.error('Failed to discard draft');
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
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        if (confirm('Do you want to discard this draft? Click OK to Discard (Delete), Cancel to Keep Draft.')) {
                            handleCancel(true);
                        } else {
                            router.push('/orders/pending');
                        }
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <HiOutlineArrowLeft className="h-5 w-5" />
                    Back to Pending Orders
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Receive Shipment</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            PO: {po.poNumber} | Supplier: {po.supplier.name}
                            {lastSaved && (
                                <span className="ml-3 text-xs text-gray-400">
                                    {autoSaving ? 'Saving...' : `Last saved: ${lastSaved.toLocaleTimeString()}`}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleCancel(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                            Discard Draft
                        </button>
                        <button
                            onClick={() => handleSaveDraft(false)}
                            disabled={saving || autoSaving}
                            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handleCompleteClick}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <HiOutlineCheck className="h-5 w-5" />
                            {saving ? 'Completing...' : 'Complete Receiving'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Invoice Number
                        </label>
                        <input
                            type="text"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                            onKeyDown={(e) => {
                                // Prevent slash from triggering search hotkey
                                if (e.key === '/') {
                                    e.stopPropagation();
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="INV/2024/001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Invoice Date
                        </label>
                        <input
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received By
                        </label>
                        <input
                            type="text"
                            value={grn.receivedByUser ? `${grn.receivedByUser.firstName} ${grn.receivedByUser.lastName}` : grn.receivedBy}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Any additional notes about this shipment..."
                    />
                </div>
            </div>

            {/* Invoice Attachments */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice & Documents</h2>
                <AttachmentUploader
                    poId={grn?.id}
                    attachments={grn?.attachments || []}
                    apiEndpoint="grn-attachments"
                    onUpload={(attachment) => {
                        // Update GRN with new attachment
                        setGrn((prev: any) => ({
                            ...prev,
                            attachments: [...(prev.attachments || []), attachment]
                        }));
                    }}
                    onRemove={(attachmentId) => {
                        // Remove attachment from GRN
                        setGrn((prev: any) => ({
                            ...prev,
                            attachments: (prev.attachments || []).filter((att: any) => att.id !== attachmentId)
                        }));
                    }}
                />
            </div>

            {/* Receiving Table */}
            <ReceivingTable
                items={grn.items}
                poItems={po?.items || []}
                discrepancies={grn.discrepancies || []}
                onItemUpdate={handleItemUpdate}
                onBatchSplit={handleBatchSplit}
                onDiscrepancy={handleDiscrepancy}
                onDeleteBatch={handleDeleteBatch}
            />

            {/* Itemized Bill Preview Panel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Itemized Bill Breakdown</h2>
                <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Info</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST Data</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {calculatedTotals.rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {getDrugName(row.drugId)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                        <div>#{row.batchNumber}</div>
                                        <div className="text-gray-400">Exp: {row.expiryDate ? (() => {
                                            const date = new Date(row.expiryDate);
                                            if (date.getFullYear() === 1970) return '-';
                                            return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                        })() : '-'}</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{row.receivedQty}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-emerald-600 text-right font-medium">{row.freeQty > 0 ? `+${row.freeQty}` : '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">₹{formatCurrency(row.unitPrice)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">₹{formatCurrency(row.gross)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 text-right">
                                        <div>-₹{formatCurrency(row.discount)}</div>
                                        <div className="text-xs text-red-400">({row.discountPercent}%)</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">₹{formatCurrency(row.taxable)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                        <div>₹{formatCurrency(row.tax)}</div>
                                        <div className="text-xs text-gray-400">({row.gstPercent}%)</div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">₹{formatCurrency(row.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                                <td colSpan={7} className="px-3 py-2 text-right text-gray-900">Total Taxable Value</td>
                                <td className="px-3 py-2 text-right text-gray-900">₹{formatCurrency(calculatedTotals.taxableAmount)}</td>
                                <td className="px-3 py-2 text-right text-gray-900">₹{formatCurrency(calculatedTotals.taxAmount)}</td>
                                <td className="px-3 py-2 text-right text-emerald-700">₹{formatCurrency(calculatedTotals.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Payment Breakdown & Tax Analysis</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                const hasShortages = totalReceived < totalOrdered;

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
    );
}
