'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MessagesPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/messages/whatsapp');
    }, [router]);
    
    return null;
}
