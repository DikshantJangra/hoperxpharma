"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { storeApi } from "@/lib/api/store"

export default function DashboardPage() {
    const router = useRouter()
    const { user, isAuthenticated, hasStore } = useAuthStore()
    const [store, setStore] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // If not authenticated, redirect to login
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login')
        }
    }, [isAuthenticated, router])

    // Fetch store data if onboarding complete
    useEffect(() => {
        const fetchStore = async () => {
            try {
                const storeData = await storeApi.getMyStore()
                setStore(storeData)
            } catch (e) {
                console.error('Failed to fetch store', e)
            } finally {
                setLoading(false)
            }
        }
        if (hasStore) fetchStore()
    }, [hasStore])

    if (!isAuthenticated) return null

    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Welcome, {userName}!</h1>
            {loading ? (
                <p>Loading store information...</p>
            ) : store ? (
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-2">Your Store</h2>
                    <p><strong>Name:</strong> {store.name || store.displayName}</p>
                    <p><strong>Address:</strong> {store.addressLine1}, {store.city}, {store.state} - {store.pinCode}</p>
                    {store.gstin && <p><strong>GSTIN:</strong> {store.gstin}</p>}
                </div>
            ) : (
                <p>No store information available.</p>
            )}
        </div>
    );
}
