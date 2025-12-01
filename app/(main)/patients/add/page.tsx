"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddPatientPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to list page with a flag to open the drawer
        router.push("/patients/list?openDrawer=true");
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">Redirecting to patient list...</p>
            </div>
        </div>
    );
}
