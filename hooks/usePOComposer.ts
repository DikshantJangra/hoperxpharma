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
      lineId: `L${Date.now()}`,
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
      const response = await fetch(`/api/stores/${storeId}/inventory/suggestions?limit=100`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [storeId]);

  const validate = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(po)
      });
      const result = await response.json();
      setValidationResult(result);
      return result.valid;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }, [po]);

  const saveDraft = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/pos/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(po)
      });
      const result = await response.json();
      setPO(prev => ({ ...prev, ...result.po }));
      return result;
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [po, storeId]);

  const requestApproval = useCallback(async (approvers: string[], note?: string) => {
    if (!po.poId) throw new Error('PO must be saved before requesting approval');
    
    try {
      const response = await fetch(`/api/pos/${po.poId}/request-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvers, note })
      });
      return await response.json();
    } catch (error) {
      console.error('Approval request failed:', error);
      throw error;
    }
  }, [po.poId]);

  const sendPO = useCallback(async (sendRequest: { channel: string; channelPayload?: any }) => {
    if (!po.poId) throw new Error('PO must be saved before sending');
    
    try {
      const response = await fetch(`/api/pos/${po.poId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sendRequest, sendAsPdf: true })
      });
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