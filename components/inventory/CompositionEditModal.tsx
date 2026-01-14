'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SaltOCRService } from '@/lib/salt-intelligence/ocr-service';
import { SuggestedSalt } from '@/lib/salt-intelligence/salt-suggestion-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FiLoader, FiUpload, FiCamera, FiPlus, FiTrash2, FiCheckCircle, FiX, FiZap, FiAlertCircle } from 'react-icons/fi';
import AdvancedCamera from '@/components/camera/AdvancedCamera';
import ImageCropper from '@/components/camera/ImageCropper';
import SaltSuggestions from './SaltSuggestions';
import { toast } from 'sonner';

interface SaltEntry {
  id: string;
  name: string;
  strengthValue: number | null;
  strengthUnit: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface DrugData {
  id: string;
  name: string;
  manufacturer: string;
}

interface CompositionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drugId: string, salts: SaltEntry[]) => Promise<void>;
  drug: DrugData;
  existingSalts?: SaltEntry[];
  storeId: string;
}

export default function CompositionEditModal({
  isOpen,
  onClose,
  onSave,
  drug,
  existingSalts,
  storeId,
}: CompositionEditModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [salts, setSalts] = useState<SaltEntry[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize with existing salts
  useEffect(() => {
    if (existingSalts && existingSalts.length > 0) {
      setSalts(existingSalts);
      setShowSuggestions(false);
    } else {
      setSalts([]);
      setShowSuggestions(true);
    }
  }, [existingSalts, isOpen]);

  // Validate a single salt entry
  const validateSalt = (salt: SaltEntry): string[] => {
    const errors: string[] = [];
    if (!salt.name || salt.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (salt.strengthValue === null || salt.strengthValue <= 0) {
      errors.push('Strength must be greater than 0');
    }
    if (!salt.strengthUnit || salt.strengthUnit.trim().length === 0) {
      errors.push('Unit is required');
    }
    return errors;
  };

  // Handle image upload - show cropper first
  const handleImageSelect = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file is too large. Please use an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Process cropped image with OCR
  const handleCroppedImage = useCallback(async (croppedBlob: Blob) => {
    setShowCropper(false);
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(croppedBlob);

    try {
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
      const result = await SaltOCRService.processImage(file);

      if (result.error) {
        toast.error('Could not extract composition. Please add salts manually.');
      } else {
        const saltEntries: SaltEntry[] = result.extractedSalts.map((salt, index) => ({
          id: `ocr-${index}-${Date.now()}`,
          name: salt.name,
          strengthValue: salt.strengthValue,
          strengthUnit: salt.strengthUnit,
          confidence: salt.confidence,
        }));

        if (saltEntries.length > 0) {
          // Merge with existing salts (upsert logic)
          setSalts(prev => {
            const merged = [...prev];
            saltEntries.forEach(newSalt => {
              const existingIndex = merged.findIndex(
                s => s.name.toLowerCase() === newSalt.name.toLowerCase()
              );
              if (existingIndex >= 0) {
                // Update existing
                merged[existingIndex] = { ...merged[existingIndex], ...newSalt, id: merged[existingIndex].id };
              } else {
                // Add new
                merged.push(newSalt);
              }
            });
            return merged;
          });
          setShowSuggestions(false);
          toast.success(`Extracted ${saltEntries.length} salt(s) from image`);
        } else {
          toast.warning('No composition detected. Please add salts manually.');
        }
      }
    } catch (ocrError) {
      toast.error('OCR failed. Please add salts manually.');
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleCameraPhoto = (photoDataUrl: string) => {
    setShowCamera(false);
    setRawImage(photoDataUrl);
    setShowCropper(true);
  };

  const addSaltRow = () => {
    setSalts([
      ...salts,
      {
        id: `salt-${Date.now()}`,
        name: '',
        strengthValue: null,
        strengthUnit: 'mg',
        confidence: 'LOW',
      },
    ]);
    setShowSuggestions(false);
  };

  const removeSaltRow = (id: string) => {
    setSalts(salts.filter((s) => s.id !== id));
  };

  const updateSalt = (id: string, field: keyof SaltEntry, value: any) => {
    setSalts(
      salts.map((s) =>
        s.id === id ? { ...s, [field]: value, confidence: 'HIGH' } : s
      )
    );
  };

  const handleSuggestionSelect = (suggestion: SuggestedSalt) => {
    // Check if salt already exists
    const existingIndex = salts.findIndex(
      s => s.name.toLowerCase() === suggestion.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing
      setSalts(prev => prev.map((s, i) => 
        i === existingIndex 
          ? { ...s, strengthValue: suggestion.strength || s.strengthValue, strengthUnit: suggestion.unit || s.strengthUnit }
          : s
      ));
      toast.info(`Updated ${suggestion.name}`);
    } else {
      // Add new
      setSalts([
        ...salts,
        {
          id: `suggestion-${Date.now()}`,
          name: suggestion.name,
          strengthValue: suggestion.strength || null,
          strengthUnit: suggestion.unit || 'mg',
          confidence: suggestion.confidence,
        },
      ]);
    }
  };

  const handleSave = async () => {
    // Only validate if there are salts - empty is allowed (clearing composition)
    if (salts.length > 0) {
      const allErrors: string[] = [];
      salts.forEach((salt, index) => {
        const errors = validateSalt(salt);
        if (errors.length > 0) {
          allErrors.push(`Salt ${index + 1} (${salt.name || 'unnamed'}): ${errors.join(', ')}`);
        }
      });

      if (allErrors.length > 0) {
        toast.error(
          <div>
            <p className="font-medium mb-1">Please fix the following:</p>
            <ul className="text-sm list-disc list-inside">
              {allErrors.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
              {allErrors.length > 3 && <li>...and {allErrors.length - 3} more</li>}
            </ul>
          </div>
        );
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(drug.id, salts);
      toast.success('Composition saved successfully');
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const getSaltStatus = (salt: SaltEntry) => {
    const errors = validateSalt(salt);
    if (errors.length === 0) return 'valid';
    if (salt.name && salt.strengthValue) return 'partial';
    return 'invalid';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Composition</h2>
            <p className="text-sm text-gray-500 mt-0.5">{drug.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scan Section - Compact */}
          <div className="flex gap-3">
            <input
              id="edit-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('edit-file-upload')?.click()}
              disabled={processing}
              className="flex-1"
            >
              <FiUpload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCamera(true)}
              disabled={processing}
              className="flex-1"
            >
              <FiCamera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
          </div>

          {/* Processing indicator */}
          {processing && (
            <div className="flex items-center justify-center py-4 bg-blue-50 rounded-lg">
              <FiLoader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">Processing image...</span>
            </div>
          )}

          {/* Image preview */}
          {image && !processing && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <img src={image} alt="Scanned" className="w-16 h-16 object-contain rounded border" />
              <div className="flex-1">
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4" />
                  Image processed
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImage(null)}
                className="text-gray-500"
              >
                Clear
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && salts.length === 0 && (
            <SaltSuggestions
              medicineName={drug.name}
              onSelect={handleSuggestionSelect}
              onManualEntry={() => {
                setShowSuggestions(false);
                addSaltRow();
              }}
              storeId={storeId}
            />
          )}

          {/* Salt List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">
                Salt Composition
                {salts.length > 0 && <span className="text-gray-400 font-normal ml-2">({salts.length})</span>}
              </h3>
              <div className="flex gap-2">
                {salts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-[#0ea5a3]"
                  >
                    <FiZap className="w-4 h-4 mr-1" />
                    Suggest
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSaltRow}
                >
                  <FiPlus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {salts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 mb-1">No salts added yet</p>
                <p className="text-sm text-gray-400">Scan an image, use suggestions, or add manually</p>
              </div>
            ) : (
              <div className="space-y-2">
                {salts.map((salt, index) => {
                  const status = getSaltStatus(salt);
                  return (
                    <div
                      key={salt.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        status === 'valid' 
                          ? 'bg-green-50 border-green-200' 
                          : status === 'partial'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-6 gap-2">
                          <div className="col-span-3">
                            <Input
                              value={salt.name}
                              onChange={(e) => updateSalt(salt.id, 'name', e.target.value)}
                              placeholder="Salt name"
                              className={`h-9 ${!salt.name ? 'border-red-300' : ''}`}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={salt.strengthValue || ''}
                              onChange={(e) => updateSalt(salt.id, 'strengthValue', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Strength"
                              className={`h-9 ${!salt.strengthValue ? 'border-red-300' : ''}`}
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              value={salt.strengthUnit || ''}
                              onChange={(e) => updateSalt(salt.id, 'strengthUnit', e.target.value)}
                              placeholder="Unit"
                              className={`h-9 ${!salt.strengthUnit ? 'border-red-300' : ''}`}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeSaltRow(salt.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {status !== 'valid' && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <FiAlertCircle className="w-3 h-3" />
                          Fill all fields: name, strength, and unit
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0ea5a3] hover:bg-[#0d9491] min-w-[120px]"
          >
            {saving ? (
              <>
                <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiCheckCircle className="mr-2 h-4 w-4" />
                Save Medicine
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <AdvancedCamera
          onCapture={handleCameraPhoto}
          onClose={() => setShowCamera(false)}
          title="Capture Medicine Strip"
        />
      )}

      {/* Image Cropper Modal */}
      {showCropper && rawImage && (
        <ImageCropper
          imageSrc={rawImage}
          onCropComplete={handleCroppedImage}
          onCancel={() => {
            setShowCropper(false);
            setRawImage(null);
          }}
          autoProcess={true}
        />
      )}
    </div>
  );
}
