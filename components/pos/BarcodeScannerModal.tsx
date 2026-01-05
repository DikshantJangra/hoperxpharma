'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { IoClose, IoCameraReverse, IoSettings } from 'react-icons/io5';
import { BsCheckCircleFill } from 'react-icons/bs';
import { toast } from 'sonner';

interface BarcodeScannerModalProps {
    onClose: () => void;
    onScan: (barcode: string) => void;
}

interface CameraDevice {
    id: string;
    label: string;
}

export default function BarcodeScannerModal({ onClose, onScan }: BarcodeScannerModalProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
    const [showCameraSelector, setShowCameraSelector] = useState(false);
    const [scannedItems, setScannedItems] = useState<string[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const scanCooldownRef = useRef<boolean>(false);
    const regionId = "html5qr-code-full-region";

    // Enumerate cameras on mount
    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                console.log('📷 Available cameras:', devices);
                setCameras(devices);

                // Auto-select back camera if available
                const backCamera = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                );

                setSelectedCameraId(backCamera?.id || devices[0]?.id || null);
            } catch (err) {
                console.error('Failed to get cameras:', err);
                toast.error('Could not access camera devices');
            }
        };

        getCameras();
    }, []);

    // Start scanner when camera is selected
    useEffect(() => {
        if (selectedCameraId) {
            startScanner();
        }
        return () => {
            stopScanner();
        };
    }, [selectedCameraId]);

    const startScanner = async () => {
        if (!selectedCameraId) return;

        // Stop existing scanner first
        await stopScanner();

        try {
            const html5QrCode = new Html5Qrcode(regionId, {
                verbose: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            });
            scannerRef.current = html5QrCode;

            const config: Html5QrcodeCameraScanConfig = {
                fps: 10,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                disableFlip: false,
                // Advanced camera controls
                videoConstraints: {
                    focusMode: 'continuous',
                    advanced: [{ zoom: 2.0 }]
                }
            };

            await html5QrCode.start(
                selectedCameraId,
                config,
                (decodedText) => {
                    // SUCCESS CALLBACK - with anti-spam protection

                    // Skip if in cooldown
                    if (scanCooldownRef.current) {
                        console.log('⏱️ Scan cooldown active, ignoring:', decodedText);
                        return;
                    }

                    // Skip if same as last scanned
                    if (lastScanned === decodedText) {
                        console.log('🔄 Duplicate scan ignored:', decodedText);
                        return;
                    }

                    // Activate cooldown
                    scanCooldownRef.current = true;

                    console.log('📷 Camera Scan Success:', decodedText);
                    setLastScanned(decodedText);
                    setScannedItems(prev => [...prev, decodedText]);
                    onScan(decodedText);

                    // Release cooldown after 1.5 seconds
                    setTimeout(() => {
                        scanCooldownRef.current = false;
                        setLastScanned(null);
                    }, 1500);
                },
                (errorMessage) => {
                    // Ignore parse errors (they happen every frame)
                }
            );

            setIsScanning(true);
        } catch (err) {
            console.error("Failed to start scanner", err);
            toast.error("Failed to access camera. Please allow permissions.");
            onClose();
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
                scannerRef.current = null;
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const handleCameraChange = (cameraId: string) => {
        setSelectedCameraId(cameraId);
        setShowCameraSelector(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">

                {/* Header with Controls */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391]">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Scan Barcode</h3>
                        {scannedItems.length > 0 && (
                            <p className="text-xs text-white/80 mt-0.5">
                                {scannedItems.length} item{scannedItems.length !== 1 ? 's' : ''} scanned
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {/* Camera Selector - Always show */}
                        <button
                            onClick={() => setShowCameraSelector(!showCameraSelector)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors relative"
                            title="Camera Settings"
                            disabled={cameras.length === 0}
                        >
                            <IoSettings className="w-5 h-5 text-white" />
                            {showCameraSelector && cameras.length > 0 && (
                                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-2 w-64 z-10">
                                    <div className="text-sm font-medium text-gray-700 px-3 py-2">
                                        Select Camera ({cameras.length} available)
                                    </div>
                                    {cameras.map(camera => (
                                        <button
                                            key={camera.id}
                                            onClick={() => handleCameraChange(camera.id)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm ${selectedCameraId === camera.id
                                                    ? 'bg-[#0ea5a3] text-white'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {camera.label || `Camera ${camera.id.slice(0, 8)}...`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </button>
                        {/* Close */}
                        <button
                            onClick={() => { stopScanner(); onClose(); }}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <IoClose className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-black h-[420px] flex flex-col justify-center">
                    <div id={regionId} className="w-full h-full"></div>

                    {/* Guidelines Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-72 h-72 border-2 border-[#0ea5a3] rounded-lg relative">
                            {/* Corners */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#0ea5a3] -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#0ea5a3] -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#0ea5a3] -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#0ea5a3] -mb-1 -mr-1"></div>
                        </div>
                    </div>

                    {/* Success Indicator - Platform Teal Color */}
                    {lastScanned && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0ea5a3] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce">
                            <BsCheckCircleFill className="w-4 h-4" />
                            <span className="text-sm font-medium">Scanned!</span>
                        </div>
                    )}

                    {/* Camera Info */}
                    {selectedCameraId && cameras.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs">
                            {cameras.find(c => c.id === selectedCameraId)?.label || 'Camera Active'}
                        </div>
                    )}
                </div>

                {/* Footer - Instructions + Done Button */}
                <div className="p-4 bg-gray-50">
                    <div className="text-center mb-3">
                        <p className="text-sm font-medium text-gray-700">
                            Point camera at barcode. Auto-focus enabled.
                        </p>
                    </div>
                    <button
                        onClick={() => { stopScanner(); onClose(); }}
                        className="w-full py-3 bg-[#0ea5a3] hover:bg-[#0d9391] text-white font-medium rounded-lg transition-colors"
                    >
                        Done ({scannedItems.length} items)
                    </button>
                </div>
            </div>
        </div>
    );
}
