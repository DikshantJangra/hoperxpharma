import { useState, useCallback, useEffect } from 'react';
import { PurchaseOrder, POLine, Supplier, ValidationResult, SuggestedItem } from '@/types/po';

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
      gstPercent: item.gstPercent || 12,
      lineNet: 0,
      lastPurchasePrice: item.lastPurchasePrice,
      suggestedQty: item.suggestedQty,
      reorderReason: item.reorderReason,
      ...item
    };

    newLine.lineNet = newLine.qty * newLine.pricePerUnit * (1 - newLine.discountPercent / 100);

    setPO(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/purchase-orders/inventory/suggestions?limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load suggestions');
      }

      const result = await response.json();
      setSuggestions(result.data || result.results || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/purchase-orders/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const method = po.poId ? 'PUT' : 'POST';
      const url = po.poId
        ? `${apiBaseUrl}/purchase-orders/${po.poId}`
        : `${apiBaseUrl}/purchase-orders`;

      // Transform frontend PO structure to backend API structure
      const taxAmount = po.taxBreakdown?.reduce((sum, tax) => sum + tax.tax, 0) || 0;

      const payload = {
        supplierId: po.supplier?.id,
        items: po.lines.map(line => ({
          drugId: line.drugId,
          description: line.description || `${line.drugId}`,  // Add required description
          qty: line.qty,
          pricePerUnit: line.pricePerUnit,
          discountPercent: line.discountPercent || 0,
          gstPercent: Math.round(line.gstPercent),  // Ensure integer for validation
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save draft');
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/purchase-orders/${po.poId}/request-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBaseUrl}/purchase-orders/${idToUse}/send`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ ...sendRequest, sendAsPdf: true })
      });

      if (!response.ok) {
        throw new Error('Failed to send PO');
      }

      return await response.json();
    } catch (error) {
      console.error('Send failed:', error);
      throw error;
    }
  }, [po.poId]);

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
    setPO
  };
}