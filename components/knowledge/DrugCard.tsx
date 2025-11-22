import { FiChevronRight } from "react-icons/fi";
import { TbPill } from "react-icons/tb";
import Link from "next/link";

interface DrugCardProps {
    name: string;
    brand: string;
    category: string;
    type: "Rx" | "OTC";
    description: string;
    slug: string;
}

export default function DrugCard({ name, brand, category, type, description, slug }: DrugCardProps) {
    return (
        <Link href={`/knowledge/drug-info/${slug}`} className="block group">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-400 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TbPill className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {name}
                            </h3>
                            <p className="text-xs text-gray-500">{brand}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        type === "Rx" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                        {type}
                    </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                    {description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded">
                        {category}
                    </span>
                    <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                        View <FiChevronRight className="h-4 w-4" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
