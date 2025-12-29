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
import { salesApi, Sale } from '@/lib/api/sales';
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
  const [editingBasketItemIndex, setEditingBasketItemIndex] = useState<number | null>(null);
  const [saleId, setSaleId] = useState(`S-2025-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [linkedPrescriptionId, setLinkedPrescriptionId] = useState<string | undefined>(undefined);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [isLoadingRx, setIsLoadingRx] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [shouldCreateRefill, setShouldCreateRefill] = useState(false); // Track if this sale should create a refill
  const [overallDiscount, setOverallDiscount] = useState<{ type: 'percentage' | 'amount' | null, value: number }>({ type: null, value: 0 });
  const [dispenseFor, setDispenseFor] = useState<any>(null); // Track who medication is dispensed for
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

        // FIX: If we are importing a prescription via URL, DO NOT restore drafts
        const importRxId = searchParams?.get('importRx') || searchParams?.get('prescriptionId');
        if (importRxId) {
          console.log('📥 Import detected, skipping draft restoration');
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

  // State for loading overlay
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Handle Import from URL (Redirect from Prescriptions page)
  const searchParams = useSearchParams();
  const hasImportedRef = useRef(false);

  useEffect(() => {
    // Get params with fallbacks
    const urlPrescriptionId = searchParams?.get('prescriptionId');
    const importRxId = searchParams?.get('importRx') || urlPrescriptionId;
    const createRefillParam = searchParams?.get('createRefill');
    const medicationIdsParam = searchParams?.get('medicationIds');

    console.log('🔗 URL Params detected:', {
      importRxId,
      urlPrescriptionId,
      createRefillParam,
      medicationIdsParam,
      currentLinkedRx: linkedPrescriptionId,
      isLoading: isLoadingRx
    });

    // Set refill creation flag if present
    if (createRefillParam === 'true') {
      if (!shouldCreateRefill) {
        console.log('🔄 Enabling Refill Creation Mode');
        setShouldCreateRefill(true);
      }
    }

    // Trigger import if we have an ID and haven't imported yet
    if (importRxId && !linkedPrescriptionId && !isLoadingRx && !hasImportedRef.current) {
      hasImportedRef.current = true; // Mark as started immediately
      const fetchAndImport = async () => {
        setIsLoadingRx(true);
        setImportStatus('Initializing prescription import...');

        try {
          console.log("🚀 Starting auto-import for:", importRxId);
          setImportStatus('Fetching prescription details...');

          const response = await prescriptionApi.getPrescriptionById(importRxId);

          if (response.success && response.data) {
            // Parse medication IDs if present
            const medicationIdsFilter = medicationIdsParam ? medicationIdsParam.split(',') : undefined;
            console.log("💊 Filtering medications:", medicationIdsFilter);

            await handleImportPrescription(response.data, medicationIdsFilter);

            toast.success('Prescription imported successfully!');
            // Clear the param from URL to prevent re-import loop
            window.history.replaceState({}, '', '/pos/new-sale');
          } else {
            toast.error('Failed to load prescription data');
          }
        } catch (error) {
          console.error('❌ Error importing prescription:', error);
          toast.error('Failed to import prescription');
        } finally {
          setIsLoadingRx(false);
          setImportStatus(null);
        }
      };

      // Run immediately
      fetchAndImport();
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

  const handleEditBatch = (item: any, index: number) => {
    // For editing, we treat the item as the 'pendingProduct' so BatchModal knows what drug to fetch batches for
    setPendingProduct(item);
    setEditingBasketItemIndex(index);
    setShowBatchModal(true);
  };

  const handleBatchSelect = (batch: any) => {
    if (pendingProduct) {
      // Create the item object from the selected batch
      const newItem = {
        ...pendingProduct,
        batchId: batch.id,
        batchNumber: batch.batchNumber, // Ensure these are strings!
        location: batch.location,
        stock: Number(batch.quantityInStock), // Fix N/A issue by ensuring number
        expiryDate: batch.expiryDate,
        qty: editingBasketItemIndex !== null ? basketItems[editingBasketItemIndex].qty : 1, // Keep existing qty if editing
        gstRate: pendingProduct.gstRate ? Number(pendingProduct.gstRate) : 5,
        // Override price if batch has specific MRP/PTR (optional, usually batch price rules)
        mrp: batch.mrp || pendingProduct.mrp
      };

      setBasketItems(prev => {
        // CASE 1: Editing an existing item in the basket
        if (editingBasketItemIndex !== null) {
          const newItems = [...prev];
          newItems[editingBasketItemIndex] = {
            ...newItems[editingBasketItemIndex], // Keep other props like discount
            ...newItem, // Overwrite with new batch details
            qty: newItems[editingBasketItemIndex].qty // Preserve quantity
          };
          toast.success(`Batch updated to ${batch.batchNumber}`);
          return newItems;
        }

        // CASE 2: Adding a new item (Duplicate Check)
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
    setEditingBasketItemIndex(null);
  };

  const handleCustomerSelect = (selectedCustomer: any) => {
    setCustomer(selectedCustomer);
    setShowCustomerModal(false);
  };

  const handleImportPrescription = async (rx: any, medicationIdsFilter?: string[]) => {
    // 0. Validation: Check if a prescription is already linked or items exist
    if (linkedPrescriptionId && linkedPrescriptionId === rx.id) {
      toast.error('This prescription is already imported!');
      return;
    }

    // FIX: Clear basket before importing new prescription
    if (basketItems.length > 0) {
      clearBasket();
      toast.info('Cleared previous basket for new prescription');
    }

    setImportStatus('Setting up customer...');

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
    if (rx?.id) {
      setLinkedPrescriptionId(rx.id);
      setActivePrescription(rx);
    } else {
      toast.error('Import failed: Invalid prescription data (ID missing)');
      return;
    }

    // 3. Process Items with detailed tracking
    const newItems: any[] = [];
    const missingBatches: string[] = [];
    const substitutions: Array<{ drug: string; reason: string; originalBatch?: string; newBatch?: string }> = [];

    setImportStatus('Processing prescription items...');

    try {
      if (!rx.items || !Array.isArray(rx.items)) {
        throw new Error('No items found in prescription');
      }

      const totalItems = rx.items.length;
      let processedCount = 0;

      for (const item of rx.items) {
        processedCount++;
        setImportStatus(`Processing item ${processedCount} of ${totalItems}...`);

        const drugId = item.drug?.id || item.drugId;
        if (!drugId) continue;

        // Filter by specific medications if requested (e.g., for Refills)
        if (medicationIdsFilter && medicationIdsFilter.length > 0) {
          if (!medicationIdsFilter.includes(drugId)) {
            continue;
          }
        }

        try {
          // Extract batchId - backend returns it as an object if included
          const prescribedBatchId = item.batch?.id || item.batchId;

          // If prescription specifies a specific batch, use it directly
          if (prescribedBatchId) {
            // If we already have the full batch details from the prescription, use them
            if (item.batch && item.batch.quantityInStock && Number(item.batch.quantityInStock) > 0) {
              const qtyToTake = Math.min(Number(item.quantityPrescribed) || 1, Number(item.batch.quantityInStock));

              newItems.push({
                id: item.drug.id,
                name: item.drug.name,
                sku: item.drug.sku || item.drug.id,
                batchId: item.batch.id,
                batchNumber: item.batch.batchNumber,
                location: item.batch.location,
                expiryDate: item.batch.expiryDate,
                stock: Number(item.batch.quantityInStock),
                mrp: Number(item.batch.mrp),
                qty: qtyToTake,
                discount: 0,
                gstRate: Number(item.drug.gstRate) || 5,
                type: 'RX'
              });

              if (qtyToTake < (Number(item.quantityPrescribed) || 1)) {
                const shortage = (Number(item.quantityPrescribed) || 1) - qtyToTake;
                substitutions.push({
                  drug: item.drug.name,
                  reason: `Partial stock: Only ${qtyToTake} of ${item.quantityPrescribed} units available in prescribed batch ${item.batch.batchNumber}`,
                  originalBatch: item.batch.batchNumber,
                });
              }

              // Successfully used prescribed batch, skip FEFO
              continue;
            } else {
              // Batch ID exists but need to fetch current stock
              const batchResponse = await inventoryApi.getBatches({ drugId: drugId, limit: 100 });
              const batches = (batchResponse as any).data || (batchResponse as any).batches || [];
              const prescribedBatch = batches.find((b: any) => b.id === prescribedBatchId);

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
                  substitutions.push({
                    drug: item.drug.name,
                    reason: `Partial stock: Only ${qtyToTake} of ${item.quantityPrescribed} units available`,
                    originalBatch: prescribedBatch.batchNumber,
                  });
                }

                // Successfully used prescribed batch, skip FEFO
                continue;
              } else {
                // Batch specified but not found or out of stock
                substitutions.push({
                  drug: item.drug.name,
                  reason: "Prescribed batch not available or out of stock",
                  originalBatch: prescribedBatchId
                });
                // Fall through to FEFO logic to try finding another batch
              }

              // End of specific batch check
            }
          }

          // If no batch specified or prescribed batch unavailable, use FEFO
          if (!prescribedBatchId || !newItems.find(ni => ni.id === item.drug.id && ni.batchId === prescribedBatchId)) {
            // Fetch batches for this drug
            const batchResponse = await inventoryApi.getBatches({ drugId: drugId, limit: 10, minQuantity: 0 }); // Allow 0 qty to find at least something
            const batches = (batchResponse as any).data || (batchResponse as any).batches || [];

            // Try to find valid stock first
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

                  // ... substitution tracking ...
                  if (prescribedBatchId && substitutions.findIndex(s => s.drug === item.drug.name) === -1) {
                    substitutions.push({
                      drug: item.drug.name,
                      reason: 'Using FEFO batch',
                      newBatch: batch.batchNumber
                    });
                  }

                  remainingQty -= qtyToTake;
                }
              }

              if (remainingQty > 0) {
                substitutions.push({
                  drug: item.drug.name,
                  reason: `Insufficient stock: Missing ${remainingQty} units`,
                });
              }
            } else {
              // NO VALID STOCK FOUND - Add first available batch (even if 0) to show item in POS
              const anyBatch = batches[0];
              if (anyBatch) {
                newItems.push({
                  id: item.drug.id,
                  name: item.drug.name,
                  sku: item.drug.sku || item.drug.id,
                  batchId: anyBatch.id,
                  batchNumber: anyBatch.batchNumber,
                  location: anyBatch.location,
                  expiryDate: anyBatch.expiryDate,
                  stock: Number(anyBatch.quantityInStock),
                  mrp: Number(anyBatch.mrp),
                  qty: Number(item.quantityPrescribed) || 1, // Show requested
                  discount: 0,
                  gstRate: Number(item.drug.gstRate) || 5,
                  type: 'RX'
                });
                missingBatches.push(`${item.drug?.name} (Out of Stock)`);
              } else {
                missingBatches.push(item.drug?.name || 'Unknown Drug');
              }
            }
          }
        } catch (err) {
          console.error('Error fetching batches for', item.drug?.name, err);
          missingBatches.push(item.drug?.name || 'Unknown Drug');
        }
      }

      if (newItems.length > 0) {
        setBasketItems(newItems); // Replace with new items since we cleared above

        // Show detailed summary
        if (substitutions.length > 0 || missingBatches.length > 0) {
          const messages = [];

          if (substitutions.length > 0) {
            messages.push(`⚠️ Batch Substitutions (${substitutions.length}):`);
            substitutions.forEach(sub => {
              let msg = `• ${sub.drug}: ${sub.reason}`;
              if (sub.originalBatch) msg += ` (was: ${sub.originalBatch})`;
              if (sub.newBatch) msg += ` → (now: ${sub.newBatch})`;
              messages.push(msg);
            });
          }

          if (missingBatches.length > 0) {
            messages.push(`\n❌ Out of Stock (${missingBatches.length}):`);
            missingBatches.forEach(drug => messages.push(`• ${drug}`));
          }

          toast.warning(
            <div className="text-sm">
              <div className="font-bold mb-2">Prescription Import Summary</div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className="whitespace-pre-wrap">{msg}</div>
                ))}
              </div>
              <div className="mt-2 text-xs opacity-75">
                Please review the imported items and adjust quantities if needed.
              </div>
            </div>,
            {
              duration: 10000, // Show for 10 seconds
            }
          );
        } else {
          toast.success(`✅ Imported ${newItems.length} items with prescribed batches`);
        }
      } else {
        toast.warning('No available batches found for prescription items');
      }

    } catch (error) {
      console.error("Import error:", error);
      toast.error('Error importing prescription');
    } finally {
      setIsLoadingRx(false);
      setImportStatus(null);
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
    setLinkedPrescriptionId(undefined);
    setActivePrescription(null);
    setCurrentDraftId(null); // Clear draft ID when clearing basket
    setShouldCreateRefill(false);
    setOverallDiscount({ type: null, value: 0 }); // Reset overall discount
    localStorage.removeItem('currentDraftId'); // Remove from localStorage
  };

  // Apply Overall Discount (stores for application in calculateTotals)
  const handleApplyOverallDiscount = (type: 'percentage' | 'amount', value: number) => {
    setOverallDiscount({ type, value });
    toast.success(`Overall ${type} discount of ${type === 'percentage' ? value + '%' : '₹' + value} applied`);
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

    // 5. Apply overall discount to the final total (AFTER item discounts + GST)
    let overallDiscountAmount = 0;
    if (overallDiscount.type === 'percentage' && overallDiscount.value > 0) {
      overallDiscountAmount = (netTotal * overallDiscount.value) / 100;
    } else if (overallDiscount.type === 'amount' && overallDiscount.value > 0) {
      overallDiscountAmount = overallDiscount.value;
    }

    const totalAfterOverallDiscount = netTotal - overallDiscountAmount;
    const roundedTotal = Math.round(totalAfterOverallDiscount);
    const roundOff = roundedTotal - totalAfterOverallDiscount;

    return {
      totalMrp,
      totalDiscount, // Item-level discounts only
      overallDiscountAmount, // Overall discount separate
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
        shouldCreateRefill, // Pass the flag to backend
        invoiceNumber, // Pass the invoice number (manually edited or auto-fetched)
      };

      // Ensure prescriptionId is undefined if null to match interface
      console.log('Creating sale with data:', {
        ...saleData,
        itemCount: saleData.items.length,
        hasCustomer: !!saleData.patientId,
        hasPrescription: !!saleData.prescriptionId,
        shouldCreateRefill // Add refill creation flag
      });

      const response = await salesApi.createSale({
        ...saleData,
        shouldCreateRefill // Pass flag to backend
      });

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

        // Show success toast
        toast.success(`${invoiceNumber} created successfully!`, {
          description: `Total: ₹${totals.total.toFixed(2)}`,
        });

        // Set sale ID for success screen (using invoice number for display)
        setSaleId(invoiceNumber);

        // Show success screen (GPay style animation)
        setShowSuccess(true);

        // Note: Basket clearing is now handled when user clicks "New Sale" in SuccessScreen
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
    setCustomer(null);
    setSaleId(`S-2025-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
  };

  const handleSplitPaymentConfirm = (splits: any) => {
    console.log('Split payment confirmed:', splits);
    setShowSplitPayment(false);
    handleFinalize('SPLIT');
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] relative">
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
            onEditBatch={handleEditBatch}
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
            dispenseFor={dispenseFor}
            onDispenseForChange={setDispenseFor}
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
      {/* Loading Overlay - Scoped and Minimal */}
      {importStatus && (
        <div className="absolute inset-0 z-[50] flex items-center justify-center pointer-events-none">
          {/* Backdrop only blurring, no color overlay to keep it clean */}
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>

          <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 ring-1 ring-black/5 flex flex-col items-center space-y-4 min-w-[280px] pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-10 h-10">
              <svg className="animate-spin text-blue-600 w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase">Importing Prescription</h3>
              <p className="text-xs text-blue-600 font-medium">{importStatus}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
