'use client';

import DeviceCard from './DeviceCard';

const MOCK_DEVICES = [
  { id: '1', name: 'POS-1', type: 'pos_terminal', model: 'Sunmi V1', vendor: 'Sunmi', serial: 'SN-A12345', ip: '192.168.1.23', mac: 'AA:BB:CC:DD:EE:FF', status: 'online', lastSeen: '2 min ago', location: 'Counter 1', assignedTo: 'Aman Kumar' },
  { id: '2', name: 'Receipt Printer - Counter 1', type: 'printer', model: 'Epson TM-T82', vendor: 'Epson', serial: 'PR-12345', ip: '192.168.1.250', mac: 'AA:BB:CC:DD:EE:01', status: 'online', lastSeen: '5 min ago', location: 'Counter 1', assignedTo: 'Aman Kumar' },
  { id: '3', name: 'Barcode Scanner - Counter 2', type: 'scanner', model: 'Honeywell 1900', vendor: 'Honeywell', serial: 'SC-67890', ip: null, mac: null, status: 'offline', lastSeen: '2 hours ago', location: 'Counter 2', assignedTo: 'Riya Sharma' },
  { id: '4', name: 'UPI SoundBox', type: 'soundbox', model: 'Paytm SoundBox', vendor: 'Paytm', serial: 'SB-11223', ip: null, mac: 'BB:CC:DD:EE:FF:01', status: 'online', lastSeen: '1 min ago', location: 'Counter 1', assignedTo: null },
];

export default function DeviceList({ filter, searchQuery, onSelectDevice }: any) {
  const filtered = MOCK_DEVICES.filter(dev => {
    const matchesType = filter.type === 'all' || dev.type === filter.type;
    const matchesStatus = filter.status === 'all' || dev.status === filter.status;
    const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         dev.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (dev.ip && dev.ip.includes(searchQuery));
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(device => (
          <DeviceCard key={device.id} device={device} onClick={() => onSelectDevice(device)} />
        ))}
      </div>
    </div>
  );
}
