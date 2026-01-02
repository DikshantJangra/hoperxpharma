import { useState, useCallback, useEffect } from 'react';
import { PurchaseOrder, POLine, Supplier, ValidationResult, SuggestedItem } from '@/types/po';
import { normalizeGSTRate } from '@/utils/gst-utils';
import { getApiBaseUrl } from '@/lib/config/env';
import { tokenManager } from '@/lib/api/client';

export function usePOComposer(storeId: string) {
  const [po, setPO] = useState<PurchaseOrder>({
    status: 'draft',
    storeId,
    deliveryAddress: { line1: '', city: '', pin: '' },
    currency: 'INR',
    lines: [],
    subtotal: 0,
    taxBreakdown: [],
    total: 0,
  });

  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ valid: true, warnings: [], errors: [] });

  // Calculate totals whenever lines change
  useEffect(() => {
    const subtotal = po.lines.reduce((sum, line) => sum + line.lineNet, 0);
    const taxBreakdown = calculateTaxBreakdown(po.lines);
    const total = subtotal + taxBreakdown.reduce((sum, tax) => sum + tax.tax, 0);

    setPO(prev => ({ ...prev, subtotal, taxBreakdown, total }));
  }, [po.lines]);

  const calculateTaxBreakdown = (lines: POLine[]) => {
    const taxMap = new Map<number, { taxable: number; tax: number }>();

    lines.forEach(line => {
      const taxable = line.lineNet;
      const tax = (taxable * line.gstPercent) / 100;

      if (taxMap.has(line.gstPercent)) {
        const existing = taxMap.get(line.gstPercent)!;
        taxMap.set(line.gstPercent, {
          taxable: existing.taxable + taxable,
          tax: existing.tax + tax
        });
      } else {
        taxMap.set(line.gstPercent, { taxable, tax });
      }
    });

    return Array.from(taxMap.entries()).map(([gstPercent, values]) => ({
      gstPercent,
      ...values
    }));
  };

  const setSupplier = useCallback((supplier: Supplier) => {
    setPO(prev => ({
      ...prev,
      supplier,
      paymentTerms: supplier.paymentTerms || '30 days',
      expectedDeliveryDate: new Date(Date.now() + supplier.defaultLeadTimeDays * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
    }));
  }, []);

  const addLine = useCallback((item: Partial<POLine>) => {
    setPO(prev => {
      // Check if this item already exists (same drugId and pricePerUnit)
      const existingLineIndex = prev.lines.findIndex(
        line => line.drugId === item.drugId &&
          line.pricePerUnit === (item.pricePerUnit || item.lastPurchasePrice || 0)
      );

      if (existingLineIndex !== -1) {
        // Item exists - increment quantity
        const updatedLines = [...prev.lines];
        const existingLine = updatedLines[existingLineIndex];
        const newQty = existingLine.qty + (item.qty || 1);

        updatedLines[existingLineIndex] = {
          ...existingLine,
          qty: newQty,
          lineNet: newQty * existingLine.pricePerUnit * (1 - existingLine.discountPercent / 100)
        };

        return { ...prev, lines: updatedLines };
      }

      // Item doesn't exist - add new line
      const newLine: POLine = {
        lineId: `L${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        drugId: item.drugId || '',
        description: item.description || '',
        packUnit: item.packUnit || 'Strip',
        packSize: item.packSize || 10,
        qty: item.qty || item.suggestedQty || 1,
        unit: item.unit || 'strip',
        pricePerUnit: item.pricePerUnit || item.lastPurchasePrice || 0,
        discountPercent: item.discountPercent || 0,
        gstPercent: normalizeGSTRate(item.gstPercent || 5),
        lineNet: 0,
        lastPurchasePrice: item.lastPurchasePrice,
        suggestedQty: item.suggestedQty,
        reorderReason: item.reorderReason,
        ...item
      };

      newLine.lineNet = newLine.qty * newLine.pricePerUnit * (1 - newLine.discountPercent / 100);

      return { ...prev, lines: [...prev.lines, newLine] };
    });
  }, []);

  const updateLine = useCallback((lineId: string, updates: Partial<POLine>) => {
    setPO(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.lineId === lineId) {
          const updated = { ...line, ...updates };
          updated.lineNet = updated.qty * updated.pricePerUnit * (1 - updated.discountPercent / 100);
          return updated;
        }
        return line;
      })
    }));
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setPO(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.lineId !== lineId)
    }));
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-orders/inventory/suggestions?limit=100`, {
        headers: {
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('Suggestions API not available, using catalog search instead');
        setSuggestions([]);
        return;
      }

      const result = await response.json();
      setSuggestions(result.data || result.results || []);
    } catch (error) {
      console.warn('Failed to load suggestions, using catalog search instead');
      setSuggestions([]);
    }
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-orders/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(po)
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      setValidationResult(result.data || result);
      return result.data?.valid || result.valid || true;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }, [po]);

  const saveDraft = useCallback(async () => {
    setLoading(true);
    try {
      const method = po.poId ? 'PUT' : 'POST';
      const url = po.poId
        ? `${getApiBaseUrl()}/purchase-orders/${po.poId}`
        : `${getApiBaseUrl()}/purchase-orders`;

      // Transform frontend PO structure to backend API structure
      const taxAmount = po.taxBreakdown?.reduce((sum, tax) => sum + tax.tax, 0) || 0;

      // Filter out lines with empty drugId
      const validLines = po.lines.filter(line => line.drugId && line.drugId.trim() !== '');

      if (validLines.length === 0) {
        throw new Error('Please add at least one item with a selected drug');
      }

      const payload = {
        supplierId: po.supplier?.id,
        items: validLines.map(line => ({
          drugId: line.drugId,
          description: line.description || `${line.drugId}`,  // Add required description
          qty: line.qty,
          pricePerUnit: line.pricePerUnit,
          discountPercent: line.discountPercent || 0,
          gstPercent: normalizeGSTRate(line.gstPercent),  // Normalize to valid GST rate
          lineNet: line.lineNet,
        })),
        subtotal: po.subtotal,
        taxAmount: taxAmount,
        total: po.total,
        expectedDeliveryDate: po.expectedDeliveryDate,
        paymentTerms: po.paymentTerms,
        currency: po.currency || 'INR',
        notes: po.notes,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to save draft';
        const errors = errorData.errors || [];
        const fullMessage = errors.length > 0
          ? `${errorMessage}\n${errors.join('\n')}`
          : errorMessage;
        throw new Error(fullMessage);
      }

      const result = await response.json();
      const savedPO = result.data || result;
      setPO(prev => ({ ...prev, ...savedPO, poId: savedPO.id }));
      return savedPO;
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [po]);

  const requestApproval = useCallback(async (approvers: string[], note?: string) => {
    if (!po.poId) throw new Error('PO must be saved before requesting approval');

    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-orders/${po.poId}/request-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ approvers, note })
      });

      if (!response.ok) {
        throw new Error('Failed to request approval');
      }

      return await response.json();
    } catch (error) {
      console.error('Approval request failed:', error);
      throw error;
    }
  }, [po.poId]);

  const sendPO = useCallback(async (sendRequest: { channel: string; channelPayload?: any }, poId?: string) => {
    const idToUse = poId || po.poId;
    if (!idToUse) throw new Error('PO must be saved before sending');

    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-orders/${idToUse}/send`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ ...sendRequest, sendAsPdf: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to send PO';
        const errors = errorData.errors || [];
        const fullMessage = errors.length > 0
          ? `${errorMessage}\n${errors.join('\n')}`
          : errorMessage;
        throw new Error(fullMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Send failed:', error);
      throw error;
    }
  }, [po.poId]);

  const clearDraft = useCallback(() => {
    // Reset PO to initial state
    setPO({
      status: 'draft',
      storeId,
      deliveryAddress: { line1: '', city: '', pin: '' },
      currency: 'INR',
      lines: [],
      subtotal: 0,
      taxBreakdown: [],
      total: 0,
    });

    // Clear validation
    setValidationResult({ valid: true, warnings: [], errors: [] });

    // Note: We don't clear localStorage here as it's auto-saved
    // The next change will overwrite it
  }, [storeId]);

  return {
    po,
    suggestions,
    loading,
    validationResult,
    setSupplier,
    addLine,
    updateLine,
    removeLine,
    loadSuggestions,
    validate,
    saveDraft,
    requestApproval,
    sendPO,
    setPO,
    clearDraft
  };
}