import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void;
    minLength?: number;
    timeThreshold?: number; // max time between keystrokes to be considered a scan
}

export function useBarcodeScanner({
    onScan,
    minLength = 3,
    timeThreshold = 50
}: UseBarcodeScannerProps) {
    // Buffer to store characters
    const buffer = useRef<string>('');
    // Timer to clear buffer if typing is too slow (manual entry)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field (search box, etc)
            // BUT: Some scanners act as keyboard input. If the focus is on a text input,
            // we usually want that input to handle it. 
            // HOWEVER: The requirement is "Scan -> Add". 
            // If we focus the search box, the search box handles it.
            // If we are NOT focused on an input, we want to capture it.

            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // If key is Enter, check buffer
            if (e.key === 'Enter') {
                const scannedCode = buffer.current;
                if (scannedCode.length >= minLength) {
                    console.log('🔫 Scanner detected:', scannedCode);
                    e.preventDefault(); // Prevent default Enter behavior
                    onScan(scannedCode);
                }
                buffer.current = '';
                return;
            }

            // If key is printable character, add to buffer
            if (e.key.length === 1) {
                // Clear previous timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                buffer.current += e.key;

                // Set timeout to clear buffer if next key doesn't come fast enough
                // Scanners type VERY fast (<20ms per char). Manual typing is >100ms.
                timeoutRef.current = setTimeout(() => {
                    buffer.current = '';
                }, timeThreshold);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [onScan, minLength, timeThreshold]);
}
