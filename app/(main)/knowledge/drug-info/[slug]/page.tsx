import DrugDetail from "@/components/knowledge/DrugDetail";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default async function DrugDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // In a real app, fetch data based on slug
    // For now, we use a rich mock object
    const mockDrugData = {
        name: "Dolo 650",
        brand: "Micro Labs Ltd",
        category: "Analgesic / Antipyretic",
        type: "OTC" as const,
        manufacturer: "Micro Labs Ltd",
        overview: "Dolo 650 Tablet is a medicine used to relieve pain and to reduce fever. It is used to treat many conditions such as headache, body ache, toothache and common cold. It works by inhibiting the release of certain chemicals that cause pain and fever.",
        indications: [
            "Fever",
            "Headache",
            "Muscle Pain",
            "Menstrual Cramps",
            "Post-immunization pyrexia",
            "Arthritis"
        ],
        dosage: {
            adult: "650mg every 4-6 hours, not exceeding 4g/day",
            pediatric: "15mg/kg every 4-6 hours",
            renal: "Dose adjustment required in severe impairment"
        },
        moa: "Paracetamol acts primarily in the CNS, increasing the pain threshold by inhibiting both isoforms of cyclooxygenase, COX-1, COX-2, and COX-3 enzymes involved in prostaglandin (PG) synthesis.",
        sideEffects: {
            common: ["Nausea", "Vomiting", "Insomnia", "Headache"],
            serious: ["Liver damage (hepatotoxicity)", "Stevens-Johnson syndrome", "Anaphylaxis"]
        },
        contraindications: [
            "Hypersensitivity to Paracetamol",
            "Severe Liver Disease",
            "Chronic Alcoholism"
        ],
        precautions: [
            "Use with caution in patients with renal or hepatic impairment.",
            "Avoid alcohol consumption while taking this medication.",
            "Do not exceed recommended dose to prevent liver toxicity."
        ],
        pregnancy: "Category B. Generally considered safe for use during pregnancy when used as directed for short durations.",
        storage: "Store below 30°C. Protect from light and moisture.",
        price: "₹30.24 per strip of 15 tablets"
    };

    return (
        <div className="min-h-screen bg-[#f7fafc] pb-8">
            <div className="max-w-6xl mx-auto px-6 py-6">
                <Link
                    href="/knowledge/drug-info"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-5 transition-colors"
                >
                    <FiArrowLeft className="h-4 w-4" /> Back to Drug Database
                </Link>

                <DrugDetail data={mockDrugData} />
            </div>
        </div>
    );
}
