"use client"
import Link from "next/link"
import { FiShield, FiHome, FiArrowLeft } from "react-icons/fi"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                        <FiShield className="w-10 h-10 text-red-600" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h1>

                    {/* Error Code */}
                    <p className="text-sm font-medium text-red-600 mb-4">
                        Error 403 - Forbidden
                    </p>

                    {/* Description */}
                    <p className="text-gray-600 mb-8">
                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            <FiArrowLeft size={18} />
                            Go Back
                        </button>
                        <Link
                            href="/dashboard/overview"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <FiHome size={18} />
                            Dashboard
                        </Link>
                    </div>

                    {/* Help Text */}
                    <p className="text-xs text-gray-500 mt-6">
                        Need help? Contact your system administrator
                    </p>
                </div>
            </div>
        </div>
    )
}
