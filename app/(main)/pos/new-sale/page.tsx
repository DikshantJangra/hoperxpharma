'use client';

import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleFinalize = async (paymentMethod: string = 'CASH') => {
    if (basketItems.length === 0) {
      alert('Please add items to the basket');
      return;
    }

    try {
      const { salesApi } = await import('@/lib/api/sales');

      // Prepare sale items
      const items = basketItems.map((item: any) => ({
        drugId: item.id,
        batchId: item.batchId,
        quantity: item.qty,
        mrp: Number(item.mrp),
        discount: Number(item.discount || 0),
        gstRate: Number(item.gstRate || 0),
        lineTotal: Number((item.qty * item.mrp) - (item.discount || 0)),
      }));

      // Prepare payment splits
      const paymentSplits = [{
        paymentMethod,
        amount: Number(totals.total),
      }];

      // Create sale
      const saleData = {
        patientId: customer?.id || null,
        subtotal: Number(totals.subtotal),
        discountAmount: 0,
        taxAmount: Number(totals.taxAmount),
        roundOff: 0,
        total: Number(totals.total),
        items,
        paymentSplits,
      };

      const response = await salesApi.createSale(saleData);

      if (response.success) {
        setShowSuccess(true);
        // Store the sale data for the success screen
        (window as any).lastSale = response.data;
      } else {
        alert('Failed to create sale: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Sale creation failed:', error);
      alert('Failed to create sale: ' + (error.message || 'Please try again'));
    }
  };


  const handleNewSale = () => {
    setShowSuccess(false);
    clearBasket();
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
  };

  const subtotal = basketItems.reduce((sum: number, item: any) =>
    sum + (item.qty * item.mrp - (item.discount || 0)), 0
  );
  const total = Math.round(subtotal);

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
          <QuickAddGrid onAddProduct={addToBasket} />

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
          total={total}
          onConfirm={handleSplitPaymentConfirm}
          onClose={() => setShowSplitPayment(false)}
        />
      )}
      {showSuccess && (
        <SuccessScreen
          saleData={{ invoiceNo: saleId, total, method: 'cash' }}
          onNewSale={handleNewSale}
          onClose={handleNewSale}
        />
      )}
    </div>
  );
}
