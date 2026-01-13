'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SaltOCRService } from '@/lib/salt-intelligence/ocr-service';
import { RegexMatcher, ExtractedComponent } from '@/lib/salt-intelligence/regex-matcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FiLoader, FiUpload, FiCamera, FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import AdvancedCamera from '@/components/camera/AdvancedCamera';

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

export default function IngestionPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [salts, setSalts] = useState<SaltEntry[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    manufacturer: '',
    form: 'Tablet',
    hsnCode: '',
    requiresPrescription: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    setErrors([]);
    setProcessing(true);

    try {
      // Basic validation - be more forgiving
      if (file.size > 10 * 1024 * 1024) { // 10MB limit (increased from 5MB)
        setErrors(['Image file is too large. Please use an image under 10MB.']);
        setProcessing(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(['Please upload a valid image file.']);
        setProcessing(false);
        return;
      }

      // Convert to data URL for display
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Try OCR processing - but don't fail if it doesn't work
      try {
        const result = await SaltOCRService.processImage(file);

        if (result.error) {
          // OCR failed, but that's okay - user can add salts manually
          console.warn('OCR processing failed:', result.error);
          setErrors(['Could not extract composition automatically. Please add salts manually below.']);
        } else {
          setOcrConfidence(result.confidence);
          
          // Auto-fill medicine details from OCR
          if (result.medicineName || result.manufacturer || result.form) {
            setFormData(prev => ({
              ...prev,
              name: result.medicineName || prev.name,
              manufacturer: result.manufacturer || prev.manufacturer,
              form: result.form || prev.form,
            }));
          }
          
          // Convert extracted salts to salt entries
          const saltEntries: SaltEntry[] = result.extractedSalts.map((salt, index) => ({
            id: `salt-${index}`,
            name: salt.name,
            strengthValue: salt.strengthValue,
            strengthUnit: salt.strengthUnit,
            confidence: salt.confidence,
          }));
          
          if (saltEntries.length > 0) {
            setSalts(saltEntries);
            setErrors([]); // Clear any previous errors
          } else {
            setErrors(['No composition detected in image. Please add salts manually below.']);
          }
        }
      } catch (ocrError) {
        // OCR completely failed - that's fine, user can add manually
        console.warn('OCR error:', ocrError);
        setErrors(['Image uploaded successfully. Please add salt composition manually below.']);
      }
    } catch (error) {
      setErrors(['Failed to upload image. Please try again.']);
    } finally {
      setProcessing(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle camera capture (mobile)
  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  // Handle camera photo taken
  const handleCameraPhoto = (photoDataUrl: string) => {
    setShowCamera(false);
    setImage(photoDataUrl);
    
    // Convert data URL to blob for OCR processing
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

  // Add new salt row
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
  };

  // Remove salt row
  const removeSaltRow = (id: string) => {
    setSalts(salts.filter((s) => s.id !== id));
  };

  // Update salt entry
  const updateSalt = (id: string, field: keyof SaltEntry, value: any) => {
    setSalts(
      salts.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  // Validate and submit
  const handleSubmit = async () => {
    setErrors([]);

    // Validation
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
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setProcessing(true);

      // Get storeId from localStorage (same pattern as other pages)
      const storeId = localStorage.getItem('primaryStore');
      
      if (!storeId) {
        setErrors(['Store not found. Please select a store first.']);
        setProcessing(false);
        return;
      }

      // Submit to API
      const response = await fetch('/api/drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeId, // Add storeId to the request
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
        router.push('/inventory');
      }, 2000);
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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/inventory')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
        >
          ← Back to Inventory
        </button>
        <h1 className="text-3xl font-bold">Add New Medicine</h1>
        <p className="text-gray-600 mt-2">
          Add medicine details and composition. Optionally upload a strip image to auto-extract composition.
        </p>
      </div>

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
            Medicine created successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Upload (Optional) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Strip Image (Optional)</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Optional</span>
          </div>

          {!image ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="mb-3">
                  <FiCamera className="mx-auto h-12 w-12 text-[#0ea5a3]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Upload Strip Photo (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  Upload a photo to auto-extract composition, or skip and add details manually below.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="border-[#0ea5a3] text-[#0ea5a3] hover:bg-[#f0fdfa]"
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleCameraCapture}
                    className="border-[#0ea5a3] text-[#0ea5a3] hover:bg-[#f0fdfa]"
                  >
                    <FiCamera className="mr-2 h-4 w-4" />
                    Camera
                  </Button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Any image quality works. If OCR fails, you can add composition manually.
                  </p>
                </div>
              </div>
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
          <h2 className="text-xl font-semibold mb-4">Medicine Details</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Crocin 500"
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="e.g., GSK"
              />
            </div>

            <div>
              <Label htmlFor="form">Form</Label>
              <select
                id="form"
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
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
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
                id="prescription"
                checked={formData.requiresPrescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresPrescription: e.target.checked,
                  })
                }
              />
              <Label htmlFor="prescription">Requires Prescription</Label>
            </div>
          </div>
        </Card>
      </div>

      {/* Salt Composition */}
      <Card className="p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Salt Composition *</h2>
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
            {salts.map((salt, index) => (
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
      <div className="flex justify-end gap-3 mt-6 pb-6">
        <Button variant="outline" onClick={() => router.push('/inventory')}>
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
