export function PrescriptionDetailsSkeleton() {
    return (
        <div className="h-full flex flex-col">
            {/* Header Skeleton */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                        <div className="h-7 bg-gray-200 rounded-md w-48 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="bg-white border-b border-gray-200">
                <div className="flex gap-1 px-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 w-32 bg-gray-100 rounded-t-lg animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                            <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <div key={j}>
                                        <div className="h-3 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
