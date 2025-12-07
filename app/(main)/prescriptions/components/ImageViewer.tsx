import React, { useState, useRef, useEffect } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCw, FiMaximize, FiMinimize, FiMove } from 'react-icons/fi';

interface ImageViewerProps {
    src: string;
    alt?: string;
    className?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = "Image", className = "" }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
    const handleZoomOut = () => {
        setScale(s => {
            const newScale = Math.max(s - 0.5, 1);
            if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset pos on full zoom out
            return newScale;
        });
    };

    const handleRotate = () => setRotation(r => (r + 90) % 360);

    const handleReset = () => {
        setScale(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const onMouseUp = () => setIsDragging(false);
    const onMouseLeave = () => setIsDragging(false);

    // Wheel zoom
    const onWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) handleZoomIn();
            else handleZoomOut();
        }
    };

    return (
        <div className={`relative flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm p-2 rounded-full shadow-lg border border-white/10">
                <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Zoom Out">
                    <FiZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-white font-mono min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Zoom In">
                    <FiZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1"></div>
                <button onClick={handleRotate} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Rotate">
                    <FiRotateCw className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Reset View">
                    <FiMinimize className="w-4 h-4" />
                </button>
            </div>

            {/* Image Area */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-hidden flex items-center justify-center cursor-${scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                />
            </div>

            {/* Helper Text */}
            <div className="absolute bottom-4 right-4 text-xs text-white/50 pointer-events-none select-none">
                {scale > 1 ? 'Drag to pan • ' : ''} Scroll/Ctrl+Scroll to zoom
            </div>
        </div>
    );
};

export default ImageViewer;
