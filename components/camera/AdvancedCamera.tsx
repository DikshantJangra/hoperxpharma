'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiX, FiRotateCw, FiZoomIn, FiZoomOut, FiSun } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

interface AdvancedCameraProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
  title?: string;
}

export default function AdvancedCamera({ onCapture, onClose, title = 'Capture Image' }: AdvancedCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    checkCameraDevices();
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const checkCameraDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);

      // Check if zoom is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        setZoom(capabilities.zoom.min || 1);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please check permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleZoomIn = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        const newZoom = Math.min(zoom + 0.5, capabilities.zoom.max);
        track.applyConstraints({ advanced: [{ zoom: newZoom } as any] });
        setZoom(newZoom);
      }
    }
  };

  const handleZoomOut = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        const newZoom = Math.max(zoom - 0.5, capabilities.zoom.min || 1);
        track.applyConstraints({ advanced: [{ zoom: newZoom } as any] });
        setZoom(newZoom);
      }
    }
  };

  const toggleFlash = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);

    // Flash effect
    const flashDiv = document.createElement('div');
    flashDiv.style.cssText = `
      position: fixed;
      inset: 0;
      background: white;
      z-index: 9999;
      animation: flash 0.3s ease-out;
    `;
    document.body.appendChild(flashDiv);
    setTimeout(() => flashDiv.remove(), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      setTimeout(() => {
        stopCamera();
        onCapture(photoDataUrl);
        setCapturing(false);
      }, 300);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {error ? (
            <div className="text-center px-6 max-w-md">
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-4">
                <p className="text-white text-sm">{error}</p>
              </div>
              <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/10">
                Close
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-white/50 rounded-lg w-4/5 h-3/5 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                </div>
              </div>

              {/* Side Controls */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {hasMultipleCameras && (
                  <button
                    onClick={switchCamera}
                    className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all"
                    title="Switch Camera"
                  >
                    <FiRotateCw className="h-6 w-6" />
                  </button>
                )}
                
                <button
                  onClick={handleZoomIn}
                  className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all"
                  title="Zoom In"
                >
                  <FiZoomIn className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleZoomOut}
                  className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all"
                  title="Zoom Out"
                >
                  <FiZoomOut className="h-6 w-6" />
                </button>

                <button
                  onClick={toggleFlash}
                  className={`backdrop-blur-sm text-white p-3 rounded-full transition-all ${
                    flashEnabled ? 'bg-yellow-500/70 hover:bg-yellow-500/90' : 'bg-black/50 hover:bg-black/70'
                  }`}
                  title="Toggle Flash"
                >
                  <FiSun className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        {!error && (
          <div className="bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-center gap-6">
              <Button
                onClick={onClose}
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 px-8"
              >
                Cancel
              </Button>
              
              <button
                onClick={capturePhoto}
                disabled={capturing}
                className="relative w-20 h-20 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <FiCamera className="h-8 w-8 text-gray-800" />
                </div>
              </button>

              <div className="w-24"></div> {/* Spacer for symmetry */}
            </div>
            
            <p className="text-white/70 text-sm text-center mt-4">
              Position the medicine strip within the frame
            </p>
          </div>
        )}
      </div>
    </>
  );
}
