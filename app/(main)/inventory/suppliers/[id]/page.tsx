import SupplierProfile from '@/components/inventory/suppliers/SupplierProfile';

export default function SupplierProfilePage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <SupplierProfile id={params.id} />
        </div>
    );
}
