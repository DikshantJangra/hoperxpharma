import { FiMoreVertical, FiPhone, FiMail } from "react-icons/fi";
import { Prescriber } from "@/lib/api/prescribers";

interface PrescriberRowProps {
    prescriber: Prescriber;
    onEdit: (prescriber: Prescriber) => void;
}

export default function PrescriberRow({ prescriber, onEdit }: PrescriberRowProps) {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold border border-emerald-200">
                        {prescriber.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{prescriber.name}</div>
                        <div className="text-xs text-gray-500">{prescriber.specialty || 'General Practitioner'}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{prescriber.clinic || '-'}</div>
                <div className="text-xs text-gray-500">License: {prescriber.licenseNumber}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-2">
                    {prescriber.phoneNumber && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs text-gray-900 font-medium">
                                <FiPhone className="mr-1.5 w-3 h-3 text-gray-500" />
                                {prescriber.phoneNumber}
                            </div>
                            <div className="flex gap-1">
                                <a
                                    href={`tel:${prescriber.phoneNumber}`}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded bg-white border border-emerald-100 shadow-sm"
                                    title="Call"
                                >
                                    <FiPhone className="w-3 h-3" />
                                </a>
                                <a
                                    href={`https://wa.me/91${prescriber.phoneNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-green-600 hover:bg-green-50 rounded bg-white border border-green-100 shadow-sm"
                                    title="WhatsApp"
                                >
                                    {/* WhatsApp icon replacement or use text */}
                                    <span className="text-[10px] font-bold">WA</span>
                                </a>
                            </div>
                        </div>
                    )}
                    {prescriber.email && (
                        <div className="flex items-center text-xs text-gray-600">
                            <FiMail className="mr-1.5 w-3 h-3" />
                            {prescriber.email}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={() => onEdit(prescriber)}
                    className="text-emerald-600 hover:text-emerald-900 font-medium text-xs px-3 py-1.5 bg-emerald-50 rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                    Edit
                </button>
            </td>
        </tr>
    );
}
