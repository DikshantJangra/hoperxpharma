'use client';

import { useState, useEffect, useRef } from 'react';
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
import { salesApi } from '@/lib/api/sales';

export default function NewSalePage() {
  const [basketItems, setBasketItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchFocus, setSearchFocus] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
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

  const addToBasket = (product: any) => {
    if (product.batches > 1) {
      setPendingProduct(product);
      setShowBatchModal(true);
    } else {
      setBasketItems(prev => {
        const existing = prev.find(item => item.sku === product.sku && item.batchId === product.batchId);
        if (existing) {
          return prev.map(item =>
            item.sku === product.sku && item.batchId === product.batchId
              ? { ...item, qty: item.qty + 1 }
              : item
          );
        }
        return [...prev, { ...product, qty: 1 }];
      });
    }
  };

  const handleBatchSelect = (batch: any) => {
    if (pendingProduct) {
      setBasketItems(prev => [...prev, { ...pendingProduct, batchId: batch.batchId, qty: 1 }]);
    }
    setShowBatchModal(false);
    setPendingProduct(null);
  };

  const handleCustomerSelect = (selectedCustomer: any) => {
    setCustomer(selectedCustomer);
    setShowCustomerModal(false);
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
    setCurrentDraftId(null); // Clear draft ID when clearing basket
    localStorage.removeItem('currentDraftId'); // Remove from localStorage
  };

  const subtotal = basketItems.reduce((sum: number, item: any) =>
    sum + (item.qty * item.mrp - (item.discount || 0)), 0
  );

  // Calculate GST
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    basketItems.forEach((item: any) => {
      const itemTotal = item.qty * item.mrp;
      const itemDiscount = item.discount || 0;
      const netAmount = itemTotal - itemDiscount;

      // Calculate GST (assuming GST is included in MRP)
      const gstRate = item.gstRate || 0;
      const taxableAmount = netAmount / (1 + gstRate / 100);
      const itemTax = netAmount - taxableAmount;

      subtotal += netAmount;
      taxAmount += itemTax;
    });

    return {
      subtotal: subtotal - taxAmount,
      taxAmount,
      total: Math.round(subtotal),
    };
  };

  const totals = calculateTotals();

  const handleFinalize = async (paymentMethod: string = 'CASH', splits?: any) => {
    if (basketItems.length === 0) {
      toast.error('Please add items to the basket');
      return;
    }

    try {
      const { salesApi } = await import('@/lib/api/sales');

      // Prepare sale items - GST is already included in MRP
      const items = basketItems.map((item: any) => {
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

      // Prepare payment splits
      const paymentSplits = [{
        paymentMethod,
        amount: Number(totals.total),
      }];

      // Create sale with required fields (storeId and soldBy added by middleware)
      const saleData = {
        patientId: customer?.id || null,
        subtotal: Number(totals.subtotal.toFixed(2)),
        discountAmount: 0,
        taxAmount: Number(totals.taxAmount.toFixed(2)),
        roundOff: Number((Math.round(totals.total) - totals.total).toFixed(2)),
        total: Number(Math.round(totals.total)),
        items,
        paymentSplits,
      };

      console.log('Creating sale with data:', saleData);
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
      <POSHeader saleId={saleId} onOpenCustomer={() => setShowCustomerModal(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 65% */}
        <div className="w-[65%] flex flex-col border-r border-[#e2e8f0]">
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
            onFinalize={handleFinalize}
            onOpenCustomer={() => setShowCustomerModal(true)}
            onSplitPayment={() => setShowSplitPayment(true)}
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
