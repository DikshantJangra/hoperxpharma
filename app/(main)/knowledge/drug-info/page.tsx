import DrugSearch from "@/components/knowledge/DrugSearch";
import DrugCard from "@/components/knowledge/DrugCard";
import { FiFilter } from "react-icons/fi";

export default function DrugInfoPage() {
    const drugs = [
        {
            name: "Dolo 650",
            brand: "Micro Labs",
            category: "Analgesic",
            type: "OTC" as const,
            description: "Paracetamol 650mg tablet used for fever and mild to moderate pain relief.",
            slug: "dolo-650"
        },
        {
            name: "Augmentin 625",
            brand: "GSK",
            category: "Antibiotic",
            type: "Rx" as const,
            description: "Amoxicillin and Potassium Clavulanate combination for bacterial infections.",
            slug: "augmentin-625"
        },
        {
            name: "Pan 40",
            brand: "Alkem",
            category: "PPI",
            type: "Rx" as const,
            description: "Pantoprazole 40mg gastro-resistant tablet for acidity and GERD.",
            slug: "pan-40"
        },
        {
            name: "Allegra 120",
            brand: "Sanofi",
            category: "Antihistamine",
            type: "OTC" as const,
            description: "Fexofenadine Hydrochloride 120mg for allergic rhinitis and skin allergies.",
            slug: "allegra-120"
        },
        {
            name: "Metolar XR 50",
            brand: "Cipla",
            category: "Beta Blocker",
            type: "Rx" as const,
            description: "Metoprolol Succinate extended release tablet for hypertension and angina.",
            slug: "metolar-xr-50"
        },
        {
            name: "Glycomet 500",
            brand: "USV",
            category: "Anti-diabetic",
            type: "Rx" as const,
            description: "Metformin Hydrochloride 500mg tablet for type 2 diabetes management.",
            slug: "glycomet-500"
        }
    ];

    return (
        <div className="min-h-screen bg-[#f7fafc]">
            <DrugSearch />

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Popular Medicines</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Showing 6 of 100,000+ medicines</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <FiFilter className="h-4 w-4" />
                        Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drugs.map((drug) => (
                        <DrugCard key={drug.slug} {...drug} />
                    ))}
                </div>
            </div>
        </div>
    );
}
