"use client"
import { useState, useEffect } from "react";
import DrugSearch from "@/components/knowledge/DrugSearch";
import DrugCard from "@/components/knowledge/DrugCard";
import { FiFilter } from "react-icons/fi";

const DrugCardSkeleton = () => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
)

export default function DrugInfoPage() {
    const [drugs, setDrugs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setDrugs([]);
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#f7fafc]">
            <DrugSearch />

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Popular Medicines</h2>
                        {isLoading ? (
                            <div className="h-4 bg-gray-200 rounded w-48 mt-0.5 animate-pulse"></div>
                        ) : (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Showing {drugs.length} of {drugs.length > 0 ? 'many' : 'no'} medicines
                            </p>
                        )}
                    </div>
                    <button 
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        <FiFilter className="h-4 w-4" />
                        Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <>
                            <DrugCardSkeleton/>
                            <DrugCardSkeleton/>
                            <DrugCardSkeleton/>
                            <DrugCardSkeleton/>
                            <DrugCardSkeleton/>
                            <DrugCardSkeleton/>
                        </>
                    ) : drugs.length > 0 ? (
                        drugs.map((drug) => (
                            <DrugCard key={drug.slug} {...drug} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-gray-500 text-sm">
                            No drugs found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
