'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import PrescriptionImportPanel from '@/components/pos/PrescriptionImportPanel';
import SubstituteFinder from '@/components/pos/SubstituteFinder';
import { inventoryApi } from '@/lib/api/inventory';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
// import { useMedicineMaster } from '@/contexts/MedicineMasterContext'; // Removed legacy lookup
import { scanApi } from '@/lib/api/scan';
// import { useKeyboardCommand } from '@/hooks/useKeyboardCommand'; // (kept as is)
import { useKeyboardCommand } from '@/hooks/useKeyboardCommand';
import dynamic from 'next/dynamic';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

export default function NewSalePage() {
    const router = useRouter();
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
    const [saleId, setSaleId] = useState(`S-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [showDraftRestore, setShowDraftRestore] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<any>(null);
    const storeId = 'default';
    const [showImportPanel, setShowImportPanel] = useState(false);
    const [linkedPrescriptionId, setLinkedPrescriptionId] = useState<string | undefined>(undefined);
    const [activePrescription, setActivePrescription] = useState<any>(null);
    const [isLoadingRx, setIsLoadingRx] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [lastSaleId, setLastSaleId] = useState<string | null>(null); // Store sale ID for PDF printing
    const [shouldCreateRefill, setShouldCreateRefill] = useState(false); // Track if this sale should create a refill
    const [overallDiscount, setOverallDiscount] = useState<{ type: 'percentage' | 'amount' | null, value: number }>({ type: null, value: 0 });
    const [dispenseFor, setDispenseFor] = useState<any>(null); // Track who medication is dispensed for
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [showScanner, setShowScanner] = useState(false);
    const [showSubstituteFinder, setShowSubstituteFinder] = useState(false);
    const [substituteForItem, setSubstituteForItem] = useState<any>(null);
    const [substituteItemIndex, setSubstituteItemIndex] = useState<number | null>(null);

    // Barcode Scanner Integration
    // const { lookupByBarcode } = useMedicineMaster(); // Deprecated

    const handleScan = async (barcode: string) => {
        console.log('🔫 Scanned Barcode:', barcode);
        const toastId = toast.loading('Searching inventory...');

        try {
            // 1. Lookup in LIVE Inventory via API
            const scannedItem = await scanApi.processScan(barcode);
            toast.dismiss(toastId);

            if (!scannedItem) {
                toast.error(`Item not found: ${barcode}`);
                return;
            }

            toast.success(`Found: ${scannedItem.drugName} (${scannedItem.batchNumber})`);

            // 2. Convert to Product format for basket
            // CRITICAL: We have the SPECIFIC batch from the scan, so we populate batchId directly.
            // This allows `addToBasket` to bypass the Batch Selection Modal.
            const productToAdd = {
                id: scannedItem.drugId, // Ensure we map drugId to id
                drugId: scannedItem.drugId, // Explicitly add drugId
                name: scannedItem.drugName,
                mrp: Number(scannedItem.mrp),
                gstRate: Number(scannedItem.gstRate),
                manufacturer: scannedItem.manufacturer || 'Unknown',
                type: 'RX',
                requiresPrescription: true,
                stock: Number(scannedItem.baseUnitQuantity),
                batches: 1,
                batchCount: 1,
                // Pass conversion details
                conversionFactor: Number(scannedItem.conversionFactor) || 1,
                baseUnit: scannedItem.baseUnit || 'Tablet',
                displayUnit: scannedItem.displayUnit || 'Strip',

                // Specific Batch Details
                batchId: scannedItem.batchId,
                batchNumber: scannedItem.batchNumber,
                expiryDate: scannedItem.expiryDate,
                location: scannedItem.location,

                barcode: barcode
            };

            console.log('📦 Add Payload:', productToAdd);

            // Validate critical fields
            if (!productToAdd.id || !productToAdd.batchId) {
                console.error('❌ Missing critical fields:', productToAdd);
                toast.error('Scan failed: Invalid item data received');
                return;
            }

            addToBasket(productToAdd);
            console.log('✅ addToBasket called');
            toast.success('Added to basket!');

        } catch (error: any) {
            toast.dismiss(toastId);
            console.error('Scan error:', error);
            // Customize error message based on API response
            const msg = error.response?.data?.message || `Item not found: ${barcode}`;
            toast.error(msg);
        }
    };

    // Helper to get barcode string
    const listBarcode = (item: any) => item.barcode;

    useBarcodeScanner({
        onScan: handleScan,
        minLength: 3,
        timeThreshold: 50
    });

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
                // Check auto-restore setting
                const autoRestore = localStorage.getItem('pos_auto_restore_drafts') !== 'false';
                if (!autoRestore) {
                    console.log('Auto-restore disabled, skipping draft restoration');
                    return;
                }

                // Check if user is authenticated first (use logged_in cookie since tokens are httpOnly)
                const hasSession = typeof document !== 'undefined' &&
                    document.cookie.includes('logged_in=true');
                if (!hasSession) {
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
    useKeyboardCommand('global.search', () => {
        setSearchFocus(true);
    });

    useKeyboardCommand('global.help', () => {
        setShowShortcuts(true);
    });

    useKeyboardCommand('pos.customerSearch', () => {
        setShowCustomerModal(true);
    });

    useKeyboardCommand('pos.splitPayment', () => {
        if (basketItems.length > 0) setShowSplitPayment(true);
    });

    useKeyboardCommand('pos.saveDraft', () => {
        saveDraft(false); // Manual save
    });

    useKeyboardCommand('pos.prescription', () => {
        setShowImportPanel(prev => !prev);
    });

    useKeyboardCommand('pos.parkSale', () => {
        if (basketItems.length > 0) {
            saveDraft(false);
            alert('Sale parked! You can resume it from the Drafts page.');
            clearBasket();
        }
    });

    useKeyboardCommand('pos.quickPay', () => {
        if (basketItems.length > 0) {
            handleFinalize('CASH'); // Quick cash payment
        }
    });

    useKeyboardCommand('pos.printLast', () => {
        // Print last receipt - TODO: implement
        const lastSale = (window as any).lastSale;
        if (lastSale) {
            console.log('Print last receipt:', lastSale);
            alert('Print functionality coming soon!');
        } else {
            alert('No recent sale to print');
        }
    });

    /* 
     * FIX: Add to basket with Duplicate Check
     */
    const addToBasket = (product: any) => {
        // CRITICAL VALIDATION: Ensure product has essential fields
        if (!product || typeof product !== 'object') {
            console.error('❌ Cannot add invalid product:', product);
            toast.error('Invalid product data');
            return;
        }

        if (!product.id) {
            console.error('❌ Cannot add product without ID:', product);
            toast.error('Product is missing ID - please contact support');
            return;
        }

        if (!product.name) {
            console.error('❌ Cannot add product without name:', product);
            toast.error('Product is missing name - please contact support');
            return;
        }

        console.log('✅ Adding product to basket:', {
            id: product.id,
            name: product.name,
            batchId: product.batchId,
            batches: product.batches,
            totalStock: product.totalStock
        });

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
            setPendingProduct(product);
            setShowBatchModal(true);
            return;
        }

        // Determine initial unit - use the one on product if set, otherwise displayUnit
        // NORMALIZE unit to prevent case mismatch or 'null' vs 'undefined' issues
        const initialUnit = (product.unit || product.displayUnit || 'unit').toLowerCase();

        setBasketItems(prev => {
            // Check if item with same Drug ID AND Batch ID AND Unit exists
            const existingIndex = prev.findIndex(item => {
                const itemUnit = (item.unit || item.displayUnit || 'unit').toLowerCase();
                return item.id === product.id &&
                    item.batchId === targetBatchId &&
                    itemUnit === initialUnit;
            });

            if (existingIndex >= 0) {
                // Update existing item quantity
                console.log(`📦 Merging item: ${product.name} (Batch: ${targetBatchId}) - Old Qty: ${prev[existingIndex].qty}`);
                const newItems = [...prev];
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    qty: newItems[existingIndex].qty + 1
                };
                toast.success(`Added another unit of ${product.name}`);
                return newItems;
            }

            // Add new item
            console.log(`📦 Adding NEW item: ${product.name} (Batch: ${targetBatchId})`);
            const newBasketItem = {
                ...product,
                drugId: product.drugId || product.id, // Ensure drugId is set
                batchId: product.batchId || targetBatchId,
                unit: initialUnit, // Store normalized unit
                qty: 1,
                gstRate: product.gstRate ? Number(product.gstRate) : 5
            };

            console.log('📦 New basket item:', {
                id: newBasketItem.id,
                name: newBasketItem.name,
                drugId: newBasketItem.drugId,
                batchId: newBasketItem.batchId
            });

            return [...prev, newBasketItem];
        });
    };

    const handleEditBatch = (item: any, index: number) => {
        // For editing, we treat the item as the 'pendingProduct' so BatchModal knows what drug to fetch batches for
        setPendingProduct(item);
        setEditingBasketItemIndex(index);
        setShowBatchModal(true);
    };

    // Handle finding substitute medicines with same composition
    const handleFindSubstitute = (item: any, index: number) => {
        const drugId = item.drugId || item.id;
        if (!drugId) {
            toast.error('Cannot find substitutes: Drug ID missing');
            return;
        }
        setSubstituteForItem(item);
        setSubstituteItemIndex(index);
        setShowSubstituteFinder(true);
    };

    // Handle selecting a substitute from the finder
    const handleSubstituteSelect = (drug: any, batch: any) => {
        if (substituteItemIndex === null) return;

        // Replace the item in basket with the substitute
        const newItem = {
            id: drug.id,
            drugId: drug.id,
            name: drug.name,
            manufacturer: drug.manufacturer,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            stock: batch.currentQuantity,
            mrp: batch.mrp,
            qty: basketItems[substituteItemIndex].qty, // Keep same quantity
            discount: 0,
            gstRate: drug.gstRate || 5,
            type: 'RX',
            saltLinks: drug.saltLinks,
        };

        setBasketItems(prev => {
            const newItems = [...prev];
            newItems[substituteItemIndex] = newItem;
            return newItems;
        });

        toast.success(`Replaced with ${drug.name}`);
        setShowSubstituteFinder(false);
        setSubstituteForItem(null);
        setSubstituteItemIndex(null);
    };

    const handleBatchSelect = (batch: any) => {
        // CRITICAL: BatchModal returns batch.batchId (not batch.id) and batch.qty (not batch.quantityInStock)
        const actualBatchId = batch.batchId || batch.id;
        const actualStock = batch.qty !== undefined ? batch.qty : batch.quantityInStock;

        console.log('🔍 handleBatchSelect - batch data:', {
            batchId: actualBatchId,
            batchNumber: batch.batchNumber,
            mrp: batch.mrp,
            stock: actualStock,
            allBatchKeys: Object.keys(batch)
        });

        console.log('🔍 handleBatchSelect - pendingProduct:', {
            exists: !!pendingProduct,
            id: pendingProduct?.id,
            name: pendingProduct?.name,
            drugId: pendingProduct?.drugId
        });

        console.log('🔍 handleBatchSelect - editingBasketItemIndex:', editingBasketItemIndex);

        if (pendingProduct) {
            // Create the item object from the selected batch
            const newItem = {
                ...pendingProduct,
                batchId: actualBatchId, // ✅ Use actualBatchId (supports both batchId and id)
                batchNumber: batch.batchNumber,
                location: batch.location,
                stock: Number(actualStock), // ✅ Use actualStock (supports both qty and quantityInStock)
                expiryDate: batch.expiryDate,
                qty: editingBasketItemIndex !== null ? basketItems[editingBasketItemIndex].qty : 1,
                gstRate: pendingProduct.gstRate ? Number(pendingProduct.gstRate) : 5,
                mrp: batch.mrp || pendingProduct.mrp
            };

            setBasketItems(prev => {
                // CASE 1: Editing an existing item in the basket (changing batch)
                if (editingBasketItemIndex !== null) {
                    const newItems = [...prev];
                    const existingItem = newItems[editingBasketItemIndex];

                    console.log('🔍 BEFORE update - existingItem:', {
                        id: existingItem.id,
                        name: existingItem.name,
                        batchId: existingItem.batchId,
                        drugId: existingItem.drugId
                    });

                    // CRITICAL FIX: Only update batch-specific fields, preserve ALL other properties
                    // DO NOT spread newItem - it might not have id, name, drugId etc.
                    newItems[editingBasketItemIndex] = {
                        ...existingItem, // ✅ Keep everything (id, name, drugId, discount, etc.)
                        // Only override batch-specific fields:
                        batchId: actualBatchId, // ✅ Use actualBatchId (supports both batchId and id)
                        batchNumber: batch.batchNumber,
                        location: batch.location,
                        stock: Number(actualStock), // ✅ Use actualStock (supports both qty and quantityInStock)
                        expiryDate: batch.expiryDate,
                        mrp: batch.mrp || existingItem.mrp,
                        // qty is already in existingItem, no need to override
                    };

                    console.log('🔍 AFTER update - newItems[index]:', {
                        id: newItems[editingBasketItemIndex].id,
                        name: newItems[editingBasketItemIndex].name,
                        batchId: newItems[editingBasketItemIndex].batchId,
                        drugId: newItems[editingBasketItemIndex].drugId,
                        allKeys: Object.keys(newItems[editingBasketItemIndex])
                    });

                    toast.success(`Batch updated to ${batch.batchNumber}`);
                    return newItems;
                }

                const newItemWithUnit = {
                    ...newItem,
                    unit: newItem.unit || newItem.displayUnit || 'unit'
                };

                // CASE 2: Adding a new item (Duplicate Check)
                const existingIndex = prev.findIndex(item =>
                    item.id === newItemWithUnit.id &&
                    item.batchId === newItemWithUnit.batchId &&
                    (item.unit || item.displayUnit || 'unit') === newItemWithUnit.unit
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

                return [...prev, newItemWithUnit];
            });
        }
        setShowBatchModal(false);
        setPendingProduct(null);
        setEditingBasketItemIndex(null);
    };

    const handleCustomerSelect = (selectedCustomer: any) => {
        setCustomer(selectedCustomer);
        // Default Dispense For to "Self" (Patient = Customer)
        if (selectedCustomer) {
            setDispenseFor(selectedCustomer);
        }
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
                                type: 'RX',
                                baseUnit: item.drug.baseUnit,
                                displayUnit: item.drug.displayUnit,
                                unit: item.unit || item.drug.displayUnit,
                                conversionFactor: item.conversionFactor || item.drug.conversionFactor || 1,
                                unitConfigurations: item.drug.unitConfigurations
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
                                    type: 'RX',
                                    baseUnit: item.drug.baseUnit,
                                    displayUnit: item.drug.displayUnit,
                                    unit: item.unit || item.drug.displayUnit,
                                    conversionFactor: item.conversionFactor || item.drug.conversionFactor || 1,
                                    unitConfigurations: item.drug.unitConfigurations
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

                                const currentStock = Number(batch.baseUnitQuantity);
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
                                        type: 'RX',
                                        baseUnit: item.drug.baseUnit,
                                        displayUnit: item.drug.displayUnit,
                                        unit: item.unit || item.drug.displayUnit,
                                        conversionFactor: item.conversionFactor || item.drug.conversionFactor || 1,
                                        unitConfigurations: item.drug.unitConfigurations
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
                                    stock: Number(anyBatch.baseUnitQuantity),
                                    mrp: Number(anyBatch.mrp),
                                    qty: Number(item.quantityPrescribed) || 1, // Show requested
                                    discount: 0,
                                    gstRate: Number(item.drug.gstRate) || 5,
                                    type: 'RX',
                                    baseUnit: item.drug.baseUnit,
                                    displayUnit: item.drug.displayUnit,
                                    unit: item.unit || item.drug.displayUnit,
                                    conversionFactor: item.conversionFactor || item.drug.conversionFactor || 1,
                                    unitConfigurations: item.drug.unitConfigurations
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
                    // No substitutions or issues - silent success
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
        setBasketItems(prev => {
            const newItems = prev.filter((_, i) => i !== index);
            // Auto-unlink prescription if basket becomes empty
            if (newItems.length === 0 && linkedPrescriptionId) {
                setLinkedPrescriptionId(undefined);
                setActivePrescription(null);
                setDispenseFor(null);
                // No toast needed as it's an automatic side effect of clearing the list
            }
            return newItems;
        });
    };

    // Explicitly unlike prescription without clearing basket (for mixed baskets)
    const handleUnlinkPrescription = () => {
        setLinkedPrescriptionId(undefined);
        setActivePrescription(null);
        setDispenseFor(null);

        // CRITICAL: Clear URL parameters to prevent re-import on refresh
        window.history.replaceState({}, '', '/pos/new-sale');

        toast.success('Prescription unlinked');
    };

    const clearBasket = () => {
        setBasketItems([]);
        setCustomer(null);
        setLinkedPrescriptionId(undefined);
        setActivePrescription(null);
        setCurrentDraftId(null);
        setShouldCreateRefill(false);
        setOverallDiscount({ type: null, value: 0 });
        setDispenseFor(null);
        localStorage.removeItem('currentDraftId');
    };

    // Apply Overall Discount (stores for application in calculateTotals)
    const handleApplyOverallDiscount = (type: 'percentage' | 'amount', value: number) => {
        setOverallDiscount({ type, value });
        toast.success(`Overall ${type} discount of ${type === 'percentage' ? value + '%' : '₹' + value} applied`);
    };

    // Enhanced Financial Calculations with Correct GST
    const calculateTotals = () => {
        let totalMrp = 0;
        let totalItemDiscount = 0;
        let subtotalBeforeOverallDiscount = 0;

        // Step 1: Calculate item-level totals (MRP - Item Discount)
        basketItems.forEach((item: any) => {
            // Adjust MRP based on selected unit logic
            const factor = item.conversionFactor || 1;
            const unitAdjustedMrp = item.mrp / factor;

            const itemMrpTotal = item.qty * unitAdjustedMrp;
            const itemDiscount = item.discount || 0;
            const lineSubtotal = itemMrpTotal - itemDiscount;

            totalMrp += itemMrpTotal;
            totalItemDiscount += itemDiscount;
            subtotalBeforeOverallDiscount += lineSubtotal;
        });

        // Step 2: Apply overall discount to get discounted subtotal
        let overallDiscountAmount = 0;
        if (overallDiscount.type === 'percentage' && overallDiscount.value > 0) {
            overallDiscountAmount = (subtotalBeforeOverallDiscount * overallDiscount.value) / 100;
        } else if (overallDiscount.type === 'amount' && overallDiscount.value > 0) {
            overallDiscountAmount = Math.min(overallDiscount.value, subtotalBeforeOverallDiscount);
        }

        const subtotalAfterOverallDiscount = subtotalBeforeOverallDiscount - overallDiscountAmount;

        // Step 3: Calculate GST on discounted amount (item-by-item with proportional discount)
        let taxableValue = 0;
        let taxAmount = 0;
        const discountRatio = subtotalBeforeOverallDiscount > 0
            ? subtotalAfterOverallDiscount / subtotalBeforeOverallDiscount
            : 1;

        basketItems.forEach((item: any) => {
            // Recalculate per-item totals for GST distribution
            const factor = item.conversionFactor || 1;
            const unitAdjustedMrp = item.mrp / factor;

            const itemMrpTotal = item.qty * unitAdjustedMrp;
            const itemDiscount = item.discount || 0;
            const lineSubtotal = itemMrpTotal - itemDiscount;

            // Apply proportional overall discount to this item
            const lineAfterOverallDiscount = lineSubtotal * discountRatio;

            const gstRate = item.gstRate || 0;
            // Calculate taxable amount and tax from GST-inclusive price
            const lineTaxable = lineAfterOverallDiscount / (1 + gstRate / 100);
            const lineTax = lineAfterOverallDiscount - lineTaxable;

            taxableValue += lineTaxable;
            taxAmount += lineTax;
        });

        // Step 4: Calculate final total and round-off
        const netTotal = subtotalAfterOverallDiscount;
        const roundedTotal = Math.round(netTotal);
        const roundOff = roundedTotal - netTotal;

        return {
            totalMrp,
            totalDiscount: totalItemDiscount + overallDiscountAmount, // Combined discounts
            overallDiscountAmount, // Overall discount separate
            taxableValue: Math.round(taxableValue * 100) / 100, // Round to 2 decimals
            taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimals
            roundOff: Math.round(roundOff * 100) / 100, // Round to 2 decimals
            total: roundedTotal,
            subtotal: totalMrp,
            unroundedTotal: netTotal
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
            // Prepare sale items - GST is already included in MRP
            const items = basketItems.filter((item: any) => item.batchId).map((item: any) => {
                const factor = item.conversionFactor || 1;
                const unitAdjustedMrp = item.mrp / factor;

                const itemTotal = item.qty * unitAdjustedMrp;
                const itemDiscount = item.discount || 0;
                const netAmount = itemTotal - itemDiscount;
                const gstRate = item.gstRate || 0;

                // Extract GST from MRP (GST is inclusive)
                const taxableAmount = netAmount / (1 + gstRate / 100);

                return {
                    drugId: item.id,
                    batchId: item.batchId,
                    quantity: item.qty,
                    mrp: Number(unitAdjustedMrp), // Store actual unit price charged
                    discount: Number(itemDiscount),
                    gstRate: Number(gstRate),
                    lineTotal: Number(netAmount.toFixed(2)),
                    unit: item.unit || item.displayUnit || 'unit', // Track the unit sold
                    conversionFactor: Number(factor) // Track conversion factor used
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
            // STRICT SANITIZATION: Ensure prescriptionId is undefined if falsy (empty string, null, etc.)
            const finalPrescriptionId = linkedPrescriptionId || undefined;

            const saleData = {
                patientId: customer?.id || null,
                invoiceType: invoiceType.toUpperCase(), // Pass invoice type
                subtotal: Number(totals.subtotal.toFixed(2)),
                discountAmount: Number(totals.totalDiscount.toFixed(2)),
                taxAmount: Number(totals.taxAmount.toFixed(2)),
                roundOff: Number(totals.roundOff.toFixed(2)),
                total: Number((totals as any).unroundedTotal || totals.total),
                items,
                paymentSplits,
                prescriptionId: finalPrescriptionId, // Link to prescription if imported
                dispenseForPatientId: dispenseFor?.id || null, // Persist who it is dispensed for
                shouldCreateRefill, // Pass the flag to backend
                invoiceNumber, // Pass the invoice number (manually edited or auto-fetched)
            };

            // Ensure prescriptionId is undefined if null to match interface
            console.log('Creating sale with data:', {
                ...saleData,
                itemCount: saleData.items.length,
                hasCustomer: !!saleData.patientId,
                hasPrescription: !!saleData.prescriptionId,
                prescriptionIdValue: saleData.prescriptionId, // Explicitly log value
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

                // Set sale ID for success screen (for PDF printing)
                setLastSaleId(response.id);
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


    const handleNewSale = async () => {
        setShowSuccess(false);
        clearBasket();
        setCustomer(null);
        setDispenseFor(null);
        setLinkedPrescriptionId(undefined);
        setActivePrescription(null);
        setLastSaleId(null);
        setSaleId(`S-2025-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`);

        // CRITICAL: Clear URL parameters to prevent re-import if user starts new sale after importing
        window.history.replaceState({}, '', '/pos/new-sale');

        // Fetch next invoice number for the new sale
        try {
            const response = await salesApi.getNextInvoiceNumber();
            if (response && response.nextInvoiceNumber) {
                setInvoiceNumber(response.nextInvoiceNumber);
            }
        } catch (error) {
            console.error('Failed to fetch next invoice number:', error);
        }
    };

    const handleSplitPaymentConfirm = async (splits: any) => {
        // Check if credit is used and customer is required
        if (splits.credit && splits.credit > 0 && !customer) {
            toast.error('Customer Required for Credit Payment!');
            toast.info("Please add a customer before using credit");
            return;
        }

        console.log('Split payment confirmed:', splits);
        setShowSplitPayment(false);
        await handleFinalize('SPLIT', splits);
    };

    return (
        <div className="h-full flex flex-col bg-[#f8fafc] relative overflow-hidden">
            <POSHeader
                saleId={saleId}
                onOpenCustomer={() => setShowCustomerModal(true)}
                onOpenPrescription={() => setShowImportPanel(prev => !prev)}
                activePrescription={activePrescription}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Main POS Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Left Panel - Product Search & Basket */}
                        <div className="w-[65%] flex flex-col border-r border-[#e2e8f0] min-h-0 relative">
                            {/* Prescription Import Panel - Horizontal Overlay (Scoped to Search Width) */}
                            {showImportPanel && (
                                <div className="absolute top-0 left-0 right-0 z-50">
                                    <PrescriptionImportPanel
                                        onSelect={handleImportPrescription}
                                        onClose={() => setShowImportPanel(false)}
                                    />
                                </div>
                            )}
                            {/* Hybrid Context Banner */}
                            <PrescriptionBanner
                                prescription={activePrescription}
                                onClear={handleUnlinkPrescription}
                            />

                            <div data-tour="pos-search">
                                <ProductSearch
                                    onAddProduct={addToBasket}
                                    searchFocus={searchFocus}
                                    setSearchFocus={setSearchFocus}
                                    onManualScan={handleScan}
                                    onScanClick={() => setShowScanner(true)}
                                />
                            </div>
                            <QuickAddGrid onAddProduct={addToBasket} storeId={storeId} />

                            <div data-tour="pos-cart" className="flex-1 min-h-0 flex flex-col">
                                <Basket
                                    items={basketItems}
                                    onUpdateItem={updateBasketItem}
                                    onRemoveItem={removeBasketItem}
                                    onClear={clearBasket}
                                    onEditBatch={handleEditBatch}
                                    onFindSubstitute={handleFindSubstitute}
                                />
                            </div>
                        </div>

                        {/* Right Panel - 35% */}
                        <div className="w-[35%] bg-white flex flex-col min-h-0" data-tour="pos-payment">
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
                                overallDiscount={overallDiscount}
                                onOpenDiscount={() => {/* handled in PaymentPanel */ }}
                                onSaveDraft={() => saveDraft(false)}
                                onViewInvoices={() => router.push('/pos/invoices')}
                                totals={totals}
                                dispenseFor={dispenseFor}
                                onDispenseForChange={setDispenseFor}
                            />
                        </div>
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
                        saleData={{ invoiceNo: saleId, total: totals.total, method: 'cash', saleId: lastSaleId }}
                        onNewSale={handleNewSale}
                        onClose={handleNewSale}
                    />
                )}
                {showScanner && (
                    <BarcodeScannerModal
                        onClose={() => setShowScanner(false)}
                        onScan={handleScan}
                    />
                )}
                {showSubstituteFinder && substituteForItem && (
                    <SubstituteFinder
                        drugId={substituteForItem.drugId || substituteForItem.id}
                        drugName={substituteForItem.name}
                        storeId={storeId}
                        onSelect={handleSubstituteSelect}
                        onClose={() => {
                            setShowSubstituteFinder(false);
                            setSubstituteForItem(null);
                            setSubstituteItemIndex(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
