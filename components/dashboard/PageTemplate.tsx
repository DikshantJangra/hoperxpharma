interface PageTemplateProps {
    title: string
    children: React.ReactNode
}

export default function PageTemplate({ title, children }: PageTemplateProps) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {children}
            </div>
        </div>
    )
}
