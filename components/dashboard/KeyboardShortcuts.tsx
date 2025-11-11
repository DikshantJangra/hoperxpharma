"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FiX } from "react-icons/fi"

export default function KeyboardShortcuts() {
    const [showHelp, setShowHelp] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Show help overlay
            if (e.shiftKey && e.key === '?') {
                e.preventDefault()
                setShowHelp(true)
                return
            }

            // Close help with Escape
            if (e.key === 'Escape' && showHelp) {
                setShowHelp(false)
                return
            }

            // Focus search
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
                searchInput?.focus()
                return
            }

            // Navigation shortcuts (g + key)
            if (e.key === 'g') {
                const nextKey = new Promise<string>((resolve) => {
                    const handler = (event: KeyboardEvent) => {
                        resolve(event.key)
                        window.removeEventListener('keydown', handler)
                    }
                    window.addEventListener('keydown', handler)
                    setTimeout(() => {
                        window.removeEventListener('keydown', handler)
                        resolve('')
                    }, 1000)
                })

                nextKey.then((key) => {
                    if (key === 'd') router.push('/dashboard/overview')
                    if (key === 'p') router.push('/dashboard/prescriptions/new')
                })
                return
            }

            // Quick actions
            if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                // Trigger new Rx modal
                console.log('New Rx triggered')
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [router, showHelp])

    if (!showHelp) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                    <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <ShortcutSection title="Navigation">
                        <ShortcutItem keys={['/']} description="Focus search" />
                        <ShortcutItem keys={['g', 'd']} description="Go to Dashboard" />
                        <ShortcutItem keys={['g', 'p']} description="Go to Prescriptions" />
                    </ShortcutSection>

                    <ShortcutSection title="Actions">
                        <ShortcutItem keys={['n']} description="New Rx (OCR)" />
                        <ShortcutItem keys={['s']} description="Start Fill" />
                        <ShortcutItem keys={['Enter']} description="Open selected item" />
                    </ShortcutSection>

                    <ShortcutSection title="Queue Navigation">
                        <ShortcutItem keys={['k']} description="Previous item" />
                        <ShortcutItem keys={['j']} description="Next item" />
                    </ShortcutSection>

                    <ShortcutSection title="Help">
                        <ShortcutItem keys={['Shift', '?']} description="Show this help" />
                        <ShortcutItem keys={['Esc']} description="Close dialogs" />
                    </ShortcutSection>
                </div>
            </div>
        </div>
    )
}

function ShortcutSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function ShortcutItem({ keys, description }: { keys: string[], description: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{description}</span>
            <div className="flex items-center gap-1">
                {keys.map((key, idx) => (
                    <kbd key={idx} className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700">
                        {key}
                    </kbd>
                ))}
            </div>
        </div>
    )
}
