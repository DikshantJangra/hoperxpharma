'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            closeButton
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#363636',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                },
                classNames: {
                    error: 'bg-red-50 text-red-900 border-red-200',
                    success: 'bg-green-50 text-green-900 border-green-200',
                    info: 'bg-blue-50 text-blue-900 border-blue-200',
                },
            }}
            style={{ zIndex: 99999 }}
        />
    );
}
