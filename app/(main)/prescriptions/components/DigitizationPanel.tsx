import React from 'react';
import ImageViewer from './ImageViewer';
import PrescriptionForm from './PrescriptionForm';
import { FiMinimize2, FiMaximize2 } from 'react-icons/fi';

interface DigitizationPanelProps {
    imageUrl: string;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
    ocrData?: any;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const DigitizationPanel: React.FC<DigitizationPanelProps> = ({
    imageUrl,
    onSave,
    onCancel,
    ocrData,
    isExpanded,
    onToggleExpand
}) => {
    return (
        <div className={`h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white ${isExpanded ? 'fixed inset-0 z-50' : ''}`}>

            {/* Left Panel: Image Viewer (40-50% width) */}
            <div className={`md:w-1/2 lg:w-[45%] h-[300px] md:h-full flex flex-col bg-gray-900 relative`}>
                <div className="absolute top-4 left-4 z-20">
                    <button
                        onClick={onToggleExpand}
                        className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                        {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                        {isExpanded ? 'Exit Fullscreen' : 'Fullscreen Work Mode'}
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-4">
                    <ImageViewer
                        src={imageUrl}
                        alt="Prescription Scan"
                        className="w-full h-full shadow-2xl border border-gray-700"
                    />
                </div>

                {/* OCR Text Preview (Optional overlay) */}
                {ocrData?.rawText && (
                    <div className="h-32 bg-gray-800 border-t border-gray-700 p-3 overflow-y-auto">
                        <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                            <span className="font-bold text-gray-300 block mb-1">OCR DETECTED TEXT:</span>
                            {ocrData.rawText}
                        </p>
                    </div>
                )}
            </div>

            {/* Right Panel: Data Entry Form */}
            <div className="flex-1 h-full overflow-y-auto bg-gray-50 relative">
                <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Digitize Prescription</h2>
                        <p className="text-sm text-gray-500">
                            Transcribe the details from the scanned image on the left.
                        </p>
                    </div>

                    <PrescriptionForm
                        onSubmit={onSave}
                        onCancel={onCancel}
                        scannedData={ocrData}
                    // If we had initial data from a draft, pass it here
                    // initialData={draftData} 
                    />
                </div>
            </div>
        </div>
    );
};

export default DigitizationPanel;
