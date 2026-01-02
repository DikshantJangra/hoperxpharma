'use client';

export default function EmailShimmer() {
    return (
        <div className="h-screen flex bg-[#f8fafc] animate-pulse">
            {/* Left Sidebar Shimmer */}
            <div className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col">
                {/* Header Shimmer */}
                <div className="p-6 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] rounded-lg shimmer"></div>
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 bg-[#e2e8f0] rounded shimmer w-20"></div>
                            <div className="h-3 bg-[#f1f5f9] rounded shimmer w-32"></div>
                        </div>
                    </div>
                </div>

                {/* Navigation Shimmer */}
                <nav className="flex-1 p-4">
                    <div className="space-y-1">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg">
                                <div className="w-4 h-4 bg-[#e2e8f0] rounded shimmer"></div>
                                <div className="h-3 bg-[#e2e8f0] rounded shimmer w-20"></div>
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Footer Shimmer */}
                <div className="p-4 border-t border-[#e2e8f0]">
                    <div className="h-3 bg-[#e2e8f0] rounded shimmer w-24 mb-2"></div>
                    <div className="h-2 bg-[#f1f5f9] rounded shimmer w-32"></div>
                </div>
            </div>

            {/* Main Content Area Shimmer */}
            <div className="flex-1 flex flex-col">
                {/* Header Shimmer */}
                <div className="bg-white border-b border-[#e2e8f0] px-8 py-4">
                    <div className="h-8 bg-[#e2e8f0] rounded shimmer w-48 mb-2"></div>
                    <div className="h-4 bg-[#f1f5f9] rounded shimmer w-64"></div>
                </div>

                {/* Content Shimmer */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl space-y-5">
                        {/* Form fields shimmer */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <div className="h-4 bg-[#e2e8f0] rounded shimmer w-16 mb-2"></div>
                                <div className="h-11 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg shimmer"></div>
                            </div>
                        ))}

                        {/* Textarea shimmer */}
                        <div>
                            <div className="h-4 bg-[#e2e8f0] rounded shimmer w-20 mb-2"></div>
                            <div className="h-48 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg shimmer"></div>
                        </div>

                        {/* Button shimmer */}
                        <div className="h-12 bg-[#e2e8f0] rounded-lg shimmer w-36"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                .shimmer {
                    animation: shimmer 2s infinite linear;
                    background: linear-gradient(
                        to right,
                        #f8fafc 4%,
                        #e2e8f0 25%,
                        #f8fafc 36%
                    );
                    background-size: 1000px 100%;
                }
            `}</style>
        </div>
    );
}

// Variant for Settings Section
export function SettingsShimmer() {
    return (
        <div className="max-w-4xl space-y-4 animate-pulse">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-[#e2e8f0] rounded-full shimmer"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 bg-[#e2e8f0] rounded shimmer w-48"></div>
                                <div className="h-4 bg-[#f1f5f9] rounded shimmer w-32"></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-[#e2e8f0] rounded shimmer"></div>
                            <div className="w-8 h-8 bg-[#e2e8f0] rounded shimmer"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#e2e8f0]">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="space-y-1">
                                <div className="h-3 bg-[#f1f5f9] rounded shimmer w-16"></div>
                                <div className="h-4 bg-[#e2e8f0] rounded shimmer w-24"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                .shimmer {
                    animation: shimmer 2s infinite linear;
                    background: linear-gradient(
                        to right,
                        #f8fafc 4%,
                        #e2e8f0 25%,
                        #f8fafc 36%
                    );
                    background-size: 1000px 100%;
                }
            `}</style>
        </div>
    );
}

// Variant for Sent Emails/Logs Section
export function LogsShimmer() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-5 bg-[#e2e8f0] rounded shimmer w-48"></div>
                                <div className="w-16 h-5 bg-[#f1f5f9] rounded-full shimmer"></div>
                            </div>
                            <div className="h-4 bg-[#f1f5f9] rounded shimmer w-64"></div>
                            <div className="h-3 bg-[#f8fafc] rounded shimmer w-32"></div>
                        </div>
                        <div className="w-6 h-6 bg-[#e2e8f0] rounded shimmer"></div>
                    </div>
                </div>
            ))}

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                .shimmer {
                    animation: shimmer 2s infinite linear;
                    background: linear-gradient(
                        to right,
                        #f8fafc 4%,
                        #e2e8f0 25%,
                        #f8fafc 36%
                    );
                    background-size: 1000px 100%;
                }
            `}</style>
        </div>
    );
}
