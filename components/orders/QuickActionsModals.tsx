import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineDocumentDuplicate, HiOutlineDownload, HiOutlineUpload, HiOutlineSearch } from 'react-icons/hi';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';

interface QuickActionsModalsProps {
    storeId: string;
    activeModal: 'recent' | 'catalog' | 'template' | null;
    onClose: () => void;
    onDuplicatePO: (po: any) => void;
    onAddCatalogItem: (item: any) => void;
    onImportItems: (items: any[]) => void;
    selectedSupplierId?: string;
}

export default function QuickActionsModals({
    storeId,
    activeModal,
    onClose,
    onDuplicatePO,
    onAddCatalogItem,
    onImportItems,
    selectedSupplierId
}: QuickActionsModalsProps) {
    if (!activeModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {activeModal === 'recent' && (
                    <RecentPOsModal
                        storeId={storeId}
                        onClose={onClose}
                        onDuplicate={onDuplicatePO}
                    />
                )}
                {activeModal === 'catalog' && (
                    <SupplierCatalogModal
                        storeId={storeId}
                        supplierId={selectedSupplierId}
                        onClose={onClose}
                        onAdd={onAddCatalogItem}
                    />
                )}
                {activeModal === 'template' && (
                    <ImportTemplateModal
                        onClose={onClose}
                        onImport={onImportItems}
                    />
                )}
            </div>
        </div>
    );
}

function RecentPOsModal({ storeId, onClose, onDuplicate }: any) {
    const [loading, setLoading] = useState(true);
    const [pos, setPos] = useState<any[]>([]);

    useEffect(() => {
        loadRecentPOs();
    }, []);

    const loadRecentPOs = async () => {
        try {
            // Fetch last 10 POs
            const result = await apiClient.get(`/purchase-orders?limit=10&sort=createdAt:desc`);
            setPos(result.data.data || []);
        } catch (error) {
            toast.error('Failed to load recent POs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : pos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recent purchase orders found</p>
                ) : (
                    <div className="space-y-3">
                        {pos.map((po) => (
                            <div key={po.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors flex items-center justify-between group">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {po.poNumber}
                                        <span className="ml-2 text-sm text-gray-500 font-normal">
                                            ({new Date(po.createdAt).toLocaleDateString()})
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {po.supplier?.name} • {po.items?.length || 0} items • ₹{po.total}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDuplicate(po)}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <HiOutlineDocumentDuplicate className="w-4 h-4" />
                                    Duplicate
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function SupplierCatalogModal({ storeId, supplierId, onClose, onAdd }: any) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (supplierId) {
            loadCatalog();
        }
    }, [supplierId]);

    const loadCatalog = async () => {
        setLoading(true);
        try {
            // In a real app, fetching catalog by supplier
            // For now, fetching drugs and filtering or creating a mock endpoint
            // Assuming GET /drugs accepts supplierId or we search generic drugs
            const endpoint = supplierId
                ? `/drugs?supplierId=${supplierId}&limit=50`
                : `/drugs?limit=50`;

            const result = await apiClient.get(endpoint);
            setItems(result.data.data || []);
        } catch (error) {
            // toast.error('Failed to load catalog');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    {supplierId ? 'Supplier Catalog' : 'Drug Catalog'}
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                {!supplierId && (
                    <p className="text-xs text-yellow-600 mt-2">
                        Tip: Select a supplier first to see their specific products and pricing.
                    </p>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items found</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                <div>
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">{item.strength} • {item.type}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        onAdd(item);
                                        toast.success('Item added');
                                    }}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    Add to PO
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function ImportTemplateModal({ onClose, onImport }: any) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Simple CSV parser
            const lines = text.split('\n');
            const items = lines.slice(1).map(line => {
                const [name, quantity, price] = line.split(',');
                if (!name) return null;
                return {
                    description: name.trim(),
                    qty: Number(quantity) || 1,
                    pricePerUnit: Number(price) || 0
                };
            }).filter(Boolean);

            onImport(items);
            onClose();
            toast.success(`Imported ${items.length} items`);
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const content = "Item Name,Quantity,Target Price\nParacetamol 500mg,100,2.50\nAmoxicillin 250mg,50,5.00";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "po_template.csv";
        a.click();
    };

    return (
        <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Import from Template</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
            <div className="p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <HiOutlineUpload className="w-8 h-8 text-emerald-600" />
                </div>

                <div>
                    <h4 className="text-gray-900 font-medium">Upload CSV File</h4>
                    <p className="text-gray-500 text-sm mt-1">
                        Upload a CSV file with your order items.
                    </p>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                        <HiOutlineDownload className="w-4 h-4" />
                        Download Template
                    </button>
                    <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer flex items-center gap-2 text-sm">
                        <HiOutlineUpload className="w-4 h-4" />
                        Select File
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-600">
                    <p className="font-medium mb-2">Format Guide:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Headers: Item Name, Quantity, Price</li>
                        <li>Example: "Dolo 650, 10, 30.5"</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
