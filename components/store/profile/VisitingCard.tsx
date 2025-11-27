import React from "react";
import { FiMapPin, FiPhone, FiMail, FiGlobe } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

interface VisitingCardProps {
    profile: any;
}

export default function VisitingCard({ profile }: VisitingCardProps) {
    if (!profile) return null;

    return (
        <div className="w-full max-w-md mx-auto perspective-1000">
            <div className="relative w-full aspect-[1.586] rounded-xl shadow-2xl overflow-hidden transform transition-transform hover:scale-[1.02] duration-300 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col justify-between border border-gray-700/50">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
                </div>

                {/* Top Section: Logo & Name */}
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                            {profile.name}
                        </h2>
                        {profile.displayName && (
                            <p className="text-sm text-gray-400 mt-1">{profile.displayName}</p>
                        )}
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {profile.businessType || "Pharmacy"}
                        </div>
                    </div>

                    {profile.logoUrl ? (
                        <img
                            src={profile.logoUrl}
                            alt="Logo"
                            className="w-16 h-16 rounded-lg object-cover border-2 border-white/10 shadow-lg bg-white"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white/10">
                            {profile.name.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Middle Section: Contact Details */}
                <div className="relative z-10 space-y-2 mt-4 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                            <FiPhone size={14} className="text-teal-400" />
                        </div>
                        <span>{profile.primaryContact?.phone}</span>
                    </div>

                    {profile.primaryContact?.whatsapp && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <FaWhatsapp size={14} className="text-green-400" />
                            </div>
                            <span>{profile.primaryContact.whatsapp}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                            <FiMail size={14} className="text-blue-400" />
                        </div>
                        <span className="truncate max-w-[200px]">{profile.primaryContact?.email || "No email"}</span>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiMapPin size={14} className="text-red-400" />
                        </div>
                        <span className="text-xs leading-relaxed">
                            {profile.address?.line1}, {profile.address?.city}, {profile.address?.state} - {profile.address?.postalCode}
                        </span>
                    </div>
                </div>

                {/* Bottom Section: Footer */}
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FiGlobe size={12} />
                        <span>{profile.website || "hoperx.com"}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                        Authorized Partner
                    </div>
                </div>

            </div>
        </div>
    );
}
