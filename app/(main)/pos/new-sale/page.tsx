'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import ProductSearch from '@/components/pos/ProductSearch';
import Basket from '@/components/pos/Basket';
import PaymentPanel from '@/components/pos/PaymentPanel';
import POSHeader from '@/components/pos/POSHeader';
import ShortcutsOverlay from '@/components/pos/ShortcutsOverlay';
import BatchModal from '@/components/pos/BatchModal';
import CustomerModal from '@/components/pos/CustomerModal';
import SplitPaymentModal from '@/components/pos/SplitPaymentModal';
import SuccessScreen from '@/components/pos/SuccessScreen';
import QuickAddGrid from '@/components/pos/QuickAddGrid';
import DraftRestoreModal from '@/components/pos/DraftRestoreModal';
import CustomerLedgerPanel from '@/components/customers/CustomerLedgerPanel';
import PrescriptionBanner from '@/components/pos/PrescriptionBanner';
import { salesApi } from '@/lib/api/sales';
import { prescriptionApi } from '@/lib/api/prescriptions';
import PrescriptionImportModal from '@/components/pos/PrescriptionImportModal';
import { inventoryApi } from '@/lib/api/inventory';

export default function NewSalePage() {
  const [basketItems, setBasketItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchFocus, setSearchFocus] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [saleId] = useState(`S-2025-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [linkedPrescriptionId, setLinkedPrescriptionId] = useState<string | null>(null);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [isLoadingRx, setIsLoadingRx] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get storeId from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setStoreId(user.storeId || '');
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  // Fetch next invoice number
  useEffect(() => {
    const fetchNextInvoice = async () => {
      try {
        const response = await salesApi.getNextInvoiceNumber();
        if (response && response.nextInvoiceNumber) {
          setInvoiceNumber(response.nextInvoiceNumber);
        }
      } catch (error) {
        console.error('Failed to fetch next invoice number:', error);
      }
    };

    fetchNextInvoice();
  }, []);

  // Handle draft restore from modal
  const handleRestoreDraft = () => {
    if (!pendingDraft) return;

    try {
      // Parse items if they're JSON string
      const items = typeof pendingDraft.items === 'string' ? JSON.parse(pendingDraft.items) : pendingDraft.items;

      setCurrentDraftId(pendingDraft.id);
      localStorage.setItem('currentDraftId', pendingDraft.id);
      setBasketItems(items || []);

      if (pendingDraft.customerId) {
        setCustomer({
          id: pendingDraft.customerId,
          firstName: pendingDraft.customerName?.split(' ')[0] || '',
          lastName: pendingDraft.customerName?.split(' ').slice(1).join(' ') || '',
          phoneNumber: pendingDraft.customerPhone
        });
      }

      setShowDraftRestore(false);
      setPendingDraft(null);
      toast.success('Draft restored successfully!');
    } catch (error) {
      console.error('Error restoring draft:', error);
      toast.error('Failed to restore draft');
    }
  };

  const handleDiscardDraft = () => {
    setShowDraftRestore(false);
    setPendingDraft(null);
  };

  // Restore draft on page load
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        // Check if user is authenticated first
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          console.log('User not authenticated, skipping draft restoration');
          return;
        }

        // First check if there's a draft to resume from localStorage
        const resumeDraftStr = localStorage.getItem('resumeDraft');
        if (resumeDraftStr) {
          try {
            const resumeDraft = JSON.parse(resumeDraftStr);
            console.log('Resuming draft from localStorage:', resumeDraft);

            setCurrentDraftId(resumeDraft.id);
            setBasketItems(resumeDraft.items || []);

            if (resumeDraft.customerId) {
              setCustomer({
                id: resumeDraft.customerId,
                firstName: resumeDraft.customerName?.split(' ')[0] || '',
                lastName: resumeDraft.customerName?.split(' ').slice(1).join(' ') || '',
                phoneNumber: resumeDraft.customerPhone
              });
            }

            // Clear the resume draft from localStorage
            localStorage.removeItem('resumeDraft');
            toast.success('Draft resumed successfully!');
            return;
          } catch (err) {
            console.error('Error parsing resume draft:', err);
            localStorage.removeItem('resumeDraft');
          }
        }

        // If no resume draft, check for latest auto-saved draft
        const response = await salesApi.getDrafts({ limit: 1 });
        const drafts = response.data || response.drafts || response;
        const draftsArray = Array.isArray(drafts) ? drafts : [];

        if (draftsArray.length > 0) {
          const latestDraft = draftsArray[0];
          // Show modal instead of confirm dialog
          setPendingDraft(latestDraft);
          setShowDraftRestore(true);
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    };

    // Delay restoration slightly to ensure auth is loaded
    const timer = setTimeout(restoreDraft, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle Import from URL (Redirect from Prescriptions page)
  const searchParams = useSearchParams();
  useEffect(() => {
    const importRxId = searchParams?.get('importRx');
    if (importRxId && !linkedPrescriptionId && !isLoadingRx) {
      const fetchAndImport = async () => {
        setIsLoadingRx(true);
        try {
          console.log("Auto-importing prescription:", importRxId);
          const response = await prescriptionApi.getPrescriptionById(importRxId);
          if (response.success && response.data) {
            await handleImportPrescription(response.data);
            toast.success('Prescription imported successfully!');
            // Clear the param from URL without reload to prevent re-import on refresh
            window.history.replaceState({}, '', '/pos/new-sale');
          } else {
            toast.error('Failed to load prescription for import');
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error('Error importing prescription');
        } finally {
          setIsLoadingRx(false);
        }
      };

      // Small delay to ensure everything is ready
      setTimeout(fetchAndImport, 500);
    }
  }, [searchParams, linkedPrescriptionId, isLoadingRx]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (basketItems.length === 0) {
      // Clear auto-save timer if basket is empty
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 30 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(true); // auto-save
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [basketItems, customer]);

  // Save draft function
  const saveDraft = async (isAutoSave: boolean = false) => {
    if (basketItems.length === 0) {
      if (!isAutoSave) {
        toast.error('Cannot save empty draft');
      }
      return;
    }

    try {
      setIsSavingDraft(true);
      const totals = calculateTotals();

      const draftData = {
        customerName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : undefined,
        customerPhone: customer?.phoneNumber,
        customerId: customer?.id,
        items: basketItems,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
      };

      let response;
      if (currentDraftId) {
        response = await salesApi.updateDraft(currentDraftId, draftData);
      } else {
        response = await salesApi.saveDraft(draftData);
        if (response.data?.id) {
          setCurrentDraftId(response.data.id);
          localStorage.setItem('currentDraftId', response.data.id);
        }
      }

      setLastSavedAt(new Date());
      if (!isAutoSave) {
        toast.success('Draft saved successfully!');
      }
      console.log(isAutoSave ? 'Auto-saved draft' : 'Draft saved manually');
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (!isAutoSave) {
        toast.error('Failed to save draft');
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Existing shortcuts
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearchFocus(true);
      }
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
      if (e.key === 'F9') {
        e.preventDefault();
        if (basketItems.length > 0) setShowSplitPayment(true);
      }

      // New shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        saveDraft(false); // Manual save
      }
      if (e.key === 'F6') {
        e.preventDefault();
        setShowPrescriptionModal(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (basketItems.length > 0) {
          saveDraft(false);
          alert('Sale parked! You can resume it from the Drafts page.');
          clearBasket();
        }
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (basketItems.length > 0) {
          handleFinalize('CASH'); // Quick cash payment
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        // Print last receipt - TODO: implement
        const lastSale = (window as any).lastSale;
        if (lastSale) {
          console.log('Print last receipt:', lastSale);
          alert('Print functionality coming soon!');
        } else {
          alert('No recent sale to print');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [basketItems, customer]);

  /* 
   * FIX: Add to basket with Duplicate Check
   */
  const addToBasket = (product: any) => {
    // If product has multiple batches and no specific batch is selected, show modal
    if (product.batches > 1 && !product.batchId) {
      setPendingProduct(product);
      setShowBatchModal(true);
      return;
    }

    // Fallback: If single batch or batch pre-selected/flattened
    // Ensure we have a valid batchId if possible, or use 'default' if it's a non-batched item (unlikely for Pharma)
    const targetBatchId = product.batchId || (product.batches === 1 ? product.batchList?.[0]?.id : null);

    if (!targetBatchId) {
      toast.error('Cannot add item: Batch ID is missing. Please select a specific batch.');
      // Force open modal if we can't determine batch?
      setPendingProduct(product);
      setShowBatchModal(true);
      return;
    }

    setBasketItems(prev => {
      // Check if item with same Drug ID AND Batch ID exists
      // Using drugId + batchId is safer than SKU which might be missing
      const existingIndex = prev.findIndex(item =>
        item.id === product.id && item.batchId === targetBatchId
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          qty: newItems[existingIndex].qty + 1
        };
        toast.success(`Added another unit of ${product.name}`);
        return newItems;
      }

      // Add new item
      return [...prev, {
        ...product,
        // Ensure batchId is set if we found it in fallback
        batchId: product.batchId || targetBatchId,
        qty: 1,
        gstRate: product.gstRate ? Number(product.gstRate) : 5
      }];
    });
  };

  const handleBatchSelect = (batch: any) => {
    if (pendingProduct) {
      // FIX: Check if this batch already exists in basket to prevent duplicates
      const newItem = {
        ...pendingProduct,
        batchId: batch.id,
        batchNumber: batch.batchNumber, // Ensure these are strings!
        location: batch.location,
        stock: Number(batch.quantityInStock), // Fix N/A issue by ensuring number
        expiryDate: batch.expiryDate,
        qty: 1,
        gstRate: pendingProduct.gstRate ? Number(pendingProduct.gstRate) : 5
      };

      setBasketItems(prev => {
        const existingIndex = prev.findIndex(item =>
          item.id === newItem.id && item.batchId === newItem.batchId
        );

        if (existingIndex >= 0) {
          const newItems = [...prev];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            qty: newItems[existingIndex].qty + 1
          };
          toast.success(`Added another unit of ${newItem.name}`);
          return newItems;
        }

        return [...prev, newItem];
      });
    }
    setShowBatchModal(false);
    setPendingProduct(null);
  };

  const handleCustomerSelect = (selectedCustomer: any) => {
    setCustomer(selectedCustomer);
    setShowCustomerModal(false);
  };

  const handleImportPrescription = async (rx: any) => {
    // 0. Validation: Check if a prescription is already linked or items exist
    if (linkedPrescriptionId && linkedPrescriptionId === rx.id) {
      toast.error('This prescription is already imported!');
      return;
    }

    // FIX: Clear basket before importing new prescription
    // "And then from scratch the new basket should be loaded!"
    if (basketItems.length > 0) {
      clearBasket();
      // Small toast to inform user
      toast.info('Cleared previous basket for new prescription');
    }

    // 1. Set Customer
    if (rx.patient) {
      setCustomer({
        id: rx.patient.id,
        firstName: rx.patient.firstName,
        lastName: rx.patient.lastName,
        phoneNumber: rx.patient.phoneNumber,
        email: rx.patient.email,
        currentBalance: rx.patient.currentBalance // Ensure debt info is carried over
      });
      // Ensure customer modal is closed
      setShowCustomerModal(false);
    }

    // Link this prescription to the sale
    console.log('🔍 DEBUG: Setting linkedPrescriptionId to:', rx.id);
    setLinkedPrescriptionId(rx.id);
    setActivePrescription(rx);

    // 3. Process Items
    const newItems: any[] = [];
    const missingBatches: string[] = [];

    // Show loading toast since this might take a moment
    const loadingToast = toast.loading('Importing prescription items...');

    try {
      if (!rx.items || !Array.isArray(rx.items)) {
        throw new Error('No items found in prescription');
      }

      for (const item of rx.items) {
        const drugId = item.drug?.id || item.drugId;
        if (!drugId) continue;

        try {
          // If prescription specifies a specific batch, use it directly
          if (item.batchId) {
            const batchResponse = await inventoryApi.getBatches({ drugId: drugId, limit: 100 });
            const batches = (batchResponse as any).data || (batchResponse as any).batches || [];
            const prescribedBatch = batches.find((b: any) => b.id === item.batchId);

            if (prescribedBatch && Number(prescribedBatch.quantityInStock) > 0) {
              const qtyToTake = Math.min(Number(item.quantityPrescribed) || 1, Number(prescribedBatch.quantityInStock));

              newItems.push({
                id: item.drug.id,
                name: item.drug.name,
                sku: item.drug.sku || item.drug.id,
                batchId: prescribedBatch.id,
                batchNumber: prescribedBatch.batchNumber,
                location: prescribedBatch.location,
                expiryDate: prescribedBatch.expiryDate,
                stock: Number(prescribedBatch.quantityInStock),
                mrp: Number(prescribedBatch.mrp),
                qty: qtyToTake,
                discount: 0,
                gstRate: Number(item.drug.gstRate) || 5,
                type: 'RX'
              });

              if (qtyToTake < (Number(item.quantityPrescribed) || 1)) {
                toast.warning(`Prescribed batch for ${item.drug.name} has only ${qtyToTake} units available.`);
              }
            } else {
              toast.error(`Prescribed batch for ${item.drug.name} is no longer available. Using FEFO.`);
              // Fall through to FEFO logic below
            }
          }

          // If no batch specified or prescribed batch unavailable, use FEFO
          if (!item.batchId || !newItems.find(ni => ni.id === item.drug.id && ni.batchId === item.batchId)) {
            // Fetch batches for this drug
            const batchResponse = await inventoryApi.getBatches({ drugId: drugId, limit: 10, minQuantity: 1 });
            const batches = (batchResponse as any).data || (batchResponse as any).batches || [];
            const validBatches = Array.isArray(batches) ? batches.filter((b: any) => Number(b.quantityInStock) > 0) : [];
            validBatches.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

            if (validBatches.length > 0) {
              let remainingQty = Number(item.quantityPrescribed) || 1;

              for (const batch of validBatches) {
                if (remainingQty <= 0) break;

                const currentStock = Number(batch.quantityInStock);
                const qtyToTake = Math.min(remainingQty, currentStock);

                if (qtyToTake > 0) {
                  newItems.push({
                    id: item.drug.id,
                    name: item.drug.name,
                    sku: item.drug.sku || item.drug.id,
                    batchId: batch.id,
                    batchNumber: batch.batchNumber,
                    location: batch.location,
                    expiryDate: batch.expiryDate,
                    stock: currentStock,
                    mrp: Number(batch.mrp),
                    qty: qtyToTake,
                    discount: 0,
                    gstRate: Number(item.drug.gstRate) || 5,
                    type: 'RX'
                  });

                  remainingQty -= qtyToTake;
                }
              }

              if (remainingQty > 0) {
                toast.warning(`Partial stock found for ${item.drug.name}. Missing ${remainingQty} units.`);
              }
            } else {
              missingBatches.push(item.drug?.name || 'Unknown Drug');
            }
          }
        } catch (err) {
          console.error('Error fetching batches for', item.drug?.name, err);
          missingBatches.push(item.drug?.name || 'Unknown Drug');
        }
      }

      if (newItems.length > 0) {
        setBasketItems(newItems); // Replace with new items since we cleared above
        toast.dismiss(loadingToast);
        toast.success(`Imported ${newItems.length} items from prescription`);
      } else {
        toast.dismiss(loadingToast);
        toast.warning('No available batches found for prescription items');
      }

      if (missingBatches.length > 0) {
        toast.error(`Could not find stock for: ${missingBatches.join(', ')}`);
      }

    } catch (error) {
      console.error("Import error:", error);
      toast.dismiss(loadingToast);
      toast.error('Error importing prescription');
    } finally {
      setIsLoadingRx(false);
    }
  };



  const updateBasketItem = (index: number, updates: any) => {
    setBasketItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeBasketItem = (index: number) => {
    setBasketItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearBasket = () => {
    setBasketItems([]);
    setCustomer(null);
    console.log('🔍 DEBUG: Clearing linkedPrescriptionId (was:', linkedPrescriptionId, ')');
    setLinkedPrescriptionId(null);
    setActivePrescription(null);
    setCurrentDraftId(null); // Clear draft ID when clearing basket
    localStorage.removeItem('currentDraftId'); // Remove from localStorage
  };

  // Apply Overall Discount
  const handleApplyOverallDiscount = (type: 'percentage' | 'amount', value: number) => {
    setBasketItems(prev => {
      const totalMrp = prev.reduce((sum, item) => sum + (item.qty * item.mrp), 0);

      return prev.map(item => {
        const itemTotal = item.qty * item.mrp;
        let discountValue = 0;
        let discountAmount = 0;

        if (type === 'percentage') {
          discountValue = value;
          discountAmount = (itemTotal * value) / 100;
        } else {
          // Weighted distribution for fixed amount
          const ratio = itemTotal / totalMrp;
          discountAmount = value * ratio;
          discountValue = discountAmount; // For 'amount' type, value is the amount
        }

        return {
          ...item,
          discountType: type,
          discountValue: Number(discountValue.toFixed(2)),
          discount: Number(discountAmount.toFixed(2))
        };
      });
    });
    toast.success('Overall discount applied to all items');
  };

  // Calculate GST
  // Enhanced Financial Calculations
  const calculateTotals = () => {
    let totalMrp = 0;
    let totalDiscount = 0;
    let taxableValue = 0;
    let taxAmount = 0;
    let netTotal = 0;

    basketItems.forEach((item: any) => {
      // 1. Base values
      const itemMrpTotal = item.qty * item.mrp;
      const itemDiscount = item.discount || 0;

      // 2. Net Payable for this line (Inclusive of Tax)
      const lineNet = itemMrpTotal - itemDiscount;

      // 3. Back-calculate Tax
      const gstRate = item.gstRate || 0;
      const itemTaxable = lineNet / (1 + gstRate / 100);
      const itemTax = lineNet - itemTaxable;

      // 4. Accumulate
      totalMrp += itemMrpTotal;
      totalDiscount += itemDiscount;
      taxableValue += itemTaxable;
      taxAmount += itemTax;
      netTotal += lineNet;
    });

    const roundedTotal = Math.round(netTotal);
    const roundOff = roundedTotal - netTotal;

    return {
      totalMrp,
      totalDiscount,
      taxableValue,
      taxAmount,
      roundOff,
      total: roundedTotal,
      subtotal: totalMrp // For legacy props, usually Total MRP is what's expected as "Subtotal" in simple views
    };
  };

  const totals = calculateTotals();

  const handleFinalize = async (paymentMethod: string = 'CASH', splits?: any, invoiceType: string = 'RECEIPT') => {
    if (basketItems.length === 0) {
      toast.error('Please add items to the basket');
      return;
    }

    try {
      const { salesApi } = await import('@/lib/api/sales');

      // Prepare sale items - GST is already included in MRP
      // Prepare sale items - GST is already included in MRP
      const items = basketItems.filter((item: any) => item.batchId).map((item: any) => {
        const itemTotal = item.qty * item.mrp;
        const itemDiscount = item.discount || 0;
        const netAmount = itemTotal - itemDiscount;
        const gstRate = item.gstRate || 0;

        // Extract GST from MRP (GST is inclusive)
        const taxableAmount = netAmount / (1 + gstRate / 100);
        const itemTax = netAmount - taxableAmount;

        return {
          drugId: item.id,
          batchId: item.batchId,
          quantity: item.qty,
          mrp: Number(item.mrp),
          discount: Number(itemDiscount),
          gstRate: Number(gstRate),
          lineTotal: Number(netAmount.toFixed(2)),
        };
      });

      if (items.length !== basketItems.length) {
        toast.error('Some items were invalid (missing batch) and removed.');
        if (items.length === 0) return;
      }

      // Prepare payment splits
      let paymentSplits: any[] = [];

      if (paymentMethod === 'SPLIT' && splits) {
        // Map the splits object { cash: 10, card: 20 ... } to an array
        const methods = ['cash', 'card', 'upi', 'wallet', 'credit'];
        paymentSplits = methods
          .filter(m => splits[m] && Number(splits[m]) > 0)
          .map(m => ({
            paymentMethod: m.toUpperCase(),
            amount: Number(splits[m])
          }));
      } else {
        paymentSplits = [{
          paymentMethod,
          amount: Number(totals.total),
        }];
      }

      // Create sale with required fields (storeId and soldBy added by middleware)
      const saleData = {
        patientId: customer?.id || null,
        invoiceType: invoiceType.toUpperCase(), // Pass invoice type
        subtotal: Number(totals.subtotal.toFixed(2)),
        discountAmount: Number(totals.totalDiscount.toFixed(2)),
        taxAmount: Number(totals.taxAmount.toFixed(2)),
        roundOff: Number(totals.roundOff.toFixed(2)),
        total: Number(totals.total),
        items,
        paymentSplits,
        prescriptionId: linkedPrescriptionId, // Link to prescription if imported
        invoiceNumber, // Pass the invoice number (manually edited or auto-fetched)
      };

      console.log('Creating sale with data:', saleData);
      console.log('🔍 DEBUG: linkedPrescriptionId =', linkedPrescriptionId);
      console.log('🔍 DEBUG: prescriptionId in saleData =', saleData.prescriptionId);
      const response = await salesApi.createSale(saleData);
      console.log('Sale API response:', response);

      // Check if sale was created successfully (response has id and invoiceNumber)
      if (response && (response.id || response.invoiceNumber)) {
        const invoiceNumber = response.invoiceNumber || 'Invoice';

        // If this sale was created from a draft, delete the draft
        if (currentDraftId) {
          try {
            await salesApi.deleteDraft(currentDraftId);
            console.log('Draft deleted successfully:', currentDraftId);
            setCurrentDraftId(null);
            localStorage.removeItem('currentDraftId');
          } catch (draftError) {
            console.error('Failed to delete draft:', draftError);
            // Don't show error to user since sale was successful
          }
        }

        // Show success toast with invoice number
        toast.success(`${invoiceNumber} created successfully!`, {
          description: `Total: ₹${totals.total.toFixed(2)}`,
          duration: 5000,
        });

        // Clear basket and reset form
        clearBasket();
        setCustomer(null);

        // Optional: Navigate to invoices tab after a short delay
        // setTimeout(() => {
        //   window.location.href = '/pos/invoices';
        // }, 2000);
      } else {
        console.error('Sale creation failed - response:', response);
        const errorMsg = response.message || response.error || 'Unknown error occurred';
        toast.error(`Failed to create sale: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Sale creation failed:', error);

      // Extract meaningful error message
      let errorMessage = 'An unexpected error occurred';

      console.error('=== SALE CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`Sale Creation Failed: ${errorMessage}`);
    }
  };


  const handleNewSale = () => {
    setShowSuccess(false);
    clearBasket();
  };

  const handleSplitPaymentConfirm = (splits: any) => {
    console.log('Split payment confirmed:', splits);
    setShowSplitPayment(false);
    handleFinalize('SPLIT');
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc]">
      <POSHeader
        saleId={saleId}
        onOpenCustomer={() => setShowCustomerModal(true)}
        onOpenPrescription={() => setShowPrescriptionModal(true)}
        activePrescription={activePrescription}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 65% */}
        <div className="w-[65%] flex flex-col border-r border-[#e2e8f0]">
          {/* Hybrid Context Banner */}
          <PrescriptionBanner
            prescription={activePrescription}
            onClear={() => {
              clearBasket();
              toast.success('Unlinked prescription and cleared basket');
            }}
          />

          <ProductSearch
            onAddProduct={addToBasket}
            searchFocus={searchFocus}
            setSearchFocus={setSearchFocus}
          />
          <QuickAddGrid onAddProduct={addToBasket} storeId={storeId} />

          <Basket
            items={basketItems}
            onUpdateItem={updateBasketItem}
            onRemoveItem={removeBasketItem}
            onClear={clearBasket}
          />
        </div>

        {/* Right Panel - 35% */}
        <div className="w-[35%] bg-white">
          <PaymentPanel
            basketItems={basketItems}
            customer={customer}
            onCustomerChange={setCustomer}
            onFinalize={(method: string, splits?: any, invoiceType?: string) => handleFinalize(method, splits, invoiceType)}
            onOpenCustomer={() => setShowCustomerModal(true)}
            onOpenLedger={() => customer ? setShowLedgerModal(true) : toast.error("Select a customer first")}
            onSplitPayment={() => setShowSplitPayment(true)}
            onClear={clearBasket}
            onApplyDiscount={handleApplyOverallDiscount}
            totals={totals}
          />
        </div>
      </div>

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      {showBatchModal && (
        <BatchModal
          product={pendingProduct}
          onSelect={handleBatchSelect}
          onClose={() => {
            setShowBatchModal(false);
            setPendingProduct(null);
          }}
        />
      )}
      {showCustomerModal && (
        <CustomerModal
          onSelect={handleCustomerSelect}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
      {showPrescriptionModal && (
        <PrescriptionImportModal
          onSelect={handleImportPrescription}
          onClose={() => setShowPrescriptionModal(false)}
        />
      )}
      {showSplitPayment && (
        <SplitPaymentModal
          total={calculateTotals().total}
          onClose={() => setShowSplitPayment(false)}
          onConfirm={(splits: any) => {
            setShowSplitPayment(false);
            handleFinalize('SPLIT', splits);
          }}
        />
      )}

      {showLedgerModal && customer && (
        <CustomerLedgerPanel
          isOpen={showLedgerModal}
          onClose={() => setShowLedgerModal(false)}
          customerId={customer.id}
          onBalanceUpdate={(newBalance) => {
            console.log('Refreshing POS customer balance:', newBalance);
            setCustomer((prev: any) => prev ? ({ ...prev, currentBalance: newBalance }) : null);
          }}
        />
      )}

      {showDraftRestore && pendingDraft && (
        <DraftRestoreModal
          draftDate={pendingDraft.createdAt}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {showSuccess && (
        <SuccessScreen
          saleData={{ invoiceNo: saleId, total: totals.total, method: 'cash' }}
          onNewSale={handleNewSale}
          onClose={handleNewSale}
        />
      )}
    </div>
  );
}
