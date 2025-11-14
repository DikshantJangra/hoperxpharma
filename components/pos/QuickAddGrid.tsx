'use client';

const OTC_PRODUCTS = [
  { sku: 'paracetamol_500', name: 'Paracetamol', mrp: 45, stock: 250, batches: 3, gstRate: 12, strength: '500mg', batchId: 'B2025-01' },
  { sku: 'cetirizine_10', name: 'Cetirizine', mrp: 25, stock: 300, batches: 2, gstRate: 12, strength: '10mg', batchId: 'B2025-01' },
  { sku: 'ors_sachet', name: 'ORS', mrp: 15, stock: 500, batches: 1, gstRate: 12, strength: '21.8g', batchId: 'B2025-01' },
  { sku: 'vicks_10ml', name: 'Vicks', mrp: 35, stock: 200, batches: 1, gstRate: 18, strength: '10ml', batchId: 'B2025-01' },
];

export default function QuickAddGrid({ onAddProduct }: any) {
  return (
    <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
      <div className="text-xs font-medium text-[#64748b] mb-2">Quick Add (OTC)</div>
      <div className="grid grid-cols-4 gap-2">
        {OTC_PRODUCTS.map((product) => (
          <button
            key={product.sku}
            onClick={() => onAddProduct(product)}
            className="p-2 bg-white border border-[#e2e8f0] rounded-lg hover:border-[#0ea5a3] hover:bg-[#f0fdfa] text-left"
          >
            <div className="text-xs font-medium text-[#0f172a]">{product.name}</div>
            <div className="text-xs text-[#64748b] mt-0.5">₹{product.mrp}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
