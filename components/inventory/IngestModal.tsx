'use client';

import React, { useState, useCallback } from 'react';
import { SaltOCRService } from '@/lib/salt-intelligence/ocr-service';
import { SaltSuggestionService, SuggestedSalt } from '@/lib/salt-intelligence/salt-suggestion-service';
import { medicineSearchAdapter } from '@/lib/search/medicineSearchAdapter';
import { scanApi } from '@/lib/api/scan';
import { inventoryApi } from '@/lib/api/inventory';
import { medicineApi } from '@/lib/api/medicineApi';
import { supplierApi } from '@/lib/api/supplier';
import type { Medicine } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiLoader, FiUpload, FiPlus, FiTrash2, FiCheckCircle, FiX, FiSearch, FiPackage, FiDollarSign, FiCalendar, FiTruck, FiCheck, FiChevronDown, FiDroplet, FiCircle, FiInfo, FiZap } from 'react-icons/fi';
import { BsUpcScan, BsCapsule } from 'react-icons/bs';
import { RiSyringeLine, RiMedicineBottleLine } from 'react-icons/ri';
import AdvancedCamera from '@/components/camera/AdvancedCamera';
import SaltSuggestions from './SaltSuggestions';
import DuplicateDetectedModal from './DuplicateDetectedModal';
import SimilarMedicineWarning from './SimilarMedicineWarning';
import SupplierDrawer from '@/components/suppliers/SupplierDrawer';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import UploadProgressOverlay from './UploadProgressOverlay';

const BarcodeScannerModal = dynamic(() => import('@/components/pos/BarcodeScannerModal'), { ssr: false });

// Modal States
enum ModalState {
  SEARCH_INITIAL = 'SEARCH_INITIAL',
  EXISTING_WITH_BATCHES = 'EXISTING_WITH_BATCHES',
  EXISTING_NO_BATCHES = 'EXISTING_NO_BATCHES',
  NEW_MEDICINE = 'NEW_MEDICINE',
}

interface SaltEntry {
  id: string;
  name: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  saltId?: string;
}

interface MedicineFormData {
  name: string;
  manufacturer: string;
  form: string;
  hsnCode: string;
  gstRate: number;
  requiresPrescription: boolean;
}

interface BatchFormData {
  batchNumber: string;
  purchaseRate: string;
  mrp: string;
  quantity: string;
  expiryDate: string;
  supplierId: string;
  unit: string;
  packSize: string;
  secondaryPackSize?: string; // For Box: size of individual containers (ML per bottle, tablets per strip, etc.)
  innerUnit?: string; // e.g., Strip, Bottle, Tube
  location: string;
}

interface AddedMedicine {
  id: string; // Internal queue ID
  drugId?: string; // Real database ID if existing
  formData: MedicineFormData;
  salts: SaltEntry[];
  batches: BatchFormData[]; // Changed from batchData to batches array
  status: 'editing' | 'complete' | 'minimized';
  createdAt: Date;
}

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  returnPath?: string;
}

export default function IngestModal({ isOpen, onClose, onSuccess, returnPath }: IngestModalProps) {
  const { primaryStore } = useAuthStore();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing' | 'extracting' | 'complete'>('uploading');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [salts, setSalts] = useState<SaltEntry[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    manufacturer: '',
    form: 'Tablet',
    hsnCode: '',
    gstRate: 5,
    requiresPrescription: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search helper state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedFromCatalog, setSelectedFromCatalog] = useState<Medicine | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null); // Add ref for input

  // Batch details state - now supports multiple batches
  const [batches, setBatches] = useState<BatchFormData[]>([{
    batchNumber: '',
    purchaseRate: '',
    mrp: '',
    quantity: '',
    expiryDate: '',
    supplierId: '',
    unit: 'Box',
    innerUnit: 'Strip',
    packSize: '10',
    secondaryPackSize: '10',
    location: '',
  }]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number>(0);

  // State machine
  const [modalState, setModalState] = useState<ModalState>(ModalState.SEARCH_INITIAL);
  const [existingBatches, setExistingBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [createNewBatch, setCreateNewBatch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingDetection, setLoadingDetection] = useState(false);

  // Multi-medicine state
  const [addedMedicines, setAddedMedicines] = useState<AddedMedicine[]>([]);
  const [currentMedicineIndex, setCurrentMedicineIndex] = useState<number | null>(null);
  const [showAddedMedicines, setShowAddedMedicines] = useState(true);

  const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarMedicines, setSimilarMedicines] = useState<any[]>([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Inline confirm state

  // Supplier state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showSupplierDrawer, setShowSupplierDrawer] = useState(false);
  const [showOtherFormInput, setShowOtherFormInput] = useState(false);
  const [editingSaltId, setEditingSaltId] = useState<string | null>(null);

  // Common medicine forms for quick selection
  const commonForms = [
    { label: 'Tablet', icon: <FiCircle className="w-5 h-5" /> },
    { label: 'Capsule', icon: <BsCapsule className="w-5 h-5" /> },
    { label: 'Syrup', icon: <FiDroplet className="w-5 h-5" /> },
    { label: 'Injection', icon: <RiSyringeLine className="w-5 h-5" /> },
    { label: 'Cream', icon: <RiMedicineBottleLine className="w-5 h-5" /> },
    { label: 'Other', icon: <FiPlus className="w-5 h-5" /> }
  ];

  // Comprehensive list for "Other" forms
  const otherFormsList = [
    'Drops', 'Ointment', 'Gel', 'Spray', 'Powder', 'Inhaler', 'Lotion',
    'Suspension', 'Patch', 'Suppository', 'Sachet', 'Vial', 'Ampoule',
    'Pen', 'Liquid', 'Foam', 'Granules', 'Pellets', 'Solution'
  ].sort();

  // Keyboard navigation for search results
  const [selectedSearchIndex, setSelectedSearchIndex] = useState<number>(0);

  // Get storeId from auth store
  const storeId = primaryStore?.id || '';
  const router = useRouter();

  // Keyboard navigation hook
  const { handleKeyDown: handleEnterNavigation } = useKeyboardNavigation();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleSubmit();
      }

      // Arrow key navigation for search results
      if (showSearchResults && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSearchIndex(prev =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSearchIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
          e.preventDefault();
          handleSelectFromCatalog(searchResults[selectedSearchIndex]);
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Fetch suppliers when modal opens
      fetchSuppliers();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showSearchResults, searchResults, selectedSearchIndex]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await supplierApi.getSuppliers({ limit: 100 });
      console.log('📦 Suppliers response:', response);
      if (response && response.data) {
        // Handle both paginated response inside data, or direct array inside data
        const suppliersList = Array.isArray(response.data) ? response.data :
          (response.data.suppliers && Array.isArray(response.data.suppliers)) ? response.data.suppliers : [];
        setSuppliers(suppliersList);
      } else if (Array.isArray(response)) {
        setSuppliers(response);
      }
    } catch (error) {
      toast.error('Failed to load suppliers. Please refresh the page.', {
        duration: 10000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    setErrors([]);
    setProcessing(true);
    setUploadProgress(0);
    setUploadStage('uploading');

    try {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(['Image file is too large. Please use an image under 10MB.']);
        setProcessing(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(['Please upload a valid image file.']);
        setProcessing(false);
        return;
      }

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 30) {
            clearInterval(uploadInterval);
            return 30;
          }
          return prev + 10;
        });
      }, 100);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setUploadProgress(35);
        setUploadStage('processing');
      };
      reader.readAsDataURL(file);

      // Simulate processing stages
      setTimeout(() => {
        setUploadProgress(50);
      }, 500);

      setTimeout(() => {
        setUploadProgress(70);
        setUploadStage('extracting');
      }, 1000);

      try {
        const result = await SaltOCRService.processImage(file);
        setUploadProgress(90);

        if (result.error) {
          console.warn('OCR processing failed:', result.error);
          setErrors(['Could not extract composition automatically. Please add salts manually below.']);
        } else {
          setOcrConfidence(result.confidence);

          if (result.medicineName || result.manufacturer || result.form) {
            setFormData(prev => ({
              ...prev,
              name: result.medicineName || prev.name,
              manufacturer: result.manufacturer || prev.manufacturer,
              form: result.form || prev.form,
            }));
          }

          const saltEntries: SaltEntry[] = result.extractedSalts.map((salt, index) => ({
            id: `salt-${index}`,
            name: salt.name,
            strengthValue: salt.strengthValue,
            strengthUnit: salt.strengthUnit,
            confidence: salt.confidence,
          }));

          if (saltEntries.length > 0) {
            setSalts(saltEntries);
            setErrors([]);
          } else {
            setErrors(['No composition detected in image. Please add salts manually below.']);
          }
        }
      } catch (ocrError) {
        console.warn('OCR error:', ocrError);
        setErrors(['Image uploaded successfully. Please add salt composition manually below.']);
      }

      // Complete animation
      setUploadProgress(100);
      setUploadStage('complete');

      // Hide overlay after completion
      setTimeout(() => {
        setProcessing(false);
      }, 1000);
    } catch (error) {
      setErrors(['Failed to upload image. Please try again.']);
      setProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  const handleCameraPhoto = (photoDataUrl: string) => {
    setShowCamera(false);
    setImage(photoDataUrl);
    setProcessing(true);

    fetch(photoDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        handleImageUpload(file);
      })
      .catch(err => {
        console.error('Failed to process camera photo:', err);
        setErrors(['Failed to process camera photo. Please try again.']);
        setProcessing(false);
      });
  };

  const addSaltRow = () => {
    const newId = `salt-${Date.now()}`;
    setSalts([
      ...salts,
      {
        id: newId,
        name: '',
        strengthValue: null,
        strengthUnit: null,
        confidence: 'LOW',
      },
    ]);
    setShowSuggestions(false);
    setEditingSaltId(newId); // Immediately focus on the new salt
  };

  const removeSaltRow = (id: string) => {
    setSalts(salts.filter((s) => s.id !== id));
  };

  const updateSalt = (id: string, field: keyof SaltEntry, value: any) => {
    setSalts(
      salts.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  // Debounced search - wait 400ms after user stops typing
  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setLoadingDetection(false);
      return;
    }

    // Don't set loading immediately - prevents input re-render
    const timeoutId = setTimeout(async () => {
      setLoadingDetection(true); // Set loading inside timeout
      try {
        const results = await medicineSearchAdapter.search(searchQuery, { limit: 50 });

        // Enhanced sorting with intelligent word matching
        const query = searchQuery.trim().toLowerCase();
        const queryWords = query.split(/\s+/).filter(w => w.length > 0); // Tokenize query

        const sorted = results.sort((a, b) => {
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          const aManufacturer = (a.manufacturerName || '').toLowerCase();
          const bManufacturer = (b.manufacturerName || '').toLowerCase();

          // Score calculation
          let aScore = 0;
          let bScore = 0;

          // 1. EXACT match (highest priority) = 10000 points
          if (aName === query) aScore += 10000;
          if (bName === query) bScore += 10000;

          // 2. Starts with query = 5000 points
          if (aName.startsWith(query)) aScore += 5000;
          if (bName.startsWith(query)) bScore += 5000;

          // 3. Contains query as substring = 2000 points
          if (aName.includes(query)) aScore += 2000;
          if (bName.includes(query)) bScore += 2000;

          // 4. ALL query words present (any order) = 1000 points
          const aHasAllWords = queryWords.every(word =>
            aName.includes(word) || aManufacturer.includes(word)
          );
          const bHasAllWords = queryWords.every(word =>
            bName.includes(word) || bManufacturer.includes(word)
          );
          if (aHasAllWords) aScore += 1000;
          if (bHasAllWords) bScore += 1000;

          // 5. Word match count = 200 points per word
          const aWordMatches = queryWords.filter(word =>
            aName.includes(word) || aManufacturer.includes(word)
          ).length;
          const bWordMatches = queryWords.filter(word =>
            bName.includes(word) || bManufacturer.includes(word)
          ).length;
          aScore += aWordMatches * 200;
          bScore += bWordMatches * 200;

          // 6. Word starts with query word = 100 points per word
          queryWords.forEach(word => {
            if (aName.split(/\s+/).some(w => w.startsWith(word))) aScore += 100;
            if (bName.split(/\s+/).some(w => w.startsWith(word))) bScore += 100;
          });

          // 7. Manufacturer match = 50 points
          if (aManufacturer.includes(query)) aScore += 50;
          if (bManufacturer.includes(query)) bScore += 50;

          // 8. API score (backend relevance) = 0-1 range
          const aApiScore = a.score || 0;
          const bApiScore = b.score || 0;
          aScore += aApiScore;
          bScore += bApiScore;

          return bScore - aScore;
        });

        setSearchResults(sorted);
        setShowSearchResults(sorted.length > 0);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setLoadingDetection(false);
        // Restore focus after search completes
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Search input handler - wrapped in useCallback to prevent re-renders
  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedSearchIndex(0); // Reset to first item on new search
  }, []);

  // Smart catalog detection - determines what to show based on existing data
  const handleSelectFromCatalog = async (medicine: Medicine) => {
    // AUTO-SAVE: If the current form has valid data, save it to queue first
    const { isValid } = validateForm(formData, salts, batches);
    if (isValid) {
      const currentMedicine: AddedMedicine = {
        id: `med-${Date.now()}`,
        drugId: medicine.id,
        formData: { ...formData },
        salts: [...salts],
        batches: [...batches],
        status: 'complete', // Mark as complete
        createdAt: new Date(),
      };
      setAddedMedicines(prev => [...prev, currentMedicine]);
      toast.info('Previous medicine saved to queue');
    } else if (formData.name && formData.name.trim()) {
      // Form has some data but is invalid - confirm with user or just warn?
      // User explicitly asked to fix "validation error can be bypassed". 
      // So we strictly DO NOT save if invalid. 
      // We might want to clear the form so the new medicine can load cleanly.
      // Or we could rely on the fact that handleSelectFromCatalog overwrites the state.
      // Let's just log or show a small toast that previous work was discarded?
      // Actually, if it's invalid, it's probably just abandoned search input.
    }

    setSelectedFromCatalog(medicine);
    setSearchQuery(''); // Clear search after selection
    setShowSearchResults(false);
    setLoadingDetection(true);

    try {
      // Fetch existing batches for this medicine
      const batchResponse = await inventoryApi.getBatches({
        drugId: medicine.id,
        limit: 100
      });

      const batches = (batchResponse as any).data || (batchResponse as any).batches || [];
      const activeBatches = batches.filter((b: any) => Number(b.baseUnitQuantity) >= 0);

      setExistingBatches(activeBatches);

      // Fetch full details including HSN and GST
      let fullMedicine: any = medicine;
      try {
        const details = await medicineApi.getMedicineById(medicine.id);
        if (details) {
          fullMedicine = { ...medicine, ...details };
        }
      } catch (err) {
        toast.error('Failed to load medicine details. Please refresh.', {
          duration: 10000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        });
        setLoadingDetection(false);
        return;
      }

      // Auto-fill medicine details from catalog
      setFormData({
        ...formData,
        name: fullMedicine.name || '',
        manufacturer: fullMedicine.manufacturerName || '',
        form: fullMedicine.type || fullMedicine.form || formData.form,
        hsnCode: fullMedicine.hsnCode || '',
        gstRate: fullMedicine.gstRate ? Number(fullMedicine.gstRate) : 5,
        requiresPrescription: fullMedicine.requiresPrescription || false,
      });

      // Populate Salts from Master
      if (fullMedicine.saltLinks && Array.isArray(fullMedicine.saltLinks) && fullMedicine.saltLinks.length > 0) {
        setSalts(fullMedicine.saltLinks.map((link: any, idx: number) => ({
          id: `salt-${Date.now()}-${idx}`,
          saltId: link.saltId,
          name: link.name || link.saltName || '',
          strengthValue: link.strengthValue,
          strengthUnit: link.strengthUnit,
          confidence: 'HIGH'
        })));
      }

      // Populate Batch Defaults (Pack Size, Unit)
      // Logic: If form is Tablet/Capsule, default to Strip. Else Bottle/etc.
      const defaultUnit = fullMedicine.defaultUnit ||
        (fullMedicine.form === 'Tablet' || fullMedicine.form === 'Capsule' ? 'Strip' :
          fullMedicine.form === 'Syrup' || fullMedicine.form === 'Suspension' ? 'Bottle' : 'Box');

      const newBatches = [...batches];

      // Ensure we have at least one batch entry
      if (newBatches.length === 0) {
        newBatches.push({
          batchNumber: '',
          purchaseRate: '',
          mrp: '',
          quantity: '',
          expiryDate: '',
          supplierId: '',
          unit: defaultUnit,
          packSize: (fullMedicine.packSize || fullMedicine.tabletsPerStrip || '10').toString(),
          location: fullMedicine.location || '',
        });
      } else {
        newBatches[0] = {
          ...newBatches[0],
          // Use master pack size or default to 10
          packSize: (fullMedicine.packSize || fullMedicine.tabletsPerStrip || '10').toString(),
          unit: defaultUnit,
          // If we have a default location in master/store overlay, use it
          location: fullMedicine.location || newBatches[0]?.location || ''
        };
      }
      setBatches(newBatches);

      // Determine state based on batches
      if (activeBatches.length > 0) {
        setModalState(ModalState.EXISTING_WITH_BATCHES);
        toast.success(`Found ${activeBatches.length} existing batch${activeBatches.length > 1 ? 'es' : ''}`);
      } else {
        setModalState(ModalState.EXISTING_NO_BATCHES);
        toast.info('Medicine found in catalog. Add first batch.');
      }
    } catch (error) {
      console.error('❌ Catalog loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);

      toast.error(`Failed to load catalog data: ${errorMessage}. Please refresh.`, {
        duration: 10000,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
      setLoadingDetection(false);
    } finally {
      setLoadingDetection(false); // Always clear loading state
    }
  };

  // Barcode scan handler (copied from POS logic)
  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    const toastId = toast.loading('Scanning...');

    try {
      // Use same API as POS to lookup barcode
      const scannedItem = await scanApi.processScan(barcode);

      if (scannedItem && scannedItem.drugId) {
        toast.dismiss(toastId);
        toast.success(`Found: ${scannedItem.drugName}`);

        // Fetch full medicine details and trigger catalog detection
        const medicine: Medicine = {
          id: scannedItem.drugId,
          name: scannedItem.drugName,
          manufacturerName: scannedItem.manufacturer || '',
          type: scannedItem.form || 'Tablet',
          requiresPrescription: false,
        } as Medicine;

        await handleSelectFromCatalog(medicine);
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Barcode scan failed:', error);

      // Barcode not found - offer to add as new
      const shouldAdd = confirm(`Barcode "${barcode}" not found in catalog. Add as new medicine?`);
      if (shouldAdd) {
        setModalState(ModalState.NEW_MEDICINE);
        // Could pre-fill barcode field if we had one
        toast.info('Enter medicine details to add new item');
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestedSalt) => {
    setSalts([
      ...salts,
      {
        id: `salt-${Date.now()}`,
        name: suggestion.name,
        strengthValue: suggestion.strength || null,
        strengthUnit: suggestion.unit || null,
        confidence: suggestion.confidence,
      },
    ]);
    setShowSuggestions(false);
  };

  // Check for duplicates before submit
  const checkForDuplicates = async () => {
    if (!formData.name || !storeId) return null;

    setCheckingDuplicate(true);
    try {
      const response = await fetch('/api/v1/drugs/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: formData.name,
          manufacturer: formData.manufacturer,
          form: formData.form,
          saltLinks: salts.map((s, i) => ({
            name: s.name,
            strengthValue: s.strengthValue,
            strengthUnit: s.strengthUnit,
            order: i
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error('Duplicate check failed:', error);
    } finally {
      setCheckingDuplicate(false);
    }
    return null;
  };

  const validateForm = (
    currentFormData: MedicineFormData,
    currentSalts: SaltEntry[],
    currentBatches: BatchFormData[]
  ): { isValid: boolean; validationErrors: string[]; newFieldErrors: Record<string, string> } => {
    const validationErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    // ===== MEDICINE VALIDATION =====
    if (!currentFormData.name || !currentFormData.name.trim()) {
      validationErrors.push('Medicine name is required');
      newFieldErrors.name = 'Medicine name is required';
    } else if (currentFormData.name.trim().length < 2) {
      validationErrors.push('Medicine name must be at least 2 characters');
      newFieldErrors.name = 'Name must be at least 2 characters';
    }

    if (currentFormData.manufacturer && currentFormData.manufacturer.trim().length < 2) {
      validationErrors.push('Manufacturer name must be at least 2 characters');
      newFieldErrors.manufacturer = 'Manufacturer name too short';
    }

    // ===== SALT COMPOSITION VALIDATION =====
    // Salt composition is now OPTIONAL - users can submit medicines without salts
    // if (currentSalts.length === 0) {
    //   validationErrors.push('Please add at least one salt composition');
    //   newFieldErrors.salts = 'At least one salt is required';
    // }

    currentSalts.forEach((salt, index) => {
      if (!salt.name || !salt.name.trim()) {
        validationErrors.push(`Salt ${index + 1}: Name is required`);
      }

      if (salt.strengthValue !== null) {
        if (salt.strengthValue <= 0) {
          validationErrors.push(`Salt ${index + 1}: Strength must be greater than 0`);
        }
        if (!salt.strengthUnit || !salt.strengthUnit.trim()) {
          validationErrors.push(`Salt ${index + 1}: Unit is required when strength is provided`);
        }
      }
    });

    // ===== BATCH VALIDATION =====
    if (currentBatches.length === 0) {
      validationErrors.push('At least one batch is required');
    }

    currentBatches.forEach((currentBatchData, index) => {
      const batchPrefix = currentBatches.length > 1 ? `Batch #${index + 1}: ` : '';

      if (!currentBatchData.batchNumber || !currentBatchData.batchNumber.trim()) {
        validationErrors.push(`${batchPrefix}Batch number is required`);
        if (index === 0) newFieldErrors.batchNumber = 'Batch number is required';
      } else if (currentBatchData.batchNumber.trim().length < 3) {
        validationErrors.push(`${batchPrefix}Batch number must be at least 3 characters`);
      }

      if (!currentBatchData.purchaseRate || parseFloat(currentBatchData.purchaseRate) <= 0) {
        validationErrors.push(`${batchPrefix}Purchase rate must be greater than 0`);
        if (index === 0) newFieldErrors.purchaseRate = 'Must be > 0';
      }

      if (!currentBatchData.mrp || parseFloat(currentBatchData.mrp) <= 0) {
        validationErrors.push(`${batchPrefix}MRP must be greater than 0`);
        if (index === 0) newFieldErrors.mrp = 'Must be > 0';
      } else if (parseFloat(currentBatchData.mrp) < parseFloat(currentBatchData.purchaseRate || '0')) {
        validationErrors.push(`${batchPrefix}MRP must be ≥ Purchase Rate`);
        if (index === 0) newFieldErrors.mrp = 'MRP must be ≥ Purchase Rate';
      }

      if (!currentBatchData.quantity || parseInt(currentBatchData.quantity) <= 0) {
        validationErrors.push(`${batchPrefix}Quantity must be greater than 0`);
        if (index === 0) newFieldErrors.quantity = 'Must be > 0';
      }

      // Expiry date validation (MM/YYYY format)
      if (!currentBatchData.expiryDate || !currentBatchData.expiryDate.trim()) {
        validationErrors.push(`${batchPrefix}Expiry date is required`);
        if (index === 0) newFieldErrors.expiryDate = 'Expiry date is required';
      } else {
        const expiryPattern = /^(0[1-9]|1[0-2])\/(\d{4})$/;
        if (!expiryPattern.test(currentBatchData.expiryDate)) {
          validationErrors.push(`${batchPrefix}Expiry date must be in MM/YYYY format`);
          if (index === 0) newFieldErrors.expiryDate = 'Use MM/YYYY format (e.g., 03/2025)';
        } else {
          const [month, year] = currentBatchData.expiryDate.split('/');
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);

          if (monthNum < 1 || monthNum > 12) {
            validationErrors.push(`${batchPrefix}Month must be between 01-12`);
            if (index === 0) newFieldErrors.expiryDate = 'Invalid month (01-12)';
          } else if (yearNum < 2000 || yearNum > 2100) {
            validationErrors.push(`${batchPrefix}Year must be a 4-digit number`);
            if (index === 0) newFieldErrors.expiryDate = 'Invalid year';
          } else {
            const expiryDate = new Date(yearNum, monthNum - 1, 1);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (expiryDate <= today) {
              validationErrors.push(`${batchPrefix}Expiry date must be in the future`);
              if (index === 0) newFieldErrors.expiryDate = 'Must be future date';
            }
          }
        }
      }

      // Supplier
      if (!currentBatchData.supplierId || !currentBatchData.supplierId.trim()) {
        validationErrors.push(`${batchPrefix}Supplier is required`);
        if (index === 0) newFieldErrors.supplierId = 'Supplier is required';
      }
    });

    // Check for duplicate batch numbers within the same medicine
    const batchNumbers = currentBatches.map(b => b.batchNumber?.trim()).filter(Boolean);
    const duplicates = batchNumbers.filter((num, idx) => batchNumbers.indexOf(num) !== idx);
    if (duplicates.length > 0) {
      validationErrors.push(`Duplicate batch numbers detected: ${[...new Set(duplicates)].join(', ')}`);
    }


    return { isValid: validationErrors.length === 0, validationErrors, newFieldErrors };
  };

  const handleSubmit = async () => {
    setErrors([]);
    setFieldErrors({});

    const { isValid, validationErrors, newFieldErrors } = validateForm(formData, salts, batches);

    // Stop if there are validation errors
    if (!isValid) {
      setErrors(validationErrors);
      setFieldErrors(newFieldErrors);
      toast.error(`Please fix ${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''}`);
      return;
    }

    // ===== ADD TO QUEUE (NOT DATABASE) =====
    const newMedicine: AddedMedicine = {
      id: `med-${Date.now()}`,
      drugId: selectedFromCatalog?.id,
      formData: { ...formData },
      salts: [...salts],
      batches: [...batches],
      status: 'complete',
      createdAt: new Date(),
    };

    // Check for duplicates in the queue
    const duplicate = addedMedicines.find(med =>
      med.formData.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
      med.formData.manufacturer.toLowerCase().trim() === formData.manufacturer.toLowerCase().trim() &&
      med.formData.form.toLowerCase().trim() === formData.form.toLowerCase().trim()
    );

    if (duplicate) {
      toast.error(`❌ "${formData.name}" by ${formData.manufacturer} is already in the queue!`, {
        duration: 4000,
        description: 'Remove it first or edit the existing entry if you want to add more batches.'
      });
      return;
    }

    setAddedMedicines(prev => [...prev, newMedicine]);
    clearCurrentForm();
    setSearchQuery('');

    toast.success(`✓ Medicine added to queue! (${addedMedicines.length + 1} total)`, { duration: 2000 });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Multi-medicine handlers
  const clearCurrentForm = () => {
    setFormData({ name: '', manufacturer: '', form: 'Tablet', hsnCode: '', gstRate: 12, requiresPrescription: false });
    setSalts([]);
    setBatches([{ batchNumber: '', purchaseRate: '', mrp: '', quantity: '', expiryDate: '', supplierId: '', unit: 'Tablet', packSize: '10', location: '' }]);
    setActiveBatchIndex(0);
    setImage(null);
    setFieldErrors({});
    setCurrentMedicineIndex(null);
    setSimilarMedicines([]); // Clear similar medicines warning
    setDuplicateCheckResult(null); // Clear duplicate check result
    setShowOtherFormInput(false); // Reset other form state
    setShowClearConfirm(false); // Disable confirm mode
  };

  // Auto-save current form to queue before starting new medicine
  const autoSaveCurrentMedicine = () => {
    // Only auto-save if there's actual data and not already in edit mode
    // AND IF IT IS VALID
    if (currentMedicineIndex === null) {
      const { isValid } = validateForm(formData, salts, batches);

      if (isValid) {
        // Check for duplicates
        const duplicate = addedMedicines.find(med =>
          med.formData.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
          med.formData.manufacturer.toLowerCase().trim() === formData.manufacturer.toLowerCase().trim() &&
          med.formData.form.toLowerCase().trim() === formData.form.toLowerCase().trim()
        );

        if (duplicate) {
          toast.error(`❌ "${formData.name}" is already in queue!`);
          return false;
        }

        const newMedicine: AddedMedicine = {
          id: `med-${Date.now()}`,
          formData: { ...formData },
          salts: [...salts],
          batches: [...batches],
          status: 'complete',
          createdAt: new Date(),
        };
        setAddedMedicines(prev => [...prev, newMedicine]);
        toast.success(`Medicine saved to queue (${addedMedicines.length + 1} total)`);
        return true;
      }
    }
    return false;
  };

  // ===== BATCH MANAGEMENT FUNCTIONS =====
  const updateCurrentBatch = (field: keyof BatchFormData, value: string) => {
    const newBatches = [...batches];
    newBatches[activeBatchIndex] = { ...newBatches[activeBatchIndex], [field]: value };
    setBatches(newBatches);
  };

  const addNewBatch = () => {
    const lastBatch = batches[batches.length - 1];
    const newBatch: BatchFormData = {
      batchNumber: '',
      quantity: '',
      expiryDate: '',
      // Smart defaults from last batch
      supplierId: lastBatch.supplierId,
      mrp: lastBatch.mrp,
      purchaseRate: lastBatch.purchaseRate,
      location: lastBatch.location,
      unit: lastBatch.unit,
      innerUnit: lastBatch.innerUnit || 'Strip',
      packSize: lastBatch.packSize,
      secondaryPackSize: lastBatch.secondaryPackSize,
    };
    setBatches([...batches, newBatch]);
    setActiveBatchIndex(batches.length); // Switch to the new batch
    toast.success('New batch added - same supplier & pricing auto-filled');
  };

  const removeBatch = (index: number) => {
    if (batches.length === 1) {
      toast.error('Cannot remove the last batch');
      return;
    }
    const newBatches = batches.filter((_, i) => i !== index);
    setBatches(newBatches);
    // Adjust active index if needed
    if (activeBatchIndex >= newBatches.length) {
      setActiveBatchIndex(newBatches.length - 1);
    } else if (activeBatchIndex > index) {
      setActiveBatchIndex(activeBatchIndex - 1);
    }
    toast.success('Batch removed');
  };


  const handleSaveAndAddAnother = () => {
    // Check for duplicates
    const duplicate = addedMedicines.find(med =>
      med.formData.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
      med.formData.manufacturer.toLowerCase().trim() === formData.manufacturer.toLowerCase().trim() &&
      med.formData.form.toLowerCase().trim() === formData.form.toLowerCase().trim()
    );

    if (duplicate) {
      toast.error(`❌ "${formData.name}" is already in queue!`);
      return;
    }

    const newMedicine: AddedMedicine = {
      id: `med-${Date.now()}`,
      formData: { ...formData },
      salts: [...salts],
      batches: [...batches],
      status: 'complete',
      createdAt: new Date(),
    };
    setAddedMedicines(prev => [...prev, newMedicine]);
    clearCurrentForm();
    toast.success(`Added! Total: ${addedMedicines.length + 1}`);
  };

  // Handle starting a new medicine (auto-save previous if exists)
  const handleStartNewMedicine = () => {
    autoSaveCurrentMedicine();
    clearCurrentForm();
  };

  const handleEditMedicine = (index: number) => {
    const med = addedMedicines[index];
    setFormData(med.formData);
    setSalts(med.salts);
    setBatches(med.batches);
    setActiveBatchIndex(0);
    setCurrentMedicineIndex(index);
  };

  const handleUpdateMedicine = () => {
    if (currentMedicineIndex === null) return;
    const updated = [...addedMedicines];
    updated[currentMedicineIndex] = {
      ...updated[currentMedicineIndex],
      formData: { ...formData },
      salts: [...salts],
      batches: [...batches],
    };
    setAddedMedicines(updated);
    clearCurrentForm();
    toast.success('Updated!');
  };

  const handleRemoveMedicine = (index: number) => {
    setAddedMedicines(prev => prev.filter((_, i) => i !== index));
    toast.success('Removed');
  };

  // Helper function to determine base unit from medicine form
  const getBaseUnitFromForm = (form: string): string => {
    const formLower = form?.toLowerCase() || '';

    // Divisible products - store in smallest unit (can sell individual pieces)
    if (formLower.includes('tablet') || formLower.includes('capsule') || formLower.includes('pill')) return 'Tablet';

    // Indivisible liquid products - store in container count (bottles/vials sold as whole units)
    if (formLower.includes('syrup') || formLower.includes('suspension') || formLower.includes('solution') || formLower.includes('liquid') || formLower.includes('drop')) return 'Bottle';
    if (formLower.includes('injection')) return 'Vial';

    // Indivisible semi-solid products - store in container count
    if (formLower.includes('cream') || formLower.includes('ointment') || formLower.includes('gel')) return 'Tube';
    if (formLower.includes('powder') || formLower.includes('granule')) return 'Sachet';

    // Other forms
    if (formLower.includes('inhaler')) return 'Inhaler';
    if (formLower.includes('patch')) return 'Patch';

    return 'Unit'; // Default fallback
  };

  const handleSubmitAll = async () => {
    if (!storeId) {
      toast.error('Store not found');
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      toast.error('Submission already in progress');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Submitting ${addedMedicines.length} medicine(s)...`);
    let successCount = 0;
    const createdDrugIds = new Set();

    try {
      for (const med of addedMedicines) {
        let drugId = med.drugId;
        const isTempId = !drugId || drugId.startsWith('med-') || drugId.startsWith('med_');

        // Determine if we need to create or update the drug
        if (drugId && !isTempId) {
          // Update existing drug metadata
          const firstBatch = med.batches[0];
          const baseUnit = getBaseUnitFromForm(med.formData.form);
          await inventoryApi.updateDrug(drugId, {
            manufacturer: med.formData.manufacturer,
            form: med.formData.form,
            hsnCode: med.formData.hsnCode,
            gstRate: med.formData.gstRate,
            requiresPrescription: med.formData.requiresPrescription,
            baseUnit: baseUnit,
            displayUnit: firstBatch.unit,
          });
        } else {
          // Create new drug
          const drugKey = `${med.formData.name}_${med.formData.manufacturer}_${med.formData.form}`;

          if (createdDrugIds.has(drugKey)) {
            toast.warning(`Skipped duplicate: ${med.formData.name}`);
            continue;
          }

          const firstBatch = med.batches[0];
          const baseUnit = getBaseUnitFromForm(med.formData.form);
          const createdDrug = await inventoryApi.createDrug({
            ...med.formData,
            saltLinks: med.salts.map((s, i) => ({
              saltId: s.saltId,
              name: s.name,
              strengthValue: s.strengthValue,
              strengthUnit: s.strengthUnit,
              order: i
            })),
            baseUnit: baseUnit,
            displayUnit: firstBatch.unit,
          });

          drugId = createdDrug.id;
          createdDrugIds.add(drugKey);
        }

        // Now create ALL batches for this drug
        for (const batch of med.batches) {
          const [month, year] = batch.expiryDate.split('/');
          const packSizeNum = parseInt(batch.packSize || '1') || 1;
          const quantityNum = parseInt(batch.quantity);
          const baseUnit = getBaseUnitFromForm(med.formData.form);

          // Calculate base unit quantity based on packaging type and whether product is divisible
          let baseUnitQuantity;

          if (batch.unit === 'Box') {
            // CRITICAL FIX: Box is 3-level hierarchy (Box → Strip → Tablet)
            // UI preview at line 2476 correctly shows: qty * packSize * secondaryPackSize
            // Backend was only doing: qty * packSize (WRONG!)
            // Example: 1 Box × 20 Strips/Box × 10 Tablets/Strip = 200 Tablets
            const containersPerBox = packSizeNum; // strips per box (20)
            const secondaryPackSize = Number(batch.secondaryPackSize) || 1; // tablets per strip (10)
            baseUnitQuantity = quantityNum * containersPerBox * secondaryPackSize; // 1 × 20 × 10 = 200

            console.log('📦 Box calculation:', {
              boxes: quantityNum,
              stripsPerBox: containersPerBox,
              tabletsPerStrip: secondaryPackSize,
              totalTablets: baseUnitQuantity
            });
          } else if (baseUnit === 'Tablet') {
            // Divisible product (Tablets): Store as tablet count
            // Strip: 10 Strips × 10 Tablets/Strip = 100 Tablets
            baseUnitQuantity = quantityNum * packSizeNum;
          } else {
            // Indivisible products (Bottle/Vial/Tube/Sachet): Store as container count
            // Bottle: 10 Bottles = 10 Bottles (ML is just size metadata)
            baseUnitQuantity = quantityNum;
          }

          await inventoryApi.createBatch({
            batchNumber: batch.batchNumber.trim(),
            purchaseRate: parseFloat(batch.purchaseRate),
            mrp: parseFloat(batch.mrp),
            quantity: quantityNum,
            baseUnitQuantity,
            receivedUnit: batch.unit,
            tabletsPerStrip: packSizeNum, // Keep for backward compatibility, but represents units per container
            expiryDate: `${year}-${month}-01`,
            supplierId: batch.supplierId.trim(),
            location: batch.location.trim(),
            drugId,
            storeId,
            purchasePrice: parseFloat(batch.purchaseRate),
          });
        }

        successCount++;
      }

      toast.success(`✓ ${successCount} medicine(s) added!`, { id: toastId });
      setAddedMedicines([]);
      clearCurrentForm();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error?.message || 'Submission failed', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Camera cleanup on close
  React.useEffect(() => {
    if (!isOpen) {
      setShowCamera(false);
      setShowScanner(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Transparent backdrop that still blocks clicks if desired, or allows interaction? 
            Usually modal blocks interaction. "don't make everything else outside the view blury and in dark shade" 
            implies just visual change. Keeping inset-0 to block interaction but removing color. 
        */}
      <div className="fixed inset-0 bg-transparent" onClick={onClose} />
      <div
        className="fixed top-16 right-0 bottom-0 bg-white shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        onKeyDown={(e) => {
          // Allow Enter navigation if not handling a specific shortcut
          if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
            handleEnterNavigation(e);
          }
        }}
      >
        {/* Clean Minimal Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Medicine + Stock</h2>
              <p className="text-sm text-gray-600 mt-0.5">Search catalog or add with batch details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 py-0">
          {/* Removed error list - now showing inline field errors */}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <FiCheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Medicine created successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Similar Medicine Warning */}
          {similarMedicines.length > 0 && !showDuplicateModal && (
            <SimilarMedicineWarning
              similarMedicines={similarMedicines}
              currentMedicineName={formData.name}
              onViewSimilar={(medicine) => {
                toast.info(`Viewing ${medicine.name}`);
                // Could navigate to medicine details here
              }}
              onProceedAnyway={() => {
                setSimilarMedicines([]);
                toast.success('Continuing with medicine addition');
              }}
            />
          )}

          {/* Hero Search Field - STICKY AT TOP */}
          <div className="sticky top-0 bg-white z-40 pb-4 -mt-6 pt-6 mb-6 border-b border-gray-100 relative">
            {/* Upload Progress Overlay */}
            {processing && (
              <UploadProgressOverlay progress={uploadProgress} stage={uploadStage} />
            )}
            <Label className="text-base font-medium text-gray-800 mb-2 block">
              What medicine are you adding?
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiSearch size={20} />
                </div>
                <Input
                  key="medicine-search-input"
                  type="text"
                  placeholder="Search 246,000+ medicines or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="pl-12 h-14 text-base border-2 border-gray-300 focus:border-gray-300 focus:ring-0 rounded-lg"
                  autoComplete="off"
                  autoFocus
                />

                {loadingDetection && searchQuery.length >= 2 && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <FiLoader className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching medicines...</span>
                    </div>
                  </div>
                )}

                {showSearchResults && searchResults.length > 0 && !loadingDetection && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                      {searchResults.length} medicine{searchResults.length !== 1 ? 's' : ''} found
                    </div>
                    {searchResults.map((medicine, index) => (
                      <button
                        key={medicine.id}
                        type="button"
                        onClick={() => handleSelectFromCatalog(medicine)}
                        className={`w-full p-4 text-left border-b last:border-b-0 transition-all ${index === selectedSearchIndex
                          ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Medicine Name - Primary */}
                            <div className="font-semibold text-base text-gray-900 truncate">
                              {medicine.name}
                            </div>

                            {/* Manufacturer & Form - Secondary */}
                            {(medicine.manufacturerName || medicine.type) && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                {medicine.manufacturerName && (
                                  <span className="flex items-center gap-1">
                                    <FiTruck className="h-3 w-3" />
                                    {medicine.manufacturerName}
                                  </span>
                                )}
                                {medicine.type && (
                                  <span className="flex items-center gap-1">
                                    <FiPackage className="h-3 w-3" />
                                    {medicine.type}
                                  </span>
                                )}
                                {medicine.requiresPrescription && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                                    Rx
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Composition/Generic - Tertiary */}
                            {(medicine.genericName || medicine.composition) && (
                              <div className="text-xs text-emerald-700 mt-1.5 font-medium">
                                {medicine.genericName || medicine.composition}
                              </div>
                            )}
                          </div>

                          {/* Selection Indicator */}
                          <div className="flex-shrink-0 text-gray-400">
                            <FiCheckCircle className="h-5 w-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Icons */}
              {/* Barcode Scanner Button with Status */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setShowScanner(true)}
                  className={`h-14 px-4 border-2 rounded-lg transition-all flex items-center justify-center relative ${loadingDetection
                    ? 'border-emerald-400 bg-emerald-50 cursor-not-allowed'
                    : 'border-gray-300 hover:bg-gray-50 hover:border-emerald-500'
                    }`}
                  title="Scan barcode"
                  disabled={loadingDetection}
                >
                  <BsUpcScan
                    size={24}
                    className={`${showScanner || loadingDetection
                      ? 'text-emerald-600 animate-pulse'
                      : 'text-gray-700'
                      } transition-all`}
                  />
                </button>
                {showScanner && (
                  <span className="text-xs text-emerald-600 font-medium text-center">Scanning...</span>
                )}
                {!showScanner && loadingDetection && (
                  <span className="text-xs text-emerald-600 font-medium text-center">Detecting...</span>
                )}
              </div>

              {/* Upload Button with Status */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => document.getElementById('modal-file-upload')?.click()}
                  className={`h-14 px-4 border-2 rounded-lg transition-all flex items-center justify-center ${loadingDetection
                    ? 'border-emerald-400 bg-emerald-50 cursor-not-allowed'
                    : 'border-gray-300 hover:bg-gray-50 hover:border-emerald-500'
                    }`}
                  title="Upload strip image for OCR"
                  disabled={loadingDetection}
                >
                  <FiUpload
                    size={24}
                    className={`${processing
                      ? 'text-emerald-600 animate-pulse'
                      : 'text-gray-700'
                      } transition-all`}
                  />
                </button>
                {image && !processing && (
                  <span className="text-xs text-green-600 font-medium text-center flex items-center justify-center gap-1">
                    <FiCheck size={12} /> Uploaded
                  </span>
                )}
                {processing && (
                  <span className="text-xs text-emerald-600 font-medium text-center">Processing...</span>
                )}
              </div>

              <input
                id="modal-file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Search by name, composition, or manufacturer
            </p>
          </div>

          {/* Added Medicines - Inline Collapsible Cards */}
          {addedMedicines.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="text-sm font-medium text-gray-700">
                ✓ {addedMedicines.length} Medicine{addedMedicines.length !== 1 ? 's' : ''} Added
              </div>
              {addedMedicines.map((med, index) => (
                <details
                  key={med.id}
                  className="border-2 border-emerald-200 rounded-lg overflow-hidden bg-emerald-50"
                  open={index === addedMedicines.length - 1}
                >
                  <summary className="cursor-pointer px-4 py-3 hover:bg-emerald-100 transition-colors list-none flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-900">{med.formData.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 ml-6">
                        {med.batches.length} Batch{med.batches.length !== 1 ? 'es' : ''} • GST: {med.formData.gstRate}%
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveMedicine(index);
                      }}
                      className="px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Remove"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </summary>

                  <div className="p-4 bg-white border-t border-emerald-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Medicine:</span> <span className="font-medium">{med.formData.name}</span></div>
                      <div><span className="text-gray-600">Manufacturer:</span> <span className="font-medium">{med.formData.manufacturer || 'N/A'}</span></div>
                      <div><span className="text-gray-600">Form:</span> <span className="font-medium">{med.formData.form}</span></div>
                      <div><span className="text-gray-600">Salts:</span> <span className="font-medium">{med.salts.length} salt{med.salts.length !== 1 ? 's' : ''}</span></div>
                      <div><span className="text-gray-600">HSN:</span> <span className="font-medium">{med.formData.hsnCode || 'N/A'}</span></div>
                      <div><span className="text-gray-600">GST:</span> <span className="font-medium">{med.formData.gstRate}%</span></div>
                      <div><span className="text-gray-600">Batches:</span> <span className="font-medium">{med.batches.length}</span></div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {med.batches.map((batch, bIndex) => (
                        <div key={bIndex} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                          <div className="font-medium text-gray-900">Batch #{bIndex + 1}: {batch.batchNumber}</div>
                          <div className="text-gray-600 mt-1">
                            Qty: {batch.quantity} {batch.unit}s • Exp: {batch.expiryDate} • MRP: ₹{batch.mrp} • Location: {batch.location || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleEditMedicine(index)}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      {currentMedicineIndex === index ? 'Currently Adding' : 'Edit This Medicine'}
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* Current Medicine Entry Form */}


          {/* Medicine Details - Conditional based on state */}
          {/* Medicine Details - Always Editable (User Request) */}

          {/* Editable form for new medicines */}
          <div className="mb-6 space-y-4 bg-gray-50 rounded-lg p-4">
            <div>
              <Label htmlFor="modal-name" className="text-sm font-medium text-gray-700">
                Medicine Name *
              </Label>
              <Input
                id="modal-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onBlur={async () => {
                  // Real-time duplicate check when user finishes typing name
                  if (formData.name && formData.name.trim().length > 3 && salts.length > 0) {
                    const result = await checkForDuplicates();
                    if (result?.isDuplicate) {
                      toast.warning('⚠️ This medicine may already exist in inventory');
                    } else if (result?.similarMedicines && result.similarMedicines.length > 0) {
                      toast.info(`Found ${result.similarMedicines.length} similar medicine(s)`);
                    }
                  }
                }}
                placeholder="e.g., Crocin 500"
                className={`mt-1.5 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label htmlFor="modal-manufacturer" className="text-sm font-medium text-gray-700">
                  Manufacturer
                </Label>
                <Input
                  id="modal-manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="e.g., GSK"
                  className="mt-1.5"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="modal-hsn" className="text-sm font-medium text-gray-700">
                  HSN Code
                </Label>
                <Input
                  id="modal-hsn"
                  value={formData.hsnCode}
                  onChange={(e) =>
                    setFormData({ ...formData, hsnCode: e.target.value })
                  }
                  placeholder="3004"
                  className="mt-1.5"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="modal-gst" className="text-sm font-medium text-gray-700">
                  GST %
                </Label>
                <select
                  id="modal-gst"
                  value={formData.gstRate}
                  onChange={(e) =>
                    setFormData({ ...formData, gstRate: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1.5 w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Form *
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {commonForms.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.label === 'Other') {
                        setShowOtherFormInput(true);
                      } else {
                        setShowOtherFormInput(false);
                        setFormData({ ...formData, form: item.label });
                      }
                    }}
                    className={`py-2 px-1 rounded-lg border-2 text-xs font-medium transition-all flex flex-col items-center gap-1 ${(formData.form === item.label && !showOtherFormInput) || (item.label === 'Other' && showOtherFormInput)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                      }`}
                  >
                    <span className={(formData.form === item.label && !showOtherFormInput) || (item.label === 'Other' && showOtherFormInput) ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              {showOtherFormInput && (
                <div className="mt-2 relative">
                  <select
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 transition-colors bg-white outline-none"
                    value={otherFormsList.includes(formData.form) ? formData.form : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setFormData({ ...formData, form: '' });
                      } else if (val) {
                        setFormData({ ...formData, form: val });
                      }
                    }}
                  >
                    <option value="">Select specific form...</option>
                    {otherFormsList.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                    <option value="custom">-- Custom Form --</option>
                  </select>
                  {(!otherFormsList.includes(formData.form) && formData.form !== 'Other' && formData.form !== '') && (
                    <Input
                      className="mt-2"
                      placeholder="Type custom form name..."
                      value={formData.form}
                      onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modal-requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresPrescription: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="modal-requiresPrescription" className="text-sm font-medium text-gray-700 cursor-pointer">
                Requires Prescription (Rx)
              </Label>
            </div>

            {/* Salt Composition - Integrated */}
            <div className="pt-4 mt-4 border-t border-gray-300">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Salt Composition</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Active ingredients and strengths</p>
                  {fieldErrors.salts && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.salts}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSaltRow}
                  className="text-xs h-8"
                >
                  <FiPlus className="mr-1.5 h-3 w-3" />
                  Add Salt
                </Button>
              </div>

              {salts.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600 mb-2 text-xs">No salts added yet</p>
                  <div className="flex gap-2 justify-center">
                    {formData.name && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSuggestions(true)}
                        className="border-violet-300 text-violet-700 hover:bg-violet-50 text-xs h-7"
                      >
                        <FiZap className="mr-1.5 h-3 w-3" />
                        Get Suggestions
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={addSaltRow} className="text-xs h-7">
                      <FiPlus className="mr-1.5 h-3 w-3" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {salts.map((salt, saltIndex) => (
                    <div key={salt.id} className="relative group">
                      {editingSaltId === salt.id ? (
                        <div className="p-3 bg-white rounded-lg border-2 border-blue-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                Salt Name
                              </Label>
                              <Input
                                value={salt.name || ''}
                                onChange={(e) => updateSalt(salt.id, 'name', e.target.value)}
                                placeholder="e.g., Paracetamol"
                                className="h-8 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSaltRow(salt.id)}
                              className="mt-4 ml-2 hover:bg-red-50 text-red-500 h-8 w-8 p-0"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                Strength
                              </Label>
                              <Input
                                type="number"
                                value={salt.strengthValue || ''}
                                onChange={(e) =>
                                  updateSalt(
                                    salt.id,
                                    'strengthValue',
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="500"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 mb-1 block">
                                Unit
                              </Label>
                              <Input
                                value={salt.strengthUnit || ''}
                                onChange={(e) =>
                                  updateSalt(salt.id, 'strengthUnit', e.target.value)
                                }
                                placeholder="mg"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!salt.name?.trim()) {
                                  toast.error('Salt name is required');
                                  return;
                                }
                                setEditingSaltId(null);
                              }}
                              className="text-xs h-7"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                              {saltIndex + 1}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{salt.name || 'Untitled Salt'}</p>
                              <p className="text-[10px] text-gray-500">
                                {salt.strengthValue && salt.strengthUnit ? `${salt.strengthValue} ${salt.strengthUnit}` : 'No strength set'}
                                {salt.confidence && (
                                  <span className={`ml-1.5 px-1 py-0.5 rounded-full text-[9px] ${salt.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {salt.confidence === 'HIGH' ? '✓' : '⚠️'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSaltId(salt.id)}
                              className="h-7 px-2 text-blue-600 hover:bg-blue-50 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSaltRow(salt.id)}
                              className="h-7 px-2 text-red-500 hover:bg-red-50"
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* Salt Suggestions */}
          {formData.name && salts.length === 0 && !showSuggestions && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowSuggestions(true)}
                className="w-full border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
              >
                <FiZap className="mr-2 h-4 w-4" />
                Get Salt Suggestions for "{formData.name}"
              </Button>
            </div>
          )}

          {showSuggestions && (
            <div className="mb-6">
              <SaltSuggestions
                medicineName={formData.name}
                onSelect={handleSuggestionSelect}
                onManualEntry={() => {
                  setShowSuggestions(false);
                  addSaltRow();
                }}
                storeId={storeId}
              />
            </div>
          )}


          {/* Batch Details - MANDATORY */}
          <div className="mb-6 border-2 border-emerald-200 rounded-lg p-5 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-4">
              <FiPackage className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-semibold text-gray-800">Batch & Stock Details *</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {modalState === ModalState.EXISTING_WITH_BATCHES
                    ? 'Select existing batch or create new'
                    : 'Add purchase information and stock quantity'}
                </p>
              </div>
            </div>

            {/* Batch Selector for Existing Medicines with Batches */}
            {modalState === ModalState.EXISTING_WITH_BATCHES && existingBatches.length > 0 && (
              <div className="mb-5 p-4 bg-white rounded-lg border border-emerald-300">
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Existing Batches ({existingBatches.length})
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingBatches.map((batch: any, batchIdx: number) => (
                    <label
                      key={batch.id}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedBatchId === batch.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="radio"
                          name="batch-selection"
                          value={batch.id}
                          checked={selectedBatchId === batch.id}
                          onChange={() => {
                            setSelectedBatchId(batch.id);
                            setCreateNewBatch(false);
                            // Pre-fill batch data from selected batch
                            const newBatches = [{
                              batchNumber: batch.batchNumber,
                              purchaseRate: batch.purchasePrice?.toString() || '',
                              mrp: batch.mrp?.toString() || '',
                              quantity: '', // User will add quantity
                              expiryDate: batch.expiryDate?.split('T')[0] || '',
                              supplierId: batch.supplier?.id || '',
                              unit: 'Tablet',
                              packSize: batch.tabletsPerStrip?.toString() || '10',
                              location: batch.location || ''
                            }];
                            setBatches(newBatches);
                            setActiveBatchIndex(0);
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {batch.batchNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Stock: {batch.baseUnitQuantity} units • MRP: ₹{batch.mrp}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}

                  {/* Create New Batch Option */}
                  <label
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${createNewBatch
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 border-dashed hover:border-blue-400 hover:bg-blue-50/30'
                      }`}
                  >
                    <input
                      type="radio"
                      name="batch-selection"
                      value="new"
                      checked={createNewBatch}
                      onChange={() => {
                        setCreateNewBatch(true);
                        setSelectedBatchId(null);
                        // Clear batch data for new entry
                        setBatches([{
                          batchNumber: '',
                          purchaseRate: '',
                          mrp: '',
                          quantity: '',
                          expiryDate: '',
                          supplierId: '',
                          unit: 'Tablet',
                          packSize: '10',
                          location: '',
                        }]);
                        setActiveBatchIndex(0);
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <FiPlus className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm text-gray-900">Create New Batch</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Batch Form - Show if creating new batch OR no existing batches */}
            {(modalState === ModalState.EXISTING_NO_BATCHES ||
              modalState === ModalState.SEARCH_INITIAL ||
              modalState === ModalState.NEW_MEDICINE ||
              (modalState === ModalState.EXISTING_WITH_BATCHES && createNewBatch)) && (

                <React.Fragment>
                  {/* Batch Selector - show if multiple batches exist */}
                  {batches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Batches ({batches.length})</h4>
                        <button
                          type="button"
                          onClick={addNewBatch}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                          Add Batch
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {batches.map((batch, index) => (
                          <div
                            key={index}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveBatchIndex(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setActiveBatchIndex(index);
                              }
                            }}
                            className={`relative px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeBatchIndex === index
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                {batch.batchNumber || `Batch #${index + 1}`}
                              </span>
                              {batches.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeBatch(index);
                                  }}
                                  className="hover:text-red-500 transition-colors"
                                  title="Remove batch"
                                >
                                  <FiTrash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {batch.expiryDate && (
                              <div className="text-[10px] opacity-75 mt-0.5">
                                Exp: {batch.expiryDate}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Batch Number */}
                    <div>
                      <Label htmlFor="batchNumber" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FiPackage className="h-3.5 w-3.5" />
                        Batch Number *
                      </Label>
                      <Input
                        id="batchNumber"
                        value={batches[activeBatchIndex].batchNumber}
                        onChange={(e) => updateCurrentBatch('batchNumber', e.target.value)}
                        placeholder="e.g., LOT2024001"
                        className={`mt-1.5 ${fieldErrors.batchNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.batchNumber && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.batchNumber}</p>
                      )}
                    </div>

                    {/* Expiry Date (MM/YYYY) */}
                    <div>
                      <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FiCalendar className="h-3.5 w-3.5" />
                        Expiry (MM/YYYY) *
                      </Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        value={batches[activeBatchIndex].expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d]/g, ''); // Only digits

                          // Auto-format as MM/YYYY
                          if (value.length >= 2) {
                            const month = value.substring(0, 2);
                            let year = value.substring(2, 6);

                            // Auto-prepend '20' if user types year
                            if (year.length > 0 && year.length <= 2 && !year.startsWith('20')) {
                              year = '20' + year;
                            }

                            value = month + (year ? '/' + year : '');
                          }

                          // Limit to MM/YYYY format
                          if (value.length > 7) value = value.substring(0, 7);

                          updateCurrentBatch('expiryDate', value);
                        }}
                        placeholder="MM/YYYY (e.g., 03/2025)"
                        maxLength={7}
                        className={`mt-1.5 ${fieldErrors.expiryDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.expiryDate && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.expiryDate}</p>
                      )}
                    </div>

                    {/* Purchase Rate */}
                    <div>
                      <Label htmlFor="purchaseRate" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FiDollarSign className="h-3.5 w-3.5" />
                        Purchase Rate (per unit) *
                      </Label>
                      <Input
                        id="purchaseRate"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={batches[activeBatchIndex].purchaseRate}
                        onChange={(e) => updateCurrentBatch('purchaseRate', e.target.value)}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                        placeholder="0.00"
                        className={`mt-1.5 ${fieldErrors.purchaseRate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.purchaseRate && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.purchaseRate}</p>
                      )}
                    </div>

                    {/* MRP */}
                    <div>
                      <Label htmlFor="mrp" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FiDollarSign className="h-3.5 w-3.5" />
                        MRP (Selling Price) *
                      </Label>
                      <Input
                        id="mrp"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={batches[activeBatchIndex].mrp}
                        onChange={(e) => updateCurrentBatch('mrp', e.target.value)}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                        placeholder="0.00"
                        className={`mt-1.5 ${fieldErrors.mrp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.mrp && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.mrp}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location / Shelf
                      </Label>
                      <Input
                        id="location"
                        value={batches[activeBatchIndex].location}
                        onChange={(e) => updateCurrentBatch('location', e.target.value)}
                        placeholder="e.g., A1, Rack 4"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Pack Size & Unit */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                          Packaging Unit *
                        </Label>
                        <div className="flex items-start gap-2 mb-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                          <FiInfo className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-blue-700 leading-relaxed">
                            {(() => {
                              const form = formData.form?.toLowerCase() || '';
                              let baseUnit = 'Units';

                              if (form.includes('tablet') || form.includes('capsule')) baseUnit = 'Tablets';
                              else if (form.includes('syrup') || form.includes('suspension') || form.includes('solution') || form.includes('liquid') || form.includes('drop') || form.includes('injection')) baseUnit = 'ML';
                              else if (form.includes('cream') || form.includes('ointment') || form.includes('gel') || form.includes('powder')) baseUnit = 'GM';

                              return `Stock will be stored in ${baseUnit}. Choose how you want to add it (by packaging).`;
                            })()}
                          </p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200 w-full mb-4">
                          <div className="flex-1 w-full">
                            <Label className="text-xs font-bold text-gray-500 mb-1.5 block">Item Type (Unit)</Label>
                            <select
                              value={batches[activeBatchIndex].innerUnit || 'Strip'}
                              onChange={(e) => {
                                const newBatches = [...batches];
                                newBatches[activeBatchIndex].innerUnit = e.target.value;
                                if (!['Box', 'Carton', 'Pack', 'Kit'].includes(newBatches[activeBatchIndex].unit)) {
                                  newBatches[activeBatchIndex].unit = e.target.value;
                                }
                                setBatches(newBatches);
                              }}
                              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                            >
                              <optgroup label="Common">
                                <option value="Strip">Strip</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Tube">Tube</option>
                                <option value="Vial">Vial</option>
                                <option value="Sachet">Sachet</option>
                                <option value="Unit">Unit/Piece</option>
                              </optgroup>
                              <optgroup label="Specialized">
                                <option value="Ampoule">Ampoule</option>
                                <option value="Inhaler">Inhaler</option>
                                <option value="Jar">Jar</option>
                                <option value="Can">Can</option>
                                <option value="Kit">Kit</option>
                              </optgroup>
                            </select>
                          </div>
                          <div className="hidden md:flex items-center pb-3">
                            <FiX className="text-gray-400 h-4 w-4" />
                          </div>
                          <div className="flex-1 w-full">
                            <Label className="text-xs font-bold text-gray-500 mb-1.5 block">Bulk Packaging</Label>
                            <select
                              value={['Box', 'Carton', 'Pack', 'Kit'].includes(batches[activeBatchIndex].unit) ? batches[activeBatchIndex].unit : 'None'}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newBatches = [...batches];
                                if (val === 'None') {
                                  newBatches[activeBatchIndex].unit = newBatches[activeBatchIndex].innerUnit || 'Strip';
                                } else {
                                  newBatches[activeBatchIndex].unit = val;
                                }
                                setBatches(newBatches);
                              }}
                              className={`w-full h-10 px-3 border rounded-md text-sm font-bold focus:ring-2 focus:ring-blue-500 ${['Box', 'Carton', 'Pack', 'Kit'].includes(batches[activeBatchIndex].unit)
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-600'
                                }`}
                            >
                              <option value="None">None (Buying in {batches[activeBatchIndex].innerUnit || 'Strips'})</option>
                              <optgroup label="Bulk / Outer">
                                <option value="Box">Box</option>
                                <option value="Carton">Carton</option>
                                <option value="Pack">Pack</option>
                                <option value="Kit">Kit</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 pl-1">
                          Enter quantity in {batches[activeBatchIndex].unit}s
                        </p>
                      </div>

                      {/* Dynamic Conversion Labels (Tablets per Strip / Strips per Box etc) */}
                      {(() => {
                        const unit = batches[activeBatchIndex].unit;
                        const innerUnit = batches[activeBatchIndex].innerUnit || 'Strip';
                        const isBulk = ['Box', 'Carton', 'Pack', 'Kit'].includes(unit);
                        const form = formData.form?.toLowerCase() || '';

                        let baseUnitLabel = 'Units';
                        if (form.includes('tablet') || form.includes('capsule')) baseUnitLabel = 'Tablets';
                        else if (form.includes('syrup') || form.includes('suspension') || form.includes('solution') || form.includes('liquid') || form.includes('drop') || form.includes('injection')) baseUnitLabel = 'ML';
                        else if (form.includes('cream') || form.includes('ointment') || form.includes('gel')) baseUnitLabel = 'GM';
                        else if (form.includes('powder')) baseUnitLabel = 'GM';

                        if (isBulk) {
                          return (
                            <div className="space-y-4">
                              {/* Inner Units per Bulk (e.g., Strips per Box) */}
                              <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <Label className="text-sm font-semibold text-amber-900">
                                    {innerUnit}s per {unit} *
                                  </Label>
                                  <p className="text-xs text-amber-700 mt-0.5">
                                    How many {innerUnit.toLowerCase()}s in one {unit.toLowerCase()}?
                                  </p>
                                </div>
                                <div className="w-32 relative">
                                  <Input
                                    value={batches[activeBatchIndex].packSize}
                                    onChange={(e) => updateCurrentBatch('packSize', e.target.value)}
                                    placeholder="10"
                                    className="h-10 text-center font-bold border-amber-200 focus:ring-amber-500 bg-white"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400">
                                    {innerUnit.toUpperCase()}S
                                  </span>
                                </div>
                              </div>

                              {/* Base Units per Inner Unit (e.g., Tablets per Strip) */}
                              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <Label className="text-sm font-semibold text-blue-900">
                                    {baseUnitLabel} per {innerUnit} *
                                  </Label>
                                  <p className="text-xs text-blue-700 mt-0.5">
                                    Count of {baseUnitLabel.toLowerCase()} in each {innerUnit.toLowerCase()}
                                  </p>
                                </div>
                                <div className="w-32 relative">
                                  <Input
                                    value={batches[activeBatchIndex].secondaryPackSize || ''}
                                    onChange={(e) => updateCurrentBatch('secondaryPackSize', e.target.value)}
                                    placeholder="10"
                                    className="h-10 text-center font-bold border-blue-200 focus:ring-blue-500 bg-white"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">
                                    {baseUnitLabel.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Individual Unit Mode
                        return (
                          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <Label className="text-sm font-semibold text-blue-900">
                                {baseUnitLabel} per {unit} *
                              </Label>
                              <p className="text-xs text-blue-700 mt-0.5">
                                Total {baseUnitLabel.toLowerCase()} in one {unit.toLowerCase()}
                              </p>
                            </div>
                            <div className="w-32 relative">
                              <Input
                                value={batches[activeBatchIndex].packSize}
                                onChange={(e) => updateCurrentBatch('packSize', e.target.value)}
                                placeholder="10"
                                className="h-10 text-center font-bold border-blue-200 focus:ring-blue-500 bg-white"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">
                                {baseUnitLabel.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FiPackage className="h-3.5 w-3.5" />
                        Quantity ({batches[activeBatchIndex].unit}s) *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={batches[activeBatchIndex].quantity}
                        onChange={(e) => updateCurrentBatch('quantity', e.target.value)}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === '.' || e.key === 'e') e.preventDefault(); }}
                        placeholder="0"
                        className={`mt-1.5 ${fieldErrors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.quantity && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.quantity}</p>
                      )}
                      {batches[activeBatchIndex].quantity && batches[activeBatchIndex].packSize && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs font-semibold text-green-800">
                            📦 Total Stock Added: <span className="text-green-900">
                              {(() => {
                                const form = formData.form?.toLowerCase() || '';
                                const unit = batches[activeBatchIndex].unit;
                                const qty = parseInt(batches[activeBatchIndex].quantity);
                                const packSize = parseInt(batches[activeBatchIndex].packSize || '1');
                                const secondaryPackSize = parseInt(batches[activeBatchIndex].secondaryPackSize || '1');

                                // Determine base unit and quantity
                                let baseUnit = '';
                                let totalQty = 0;

                                if (form.includes('tablet') || form.includes('capsule')) {
                                  baseUnit = 'Tablets';
                                  if (unit === 'Box') {
                                    totalQty = qty * packSize * secondaryPackSize; // Boxes × Strips/Box × Tablets/Strip
                                  } else {
                                    totalQty = qty * packSize; // Strips × Tablets/Strip
                                  }
                                } else if (form.includes('syrup') || form.includes('suspension') || form.includes('liquid') || form.includes('solution') || form.includes('drop')) {
                                  baseUnit = 'Bottles';
                                  if (unit === 'Box') {
                                    totalQty = qty * packSize; // Boxes × Bottles/Box
                                  } else {
                                    totalQty = qty; // Direct bottle count
                                  }
                                } else if (form.includes('injection')) {
                                  baseUnit = 'Vials';
                                  if (unit === 'Box') {
                                    totalQty = qty * packSize; // Boxes × Vials/Box
                                  } else {
                                    totalQty = qty; // Direct vial count
                                  }
                                } else if (form.includes('cream') || form.includes('ointment') || form.includes('gel')) {
                                  baseUnit = 'Tubes';
                                  if (unit === 'Box') {
                                    totalQty = qty * packSize; // Boxes × Tubes/Box
                                  } else {
                                    totalQty = qty; // Direct tube count
                                  }
                                } else if (form.includes('powder') || form.includes('granule')) {
                                  baseUnit = 'Sachets';
                                  if (unit === 'Box') {
                                    totalQty = qty * packSize; // Boxes × Sachets/Box
                                  } else {
                                    totalQty = qty; // Direct sachet count
                                  }
                                } else {
                                  baseUnit = 'Units';
                                  totalQty = qty * packSize;
                                }

                                return `${totalQty} ${baseUnit}`;
                              })()}
                            </span>
                          </p>
                          <p className="text-[10px] text-green-700 mt-0.5">This is how it will be stored and sold</p>
                        </div>
                      )}
                    </div>

                    {/* Supplier */}
                    <div className="md:col-span-2">
                      <Label htmlFor="supplier" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Supplier *
                      </Label>
                      {loadingSuppliers ? (
                        <div className="mt-1.5 h-10 w-full bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <div className="flex gap-2 mt-1.5">
                          <div className="relative flex-1">
                            <select
                              id="supplier"
                              value={batches[activeBatchIndex].supplierId}
                              onChange={(e) => updateCurrentBatch('supplierId', e.target.value)}
                              className={`w-full h-10 px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none ${fieldErrors.supplierId ? 'border-red-500' : 'border-gray-200'
                                }`}
                            >
                              <option value="">Select Supplier</option>
                              {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                              <FiChevronDown className="w-4 h-4" />
                            </div>
                          </div>

                          <button
                            onClick={() => setShowSupplierDrawer(true)}
                            className="flex items-center justify-center w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                            title="Add New Supplier"
                            type="button"
                          >
                            <FiPlus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {fieldErrors.supplierId && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.supplierId}</p>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )}

            {/* Optional: Strip Image - Collapsed by Default */}
            <details className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700">
                <BsUpcScan className="h-4 w-4" />
                <span>Strip Image (optional)</span>
                <span className="text-xs text-gray-500 ml-auto">Upload or capture for OCR help</span>
              </summary>

              <div className="p-4 bg-white">
                {!image ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                    <BsUpcScan className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-4">We'll try to auto-read salt composition</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('modal-file-upload')?.click()}
                        className="text-sm"
                      >
                        <FiUpload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCameraCapture}
                        className="text-sm"
                      >
                        <BsUpcScan className="mr-2 h-4 w-4" />
                        Use Camera
                      </Button>
                    </div>
                    <input
                      id="modal-file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={image}
                      alt="Medicine Strip"
                      className="w-full rounded-lg max-h-48 object-contain border border-gray-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImage(null);
                        setSalts([]);
                        setOcrConfidence(0);
                        setErrors([]);
                      }}
                      className="w-full text-sm"
                    >
                      <FiX className="mr-2 h-4 w-4" />
                      Remove Image
                    </Button>
                    {ocrConfidence > 0 && (
                      <p className="text-xs text-green-600 text-center">
                        ✓ OCR processed with {ocrConfidence}% confidence
                      </p>
                    )}
                  </div>
                )}
              </div>
            </details>


            {/* Action Buttons - Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-500 mb-3">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd> to cancel
                or <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">⌘↵</kbd> to save
              </p>
              <div className="flex justify-between items-center">
                {!showClearConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 px-2"
                  >
                    <FiTrash2 className="h-4 w-4 mr-1.5" />
                    Clear Form
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearCurrentForm();
                        setSelectedFromCatalog(null);
                        setModalState(ModalState.NEW_MEDICINE);
                        setExistingBatches([]);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium px-3 animate-in fade-in slide-in-from-left-2 duration-200"
                    >
                      Are you sure?
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </Button>

                  {currentMedicineIndex !== null ? (
                    <Button onClick={handleUpdateMedicine} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      Update Medicine
                    </Button>
                  ) : (
                    <>
                      {addedMedicines.length > 0 && (
                        <Button onClick={handleSubmitAll} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                          <FiCheckCircle className="mr-2 h-4 w-4" />
                          {isSubmitting ? 'Submitting...' : `Submit All (${addedMedicines.length})`}
                        </Button>
                      )}
                      <Button
                        onClick={async () => {
                          // Submit current form directly without auto-saving
                          await handleSubmit();
                        }}
                        disabled={processing || checkingDuplicate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                      >
                        {processing || checkingDuplicate ? (
                          <>
                            <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                            {checkingDuplicate ? 'Checking...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <FiCheckCircle className="mr-2 h-4 w-4" />
                            Add Medicine{addedMedicines.length > 0 ? ` (${addedMedicines.length})` : ''}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {
          showCamera && (
            <AdvancedCamera
              onCapture={handleCameraPhoto}
              onClose={() => setShowCamera(false)}
              title="Capture Medicine Strip"
            />
          )
        }

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScannerModal
            onClose={() => setShowScanner(false)}
            onScan={handleBarcodeScan}
          />
        )}

        {/* Duplicate Detected Modal */}
        {showDuplicateModal && duplicateCheckResult?.existingMedicine && (
          <DuplicateDetectedModal
            isOpen={showDuplicateModal}
            existingMedicine={duplicateCheckResult.existingMedicine}
            onAddBatch={() => {
              // Close the duplicate modal and the main modal
              setShowDuplicateModal(false);
              onClose();

              // Show a toast guiding the user
              toast.info('Medicine already exists!', {
                description: 'Go to Inventory → Stock and select the medicine to add a new batch.',
                duration: 6000,
              });
            }}
            onViewDetails={() => {
              // TODO: Open medicine detail sidebar
              setShowDuplicateModal(false);
              toast.info('Medicine details feature coming soon');
            }}
            onCancel={() => {
              setShowDuplicateModal(false);
              setDuplicateCheckResult(null);
            }}
          />
        )}

        {/* Similar Medicine Warning (shown in form content area, not as modal) */}

        {/* Supplier Drawer */}
        {showSupplierDrawer && (
          <SupplierDrawer
            isOpen={showSupplierDrawer}
            onClose={() => setShowSupplierDrawer(false)}
            onSuccess={(newSupplier) => {
              setSuppliers(prev => [...prev, newSupplier]);
              updateCurrentBatch('supplierId', newSupplier.id);
              setShowSupplierDrawer(false);
              toast.success('Supplier added!');
            }}
          />
        )}
      </div>
    </div >
  );
};
