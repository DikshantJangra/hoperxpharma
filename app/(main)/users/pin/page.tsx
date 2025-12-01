"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PINRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Team Hub - PIN management is now integrated into user creation/editing
    router.replace("/users");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Team Hub...</p>
        <p className="text-sm text-gray-500 mt-2">PIN management is now part of user profiles</p>
      </div>
    </div>
  );
}
