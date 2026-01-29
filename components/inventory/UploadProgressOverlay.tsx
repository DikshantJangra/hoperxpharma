'use client';

import React from 'react';
import { FiUpload, FiCheck } from 'react-icons/fi';
import { BsUpcScan } from 'react-icons/bs';

interface UploadProgressOverlayProps {
  progress: number; // 0-100
  stage: 'uploading' | 'processing' | 'extracting' | 'complete';
}

export default function UploadProgressOverlay({ progress, stage }: UploadProgressOverlayProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'uploading':
        return { text: 'Uploading image...', icon: <FiUpload className="w-5 h-5" /> };
      case 'processing':
        return { text: 'Processing with AI...', icon: <BsUpcScan className="w-5 h-5" /> };
      case 'extracting':
        return { text: 'Extracting medicine details...', icon: <BsUpcScan className="w-5 h-5" /> };
      case 'complete':
        return { text: 'Complete!', icon: <FiCheck className="w-5 h-5" /> };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideRight {
          0% { transform: translateX(-10px); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateX(calc(100vw + 10px)); opacity: 0; }
        }
        .shimmer { animation: shimmer 2s infinite; }
        .slide-right { animation: slideRight 3s linear infinite; }
      `}</style>
      
      <div className="absolute inset-0 z-50 bg-white backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200 overflow-hidden">
        {/* Animated Dots Moving Left to Right */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-0 w-2 h-2 bg-emerald-400 rounded-full opacity-40 slide-right" />
          <div className="absolute top-[35%] left-0 w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-30 slide-right" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          <div className="absolute top-[50%] left-0 w-2.5 h-2.5 bg-emerald-300 rounded-full opacity-50 slide-right" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute top-[65%] left-0 w-1 h-1 bg-emerald-600 rounded-full opacity-25 slide-right" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} />
          <div className="absolute top-[80%] left-0 w-2 h-2 bg-emerald-400 rounded-full opacity-35 slide-right" style={{ animationDelay: '2s', animationDuration: '4.5s' }} />
        </div>

        <div className="relative w-full max-w-sm px-8">
          {/* Main Content */}
          <div className="relative z-10 text-center">
            {/* Progress Percentage */}
            <div className="text-xl font-bold text-emerald-600 mb-2 tabular-nums">
              {Math.round(progress)}%
            </div>

            {/* Stage Text */}
            <div className="text-sm font-medium text-gray-700 mb-4">
              {stageInfo.text}
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-5">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 shimmer" />
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className={`flex flex-col items-center gap-1.5 transition-all ${['uploading', 'processing', 'extracting', 'complete'].includes(stage) ? 'text-emerald-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${['uploading', 'processing', 'extracting', 'complete'].includes(stage) ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span>Upload</span>
              </div>
              <div className="flex-1 h-[1px] bg-gray-300 mx-2" />
              <div className={`flex flex-col items-center gap-1.5 transition-all ${['processing', 'extracting', 'complete'].includes(stage) ? 'text-emerald-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${['processing', 'extracting', 'complete'].includes(stage) ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span>Process</span>
              </div>
              <div className="flex-1 h-[1px] bg-gray-300 mx-2" />
              <div className={`flex flex-col items-center gap-1.5 transition-all ${['extracting', 'complete'].includes(stage) ? 'text-emerald-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${['extracting', 'complete'].includes(stage) ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span>Extract</span>
              </div>
              <div className="flex-1 h-[1px] bg-gray-300 mx-2" />
              <div className={`flex flex-col items-center gap-1.5 transition-all ${stage === 'complete' ? 'text-emerald-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${stage === 'complete' ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span>Done</span>
              </div>
            </div>

            {/* Animated Details */}
            <div className="mt-4">
              {stage === 'uploading' && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 animate-in fade-in">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Securing your image...</span>
                </div>
              )}
              {stage === 'processing' && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 animate-in fade-in">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Reading medicine details...</span>
                </div>
              )}
              {stage === 'extracting' && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 animate-in fade-in">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Extracting composition...</span>
                </div>
              )}
              {stage === 'complete' && (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold animate-in fade-in">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Extraction complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
