"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { getStoreGSTIN } from "@/lib/api/user"

export default function DashboardPage() {
    const router = useRouter()
    const { user, primaryStore, isAuthenticated, hasStore, isLoading } = useAuthStore()

    // If not authenticated, redirect to login
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login')
        }
    }, [isAuthenticated, isLoading, router])

    // If authenticated but no store, redirect to onboarding
    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasStore) {
            router.replace('/onboarding')
        }
    }, [isAuthenticated, hasStore, isLoading, router])

    if (!isAuthenticated || !hasStore) return null

    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
    const gstin = primaryStore ? getStoreGSTIN(primaryStore) : '-';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Welcome, {userName}!</h1>
            {isLoading ? (
                <div className="bg-white shadow rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            ) : primaryStore ? (
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-2">Your Pharmacy</h2>
                    <p><strong>Name:</strong> {primaryStore.displayName || primaryStore.name}</p>
                    <p><strong>Address:</strong> {primaryStore.addressLine1}, {primaryStore.city}, {primaryStore.state} - {primaryStore.pinCode}</p>
                    <p><strong>Phone:</strong> {primaryStore.phoneNumber}</p>
                    <p><strong>Email:</strong> {primaryStore.email}</p>
                    {gstin !== '-' && <p><strong>GSTIN:</strong> {gstin}</p>}
                    {primaryStore.is24x7 && <p className="text-emerald-600 font-medium mt-2">✓ 24x7 Service Available</p>}
                    {primaryStore.homeDelivery && <p className="text-emerald-600 font-medium">✓ Home Delivery Available</p>}
                </div>
            ) : (
                <p>No store information available.</p>
            )}
        </div>
    );
}
