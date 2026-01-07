'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiClock, FiInfo, FiPackage, FiCalendar, FiMapPin, FiHash } from 'react-icons/fi';
import { RiCapsuleFill } from 'react-icons/ri';

interface MedicationsTabProps {
  prescription: any;
  onUpdate: () => void;
}

export default function MedicationsTab({ prescription, onUpdate }: MedicationsTabProps) {
  const medications = prescription?.items || [];

  if (medications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RiCapsuleFill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Medications</h3>
          <p className="text-gray-500">No medications have been added to this prescription yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {medications.map((medication: any, index: number) => (
        <Card key={medication.id || index}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <RiCapsuleFill className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{medication.drug?.name || 'Unknown Medication'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {medication.drug?.strength && `${medication.drug.strength} • `}
                    {medication.drug?.form || 'Tablet'}
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {medication.status || 'Active'}
              </Badge>
            </div>

            {/* Main Prescription Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity Prescribed</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{medication.quantityPrescribed || medication.quantity || 0} units</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dosage Instructions</label>
                <p className="text-sm text-gray-900 mt-1">{medication.sig || 'As directed'}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</label>
                <p className="text-sm text-gray-900 mt-1">{medication.daysSupply ? `${medication.daysSupply} days` : 'Not specified'}</p>
              </div>
            </div>

            {/* Batch Information */}
            {medication.batch && (
              <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <FiPackage className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Batch Information</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiHash className="h-3 w-3" />
                      Batch Number
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{medication.batch.batchNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      Expiry Date
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(medication.batch.expiryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiPackage className="h-3 w-3" />
                      Stock Available
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{medication.batch.quantityInStock} units</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiMapPin className="h-3 w-3" />
                      Location
                    </label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{medication.batch.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Drug Info */}
            {medication.drug && (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {medication.drug.manufacturer && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manufacturer</label>
                    <p className="font-medium text-gray-900 mt-1">{medication.drug.manufacturer}</p>
                  </div>
                )}
                {medication.drug.requiresPrescription !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Requires Prescription</label>
                    <p className="font-medium text-gray-900 mt-1">{medication.drug.requiresPrescription ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {medication.batch?.mrp && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">MRP</label>
                    <p className="font-medium text-gray-900 mt-1">₹{parseFloat(medication.batch.mrp).toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Substitution Info */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${medication.substitutionAllowed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Substitution {medication.substitutionAllowed ? 'Allowed' : 'Not Allowed'}</span>
              </div>
              {medication.isControlled && (
                <Badge variant="destructive" className="text-xs">Controlled Substance</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}