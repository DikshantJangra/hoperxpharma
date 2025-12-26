'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FiPackage, FiCalendar, FiUser } from 'react-icons/fi';

interface DispenseHistoryTabProps {
  prescriptionId: string;
}

export default function DispenseHistoryTab({ prescriptionId }: DispenseHistoryTabProps) {
  // Mock data - in real app, fetch from API
  const dispenseHistory = [
    {
      id: '1',
      dispensedAt: new Date().toISOString(),
      dispensedBy: 'John Pharmacist',
      quantity: '30 tablets',
      status: 'COMPLETED',
      notes: 'Patient counseled on side effects'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <FiPackage className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Dispense History</h3>
      </div>

      {dispenseHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Dispense History</h3>
            <p className="text-gray-500">No medications have been dispensed for this prescription yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dispenseHistory.map((dispense: any) => (
            <Card key={dispense.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiCalendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(dispense.dispensedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUser className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Dispensed by {dispense.dispensedBy}</span>
                    </div>
                  </div>
                  
                  <Badge variant={dispense.status === 'COMPLETED' ? 'default' : 'outline'}>
                    {dispense.status}
                  </Badge>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500">Quantity Dispensed</label>
                  <p className="text-sm">{dispense.quantity}</p>
                </div>

                {dispense.notes && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <label className="text-sm font-medium text-blue-800">Notes</label>
                    <p className="text-sm text-blue-700 mt-1">{dispense.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}