"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>HopeRxPharma Dashboard</h1>
            <p>Welcome back!</p>
            
            <div>
                <h2>Quick Actions</h2>
                <ul>
                    <li>Inventory Management</li>
                    <li>Billing & POS</li>
                    <li>Prescription Management</li>
                    <li>Reports & Analytics</li>
                </ul>
            </div>

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}