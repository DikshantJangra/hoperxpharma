import { useState, useEffect, useCallback, useRef } from 'react';
import { POCalculationEngine, type POLine } from '@/lib/calculations/poCalculations';
import { SuggestedItem } from '@/types/po';
import toast from 'react-hot-toast';

export interface Supplier {
    id: string;
    name: string;
    gstin?: string;
    paymentTerms?: string;
    defaultLeadTimeDays: number;
}

export interface PurchaseOrder {
    poId?: string;
    poNumber?: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'sent';
    storeId: string;
    supplier?: Supplier;
    lines: POLine[];
    subtotal: number;
    taxBreakdown: Array<{ gstPercent: number; taxable: number; tax: number }>;
    total: number;
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    notes?: string;
    version?: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: Array<{ lineId?: string; lineNumber?: number; message: string }>;
    warnings: Array<{ lineId?: string; message: string }>;
    lineErrors?: Map<string, string>;
}

export type SaveStatus = 'saved' | 'unsaved' | 'syncing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Efficient PO Composer Hook
 * Main state management for the redesigned PO composer
 * Features: local-first, autosave, optimistic updates
 */
export function useEfficientPOComposer(storeId: string, poId?: string) {
    const [po, setPO] = useState<PurchaseOrder>({
        status: 'draft',
        storeId,
        lines: [],
        subtotal: 0,
        taxBreakdown: [],
        total: 0
    });

    const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
    const [validation, setValidation] = useState<ValidationResult>({
        valid: true,
        errors: [],
        warnings: []
    });
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [loading, setLoading] = useState(false);

    const autosaveTimer = useRef<NodeJS.Timeout>();
    const validationTimer = useRef<NodeJS.Timeout>();

    // ============================================================
    // LOCAL CALCULATION (Instant)
    // ============================================================

    useEffect(() => {
        const { subtotal, taxBreakdown, total } = POCalculationEngine.calculateTotals(po.lines);
        setPO(prev => ({ ...prev, subtotal, taxBreakdown, total }));
    }, [po.lines]);

    // ============================================================
    // AUTOSAVE TO LOCALSTORAGE (Instant)
    // ============================================================

    useEffect(() => {
        const key = `po_draft_${storeId}${poId ? `_${poId}` : ''}`;
        localStorage.setItem(key, JSON.stringify(po));

        if (saveStatus === 'saved') {
            setSaveStatus('unsaved');
        }
    }, [po, storeId, poId]);

    // ============================================================
    // AUTOSAVE TO SERVER (Debounced 5s)
    // ============================================================

    useEffect(() => {
        if (saveStatus === 'unsaved' && po.poId) {
            // Clear existing timer
            if (autosaveTimer.current) {
                clearTimeout(autosaveTimer.current);
            }

            // Set new timer
            autosaveTimer.current = setTimeout(async () => {
                await autosaveToServer();
            }, 5000);
        }

        return () => {
            if (autosaveTimer.current) {
                clearTimeout(autosaveTimer.current);
            }
        };
    }, [saveStatus, po.poId]);

    // ============================================================
    // INLINE VALIDATION (Debounced 500ms)
    // ============================================================

    useEffect(() => {
        if (validationTimer.current) {
            clearTimeout(validationTimer.current);
        }

        validationTimer.current = setTimeout(async () => {
            await validateLight();
        }, 500);

        return () => {
            if (validationTimer.current) {
                clearTimeout(validationTimer.current);
            }
        };
    }, [po.lines, po.supplier]);

    // ============================================================
    // RESTORE FROM LOCALSTORAGE ON MOUNT
    // ============================================================

    useEffect(() => {
        const key = `po_draft_${storeId}${poId ? `_${poId}` : ''}`;
        const saved = localStorage.getItem(key);

        if (saved && !poId) {
            try {
                const restored = JSON.parse(saved);
                setPO(restored);
                toast.success('Draft restored from local storage');
            } catch (error) {
                console.error('Failed to restore draft:', error);
            }
        }
    }, [storeId, poId]);

    // ============================================================
    // LOAD SUGGESTIONS ON MOUNT
    // ============================================================

    useEffect(() => {
        loadSuggestions();
    }, [storeId]);

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    const autosaveToServer = async () => {
        if (!po.poId) return;

        setSaveStatus('syncing');

        try {
            const response = await fetch(`${API_BASE_URL}/purchase-orders/${po.poId}/autosave`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    supplierId: po.supplier?.id,
                    items: po.lines.map(line => ({
                        drugId: line.drugId,
                        qty: line.qty,
                        pricePerUnit: line.pricePerUnit,
                        discountPercent: line.discountPercent || 0,
                        gstPercent: line.gstPercent,
                        lineNet: POCalculationEngine.calculateLine(line)
                    })),
                    subtotal: po.subtotal,
                    taxAmount: po.taxBreakdown.reduce((sum, t) => sum + t.tax, 0),
                    total: po.total,
                    expectedDeliveryDate: po.expectedDeliveryDate,
                    paymentTerms: po.paymentTerms,
                    notes: po.notes
                })
            });

            if (response.ok) {
                const result = await response.json();
                setPO(prev => ({ ...prev, version: result.data.version }));
                setSaveStatus('saved');
            } else {
                throw new Error('Autosave failed');
            }
        } catch (error) {
            console.error('Autosave error:', error);
            setSaveStatus('unsaved');
        }
    };

    const validateLight = async () => {
        // Basic client-side validation
        const errors: ValidationResult['errors'] = [];
        const warnings: ValidationResult['warnings'] = [];

        if (!po.supplier) {
            errors.push({ message: 'Supplier is required' });
        }

        if (po.lines.length === 0) {
            errors.push({ message: 'At least one line item is required' });
        }

        po.lines.forEach((line, index) => {
            if (!line.drugId) {
                errors.push({
                    lineId: line.lineId,
                    lineNumber: index + 1,
                    message: 'Drug is required'
                });
            }
            if (line.qty <= 0) {
                errors.push({
                    lineId: line.lineId,
                    lineNumber: index + 1,
                    message: 'Quantity must be greater than 0'
                });
            }
            if (line.pricePerUnit < 0) {
                errors.push({
                    lineId: line.lineId,
                    lineNumber: index + 1,
                    message: 'Price cannot be negative'
                });
            }
            if (![0, 5, 12, 18, 28].includes(line.gstPercent)) {
                errors.push({
                    lineId: line.lineId,
                    lineNumber: index + 1,
                    message: 'GST rate must be 0, 5, 12, 18, or 28'
                });
            }
        });

        setValidation({
            valid: errors.length === 0,
            errors,
            warnings
        });
    };

    const loadSuggestions = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/purchase-orders/inventory/suggestions?limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                const items = result.data || result.results || [];

                // Map API response to SuggestedItem type
                const mapped: SuggestedItem[] = items.map((item: any) => {
                    const stockRatio = item.currentStock / (item.threshold || 1);
                    const isLowStock = item.currentStock < (item.threshold || 0);

                    return {
                        drugId: item.drugId,
                        description: item.name || item.description || 'Unknown Product',
                        suggestedQty: item.suggestedQty || Math.max(1, (item.threshold || 0) - item.currentStock),
                        reason: item.currentStock === 0
                            ? 'Out of stock - Critical reorder needed'
                            : isLowStock
                                ? `Low stock - Below threshold (${item.currentStock}/${item.threshold})`
                                : `Forecast - Predicted demand based on sales trends`,
                        confidenceScore: item.confidenceScore || (isLowStock ? 0.9 : 0.7),
                        lastPurchasePrice: item.lastPurchasePrice,
                        currentStock: item.currentStock || 0,
                        packUnit: item.packUnit || 'Unit',
                        gstPercent: item.gstPercent || 12
                    };
                });

                setSuggestions(mapped);
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    };

    // ============================================================
    // PUBLIC API
    // ============================================================

    const setSupplier = useCallback((supplier: Supplier) => {
        setPO(prev => ({
            ...prev,
            supplier,
            paymentTerms: supplier.paymentTerms || '30 days',
            expectedDeliveryDate: new Date(
                Date.now() + supplier.defaultLeadTimeDays * 24 * 60 * 60 * 1000
            ).toISOString().split('T')[0]
        }));
    }, []);

    const addLine = useCallback((item: Partial<POLine>) => {
        const newLine: POLine = {
            lineId: `L${Date.now()}`,
            drugId: item.drugId || '',
            qty: item.qty || 1,
            pricePerUnit: item.pricePerUnit || 0,
            discountPercent: item.discountPercent || 0,
            gstPercent: item.gstPercent || 12
        };

        setPO(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    }, []);

    const updateLine = useCallback((lineId: string, updates: Partial<POLine>) => {
        setPO(prev => ({
            ...prev,
            lines: prev.lines.map(line =>
                line.lineId === lineId ? { ...line, ...updates } : line
            )
        }));
    }, []);

    const removeLine = useCallback((lineId: string) => {
        setPO(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.lineId !== lineId)
        }));
    }, []);

    const saveDraft = useCallback(async () => {
        setLoading(true);
        setSaveStatus('syncing');

        try {
            const method = po.poId ? 'PUT' : 'POST';
            const url = po.poId
                ? `${API_BASE_URL}/purchase-orders/${po.poId}`
                : `${API_BASE_URL}/purchase-orders`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    supplierId: po.supplier?.id,
                    items: po.lines.map(line => ({
                        drugId: line.drugId,
                        description: line.drugId, // TODO: Get from drug data
                        qty: line.qty,
                        pricePerUnit: line.pricePerUnit,
                        discountPercent: line.discountPercent || 0,
                        gstPercent: line.gstPercent,
                        lineNet: POCalculationEngine.calculateLine(line)
                    })),
                    subtotal: po.subtotal,
                    taxAmount: po.taxBreakdown.reduce((sum, t) => sum + t.tax, 0),
                    total: po.total,
                    expectedDeliveryDate: po.expectedDeliveryDate,
                    paymentTerms: po.paymentTerms,
                    notes: po.notes
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save draft');
            }

            const result = await response.json();
            const savedPO = result.data || result;

            setPO(prev => ({
                ...prev,
                poId: savedPO.id,
                poNumber: savedPO.poNumber,
                version: savedPO.version
            }));

            setSaveStatus('saved');
            toast.success(`Draft saved! PO #${savedPO.poNumber}`);

            return savedPO;
        } catch (error: any) {
            setSaveStatus('unsaved');
            toast.error(error.message || 'Failed to save draft');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [po]);

    const sendPO = useCallback(async () => {
        // Full validation before send
        if (validation.errors.length > 0) {
            toast.error('Please fix validation errors before sending');
            return;
        }

        setLoading(true);

        try {
            // Save draft first if not already saved
            let poIdToSend = po.poId;
            if (!poIdToSend) {
                const savedPO = await saveDraft();
                poIdToSend = savedPO.id;
            }

            // Send PO
            const response = await fetch(`${API_BASE_URL}/purchase-orders/${poIdToSend}/send`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ channel: 'email', sendAsPdf: true })
            });

            if (!response.ok) {
                throw new Error('Failed to send PO');
            }

            toast.success('PO sent successfully!');

            // Clear local draft
            const key = `po_draft_${storeId}${poId ? `_${poId}` : ''}`;
            localStorage.removeItem(key);

            return true;
        } catch (error: any) {
            toast.error(error.message || 'Failed to send PO');
            return false;
        } finally {
            setLoading(false);
        }
    }, [po, validation, saveDraft, storeId, poId]);

    const requestApproval = useCallback(async () => {
        if (validation.errors.length > 0) {
            toast.error('Please fix validation errors before requesting approval');
            return;
        }

        setLoading(true);

        try {
            // Save draft first if not already saved
            let poIdToApprove = po.poId;
            if (!poIdToApprove) {
                const savedPO = await saveDraft();
                poIdToApprove = savedPO.id;
            }

            // Request approval
            const response = await fetch(
                `${API_BASE_URL}/purchase-orders/${poIdToApprove}/request-approval`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({
                        approvers: ['manager_01'], // TODO: Make configurable
                        note: 'Please review this purchase order'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to request approval');
            }

            toast.success('Approval request sent!');
            return true;
        } catch (error: any) {
            toast.error(error.message || 'Failed to request approval');
            return false;
        } finally {
            setLoading(false);
        }
    }, [po, validation, saveDraft]);

    const saveAsTemplate = useCallback(async (name: string, description?: string) => {
        if (!po.supplier || po.lines.length === 0) {
            toast.error('Cannot save template: add supplier and items first');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/purchase-orders/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    name,
                    description,
                    supplierId: po.supplier.id,
                    paymentTerms: po.paymentTerms,
                    notes: po.notes,
                    items: po.lines.map(line => ({
                        drugId: line.drugId,
                        quantity: line.qty,
                        unitPrice: line.pricePerUnit,
                        discountPercent: line.discountPercent
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save template');
            }

            toast.success('Template saved successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save template');
            throw error;
        }
    }, [po]);

    const loadTemplate = useCallback(async (templateId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/purchase-orders/templates/${templateId}/load`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load template');
            }

            const result = await response.json();
            const templateData = result.data || result;

            // Load supplier if present
            if (templateData.supplierId) {
                const supplierResponse = await fetch(`${API_BASE_URL}/purchase-orders/suppliers/${templateData.supplierId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                if (supplierResponse.ok) {
                    const supplierResult = await supplierResponse.json();
                    const supplier = supplierResult.data || supplierResult;
                    setSupplier(supplier);
                }
            }

            // Load items
            templateData.items.forEach((item: any) => {
                addLine({
                    drugId: item.drugId,
                    qty: item.quantity,
                    pricePerUnit: item.unitPrice || 0,
                    discountPercent: item.discountPercent || 0,
                    gstPercent: 12 // Default, will be updated by validation
                });
            });

            // Load other fields
            setPO(prev => ({
                ...prev,
                paymentTerms: templateData.paymentTerms,
                notes: templateData.notes
            }));

            toast.success('Template loaded successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to load template');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [addLine, setSupplier]);

    return {
        po,
        setPO,
        suggestions,
        validation,
        saveStatus,
        loading,
        // Actions
        setSupplier,
        addLine,
        updateLine,
        removeLine,
        saveDraft,
        sendPO,
        requestApproval,
        loadSuggestions,
        // Templates
        saveAsTemplate,
        loadTemplate
    };
}
