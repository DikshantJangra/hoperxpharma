'use client';

import React, { useState, useCallback } from 'react';
import { SaltOCRService } from '@/lib/salt-intelligence/ocr-service';
import { SaltSuggestionService, SuggestedSalt } from '@/lib/salt-intelligence/salt-suggestion-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiLoader, FiUpload, FiCamera, FiPlus, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';
import AdvancedCamera from '@/components/camera/AdvancedCamera';
import SaltSuggestions from './SaltSuggestions';

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
  requiresPrescription: boolean;
}

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  returnPath?: string;
}

export default function IngestModal({ isOpen, onClose, onSuccess, returnPath }: IngestModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [salts, setSalts] = useState<SaltEntry[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    manufacturer: '',
    form: 'Tablet',
    hsnCode: '',
    requiresPrescription: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Get storeId from localStorage
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setStoreId(user.storeId || '');
      } catch (error) {
        console.error('[IngestModal] Failed to parse user data:', error);
      }
    }
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    setErrors([]);
    setProcessing(true);

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

      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const result = await SaltOCRService.processImage(file);

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
    } catch (error) {
      setErrors(['Failed to upload image. Please try again.']);
    } finally {
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

    fetch(photoDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        handleImageUpload(file);
      })
      .catch(err => {
        console.error('Failed to process camera photo:', err);
        setErrors(['Failed to process camera photo. Please try again.']);
      });
  };

  const addSaltRow = () => {
    setSalts([
      ...salts,
      {
        id: `salt-${Date.now()}`,
        name: '',
        strengthValue: null,
        strengthUnit: null,
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
        s.id === id ? { ...s, [field]: value } : s
      )
    );
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

  const handleSubmit = async () => {
    setErrors([]);

    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Medicine name is required');
    }

    if (salts.length === 0) {
      validationErrors.push('Please add at least one salt composition');
    }

    salts.forEach((salt, index) => {
      if (!salt.name.trim()) {
        validationErrors.push(`Salt ${index + 1}: Name is required`);
      }
      if (salt.strengthValue !== null && !salt.strengthUnit) {
        validationErrors.push(`Salt ${index + 1}: Unit is required when strength is provided`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setProcessing(true);

      if (!storeId) {
        setErrors(['Store not found. Please log in again or select a store.']);
        setProcessing(false);
        return;
      }

      const response = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeId,
          saltLinks: salts.map((salt, index) => ({
            saltId: salt.saltId,
            name: salt.name,
            strengthValue: salt.strengthValue,
            strengthUnit: salt.strengthUnit,
            order: index,
          })),
          stripImageUrl: image,
          ocrMetadata: {
            confidence: ocrConfidence,
            extractedSalts: salts,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create medicine');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save medicine. Please try again.']);
    } finally {
      setProcessing(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Add New Medicine</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {errors.length > 0 && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                <ul className="list-disc list-inside text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <FiCheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Medicine created successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Image Upload */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Strip Image (Optional)</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Optional</span>
              </div>

              {!image ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50">
                  <FiCamera className="mx-auto h-12 w-12 text-[#0ea5a3] mb-3" />
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    Upload Strip Photo (Optional)
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a photo to auto-extract composition, or skip and add details manually.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('modal-file-upload')?.click()}
                      className="border-[#0ea5a3] text-[#0ea5a3]"
                    >
                      <FiUpload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCameraCapture}
                      className="border-[#0ea5a3] text-[#0ea5a3]"
                    >
                      <FiCamera className="mr-2 h-4 w-4" />
                      Camera
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
                <div>
                  <img
                    src={image}
                    alt="Medicine strip"
                    className="w-full rounded-lg mb-3 max-h-64 object-contain"
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
                  >
                    Remove Image
                  </Button>
                </div>
              )}

              {processing && (
                <div className="flex items-center justify-center py-6">
                  <FiLoader className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm">Processing...</span>
                </div>
              )}
            </Card>

            {/* Right: Form */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Medicine Details</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="modal-name">Medicine Name *</Label>
                  <Input
                    id="modal-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Crocin 500"
                  />
                </div>

                <div>
                  <Label htmlFor="modal-manufacturer">Manufacturer</Label>
                  <Input
                    id="modal-manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="e.g., GSK"
                  />
                </div>

                <div>
                  <Label htmlFor="modal-form">Form</Label>
                  <select
                    id="modal-form"
                    value={formData.form}
                    onChange={(e) =>
                      setFormData({ ...formData, form: e.target.value })
                    }
                    className="w-full border rounded-md p-2"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="modal-hsnCode">HSN Code</Label>
                  <Input
                    id="modal-hsnCode"
                    value={formData.hsnCode}
                    onChange={(e) =>
                      setFormData({ ...formData, hsnCode: e.target.value })
                    }
                    placeholder="e.g., 30049099"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal-prescription"
                    checked={formData.requiresPrescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiresPrescription: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="modal-prescription">Requires Prescription</Label>
                </div>
              </div>
            </Card>
          </div>

          {/* Salt Suggestions */}
          {formData.name && salts.length === 0 && !showSuggestions && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowSuggestions(true)}
                className="w-full border-[#0ea5a3] text-[#0ea5a3]"
              >
                💡 Get Salt Suggestions for "{formData.name}"
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

          {/* Salt Composition */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Salt Composition *</h3>
                <p className="text-sm text-gray-500 mt-1">Add the active ingredients and their strengths</p>
              </div>
              <Button variant="default" size="sm" onClick={addSaltRow} className="bg-[#0ea5a3] hover:bg-[#0d9491]">
                <FiPlus className="mr-2 h-4 w-4" />
                Add Salt
              </Button>
            </div>

            {salts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-3">No salts added yet</p>
                <Button variant="outline" size="sm" onClick={addSaltRow}>
                  <FiPlus className="mr-2 h-4 w-4" />
                  Add First Salt
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {salts.map((salt) => (
                  <div
                    key={salt.id}
                    className="flex gap-3 items-start p-3 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Label>Salt Name</Label>
                        <Input
                          value={salt.name}
                          onChange={(e) =>
                            updateSalt(salt.id, 'name', e.target.value)
                          }
                          placeholder="e.g., Paracetamol"
                        />
                      </div>
                      <div>
                        <Label>Strength</Label>
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
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={salt.strengthUnit || ''}
                          onChange={(e) =>
                            updateSalt(salt.id, 'strengthUnit', e.target.value)
                          }
                          placeholder="mg"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getConfidenceBadgeColor(
                          salt.confidence
                        )}`}
                      >
                        {salt.confidence}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSaltRow(salt.id)}
                      >
                        <FiTrash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={processing}
              className="bg-[#0ea5a3] hover:bg-[#0d9491]"
            >
              {processing ? (
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
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <AdvancedCamera
          onCapture={handleCameraPhoto}
          onClose={() => setShowCamera(false)}
          title="Capture Medicine Strip"
        />
      )}
    </div>
  );
}
