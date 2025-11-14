'use client';

import LicenseCard from './LicenseCard';

const MOCK_LICENSES = [
  { id: '1', type: 'Drug License', number: 'DL-IN-12345', authority: 'State Drug Controller - JK', status: 'approved', validFrom: '2023-05-01', validTo: '2026-04-30', uploader: 'Aman Kumar', lastUpdated: '2025-10-01', daysToExpiry: 120 },
  { id: '2', type: 'GST Registration', number: 'GST-27AABCU9603R1ZM', authority: 'GST Department', status: 'approved', validFrom: '2022-01-15', validTo: '2027-01-14', uploader: 'Riya Sharma', lastUpdated: '2024-12-15', daysToExpiry: 450 },
  { id: '3', type: 'Pharmacy License', number: 'PH-MH-67890', authority: 'Maharashtra FDA', status: 'expiring', validFrom: '2024-03-01', validTo: '2025-02-28', uploader: 'Priya Patel', lastUpdated: '2024-11-20', daysToExpiry: 28 },
  { id: '4', type: 'Narcotic License', number: 'NL-DL-11223', authority: 'Narcotics Control Bureau', status: 'pending', validFrom: '2025-01-01', validTo: '2026-12-31', uploader: 'Amit Singh', lastUpdated: '2025-01-05', daysToExpiry: 365 },
];

export default function LicenseList({ filter, searchQuery, onSelectLicense }: any) {
  const filtered = MOCK_LICENSES.filter(lic => {
    const matchesFilter = filter === 'all' || lic.status === filter || (filter === 'expiring' && lic.daysToExpiry < 60);
    const matchesSearch = lic.number.toLowerCase().includes(searchQuery.toLowerCase()) || lic.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(license => (
          <LicenseCard key={license.id} license={license} onClick={() => onSelectLicense(license)} />
        ))}
      </div>
    </div>
  );
}
