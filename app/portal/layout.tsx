import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'HopeRx Patient Portal',
    description: 'Secure access to your prescriptions',
};

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
            <nav className="bg-teal-700 text-white shadow-sm">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight">HopeRx Portal</span>
                    </div>
                </div>
            </nav>
            <main className="max-w-md mx-auto px-4 py-6">
                {children}
            </main>
            <Toaster position="top-center" />
        </div>
    );
}
