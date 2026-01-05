'use client';
import { MedicineMasterProvider } from '@/contexts/MedicineMasterContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <MedicineMasterProvider>
            {children}
        </MedicineMasterProvider>
    );
}
