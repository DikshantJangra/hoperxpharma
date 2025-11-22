import SupplierProfile from '@/components/inventory/suppliers/SupplierProfile';

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <SupplierProfile id={id} />
        </div>
    );
}
