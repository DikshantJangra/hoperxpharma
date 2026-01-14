'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FiRotateCw, FiZoomIn, FiZoomOut, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // Optional aspect ratio (width/height)
  autoProcess?: boolean; // Auto-process after a delay
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio,
  autoProcess = true,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoProcessTimer, setAutoProcessTimer] = useState<NodeJS.Timeout | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(2);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Center the image initially
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        setPosition({
          x: (containerWidth - img.width) / 2,
          y: (containerHeight - img.height) / 2,
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to container size
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center of image position
    const centerX = position.x + (image.width * scale) / 2;
    const centerY = position.y + (image.height * scale) / 2;
    ctx.translate(centerX, centerY);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw image centered
    ctx.drawImage(
      image,
      (-image.width * scale) / 2,
      (-image.height * scale) / 2,
      image.width * scale,
      image.height * scale
    );

    // Restore context state
    ctx.restore();

    // Draw crop overlay (semi-transparent border)
    const cropPadding = 20;
    ctx.strokeStyle = '#0ea5a3';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      cropPadding,
      cropPadding,
      canvas.width - cropPadding * 2,
      canvas.height - cropPadding * 2
    );
  }, [image, scale, rotation, position]);

  // Auto-process timer
  useEffect(() => {
    if (autoProcess && image) {
      // Clear existing timer
      if (autoProcessTimer) {
        clearTimeout(autoProcessTimer);
      }

      // Reset countdown
      setAutoCountdown(2);

      // Countdown interval
      const countdownInterval = setInterval(() => {
        setAutoCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      // Set new timer for auto-processing after 2 seconds of no changes
      const timer = setTimeout(() => {
        clearInterval(countdownInterval);
        handleCrop();
      }, 2000);

      setAutoProcessTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [scale, rotation, position, image, autoProcess, handleCrop]);

  // Mouse/Touch handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => setScale(parseFloat(e.target.value));

  // Rotation handlers
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => setRotation(parseInt(e.target.value));

  // Reset
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    if (image && containerRef.current) {
      setPosition({
        x: (containerRef.current.clientWidth - image.width) / 2,
        y: (containerRef.current.clientHeight - image.height) / 2,
      });
    }
  };

  // Crop and export
  const handleCrop = useCallback(async () => {
    if (!image || !canvasRef.current) return;

    setProcessing(true);

    try {
      const canvas = canvasRef.current;
      const cropPadding = 20;

      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const cropWidth = canvas.width - cropPadding * 2;
      const cropHeight = canvas.height - cropPadding * 2;
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) return;

      // Copy the cropped area
      cropCtx.drawImage(
        canvas,
        cropPadding,
        cropPadding,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Convert to blob
      cropCanvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
          setProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (error) {
      console.error('Crop error:', error);
      setProcessing(false);
    }
  }, [image, onCropComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-white">
          <FiX className="h-5 w-5 mr-1" />
          Cancel
        </Button>
        <h3 className="text-white font-medium">Adjust Image</h3>
        <Button
          variant="default"
          size="sm"
          onClick={handleCrop}
          disabled={processing}
          className="bg-[#0ea5a3] hover:bg-[#0d9491]"
        >
          {processing ? (
            'Processing...'
          ) : (
            <>
              <FiCheck className="h-5 w-5 mr-1" />
              Done
            </>
          )}
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
        
        {/* Auto-process indicator */}
        {autoProcess && !processing && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
            Auto-processing in {autoCountdown}s...
          </div>
        )}
        {processing && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[#0ea5a3]/80 text-white text-xs px-3 py-1 rounded-full">
            Processing...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-4 py-4 space-y-4">
        {/* Zoom Control */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="text-white">
            <FiZoomOut className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <input
              type="range"
              value={scale}
              min={0.3}
              max={3}
              step={0.1}
              onChange={handleScaleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#0ea5a3]"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="text-white">
            <FiZoomIn className="h-5 w-5" />
          </Button>
          <span className="text-white text-sm w-12 text-right">{Math.round(scale * 100)}%</span>
        </div>

        {/* Rotation Control */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleRotate} className="text-white">
            <FiRotateCw className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={handleRotationChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#0ea5a3]"
            />
          </div>
          <span className="text-white text-sm w-12 text-right">{rotation}°</span>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleReset} className="text-white border-white/30">
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
