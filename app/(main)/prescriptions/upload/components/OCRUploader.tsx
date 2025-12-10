'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import { FiUploadCloud, FiRefreshCw, FiCheck, FiX, FiFile, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface OCRUploaderProps {
    onComplete: (data: any) => void;
}

const OCRUploader = ({ onComplete }: OCRUploaderProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [ocrResult, setOcrResult] = useState<string | null>(null);

    // Initialize PDF worker
    const [pdfWorkerInitialized, setPdfWorkerInitialized] = useState(false);

    // Initialize PDF.js worker
    React.useEffect(() => {
        const initPdfWorker = async () => {
            if (typeof window !== 'undefined' && !pdfWorkerInitialized) {
                try {
                    // Use correct import path
                    const pdfJS = await import('pdfjs-dist');

                    // Set worker to matching version
                    pdfJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJS.version}/pdf.worker.min.js`;

                    setPdfWorkerInitialized(true);
                } catch (e) {
                    console.error("PDF Worker Init Error", e);
                }
            }
        };
        initPdfWorker();
    }, [pdfWorkerInitialized]);

    const renderPdfToImage = async (file: File): Promise<string> => {
        const pdfJS = await import('pdfjs-dist');
        const arrayBuffer = await file.arrayBuffer();

        // Load document
        const loadingTask = pdfJS.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas
            };
            await page.render(renderContext).promise;
            return canvas.toDataURL('image/png');
        }
        throw new Error('Canvas context not available');
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            setProgress(0);
            setOcrResult(null);

            if (selectedFile.type === 'application/pdf') {
                try {
                    toast.loading("Rendering PDF...", { id: "pdf-render" });
                    const imageUrl = await renderPdfToImage(selectedFile);
                    toast.dismiss("pdf-render");
                    setPreview(imageUrl);
                } catch (err: any) {
                    console.error("PDF Render Error:", err);
                    toast.dismiss("pdf-render");
                    toast.error(`Failed to render: ${err.message}`);
                }
            } else {
                const objectUrl = URL.createObjectURL(selectedFile);
                setPreview(objectUrl);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1
    });

    const processImage = async () => {
        if (!file || !preview) return;

        setProcessing(true);
        setProgress(0);

        try {
            // Tesseract v5 initialization
            const worker = await createWorker('eng');

            // For PDFs, 'preview' is already a Data URL (image) thanks to onDrop
            // For Images, 'preview' is a Blob URL which Tesseract also accepts

            const { data: { text } } = await worker.recognize(preview);

            setOcrResult(text);
            await worker.terminate();

            setProgress(100);
            toast.success('Text extracted successfully!');

            // Parse text (Simple mock parser)
            const parsedData = parsePrescriptionText(text);
            onComplete({
                ...parsedData,
                file: file,
                previewUrl: preview
            });

        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('Failed to process document');
        } finally {
            setProcessing(false);
        }
    };

    const parsePrescriptionText = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // 1. Smarter Name Extraction
        let patientName = '';
        const nameRegex = /(?:Patient|Name|For|Pt|Rx For|Bill To|Sold To|Customer)\s*[:.-]?\s*([A-Za-z\s,.]+)/i;
        const nameMatch = text.match(nameRegex);
        if (nameMatch) {
            const matchVal = nameMatch[1].trim();
            if (matchVal.length < 3) {
                const matchIndex = lines.findIndex(l => /Bill To|Sold To/i.test(l));
                if (matchIndex !== -1 && lines[matchIndex + 1]) patientName = lines[matchIndex + 1];
            } else {
                patientName = matchVal;
            }
        } else {
            const headerKeywords = ['clinic', 'hospital', 'pharmacy', 'dr.', 'doctor', 'rx', 'date', 'tel', 'fax', 'receipt', 'invoice', 'gst', 'tin'];
            const potentialNameLine = lines.find((line, idx) => {
                const lower = line.toLowerCase();
                return line.length > 3 && line.length < 40 && !/\d/.test(line) && !headerKeywords.some(k => lower.includes(k)) && /^[A-Z]/.test(line) && idx < 10;
            });
            if (potentialNameLine) patientName = potentialNameLine;
        }

        // 2. Date Extraction
        const dateRegex = /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/g;
        const dateMatches = text.match(dateRegex);
        const date = dateMatches ? dateMatches[0] : '';

        // 3. Structured Drug & Sig Detection
        const potentialDrugs: any[] = [];
        // Regex to identify drug lines
        const drugLineSigPatterns = [
            /(?:mg|mcg|ml|g|oz)\b/i,     // Strength indicators
            /\b(?:tablet|capsule|tab|cap|syr|susp|cream|oint|inj)\b/i, // Form indicators
            /\b(?:take|apply|inject|inhale|po|bid|tid|qid|hs|prn|once|daily)\b/i // Sig indicators
        ];

        lines.forEach(line => {
            // Must match at least one drug-like pattern and not be a financial summary line
            if (drugLineSigPatterns.some(p => p.test(line)) && line.length > 5 && !/total|subtotal|tax|amount|change|due/i.test(line)) {

                // Parse Logic
                let cleaned = line;
                let quantity = 1;
                let sig = '';

                // Extract Quantity (looks for #30, Qty: 30, or leading number)
                const qtyMatch = line.match(/(?:#|Qty:|Quantity:)\s*(\d+)/i);
                if (qtyMatch) {
                    quantity = parseInt(qtyMatch[1]);
                    // Remove the qty part from cleaned text to avoid confusion
                    cleaned = cleaned.replace(qtyMatch[0], '');
                } else {
                    // Check for leading number "30 Amoxicillin"
                    const leadingNum = line.match(/^(\d+)\s+[A-Za-z]/);
                    if (leadingNum) {
                        quantity = parseInt(leadingNum[1]);
                        cleaned = cleaned.replace(/^\d+\s+/, '');
                    }
                }

                // Extract Sig (Instructions) - basic heuristic: text after "Sig" or "Take"
                const sigMatch = line.match(/(?:Sig|Signa|Instructions|Take|Apply)\s*[:.-]?\s*(.+)/i);
                if (sigMatch) {
                    sig = sigMatch[0]; // Keep full instruction phrase
                    // Ideally we'd remove it from 'cleaned' to leave just drug name, but they often overlap or structure varies
                }

                // Heuristic for Drug Name: The first 2-3 words of the cleaned line
                const words = cleaned.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
                const drugName = words.slice(0, 3).join(' '); // Rough guess

                potentialDrugs.push({
                    originalLine: line,
                    drugName: drugName,
                    quantity: quantity,
                    sig: sig || 'As directed' // Default if parsing failed
                });
            }
        });

        // Helper to find prescriber
        const prescriberMatch = text.match(/(?:Dr\.|Doctor|Prescriber)\s*[:.-]?\s*([A-Za-z\s,.]+)/i);

        return {
            rawText: text,
            patientName: patientName.replace(/[^a-zA-Z\s]/g, '').trim(),
            prescriberName: prescriberMatch?.[1]?.trim() || '',
            date: date,
            potentialDrugs: potentialDrugs
        };
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setOcrResult(null);
        setProgress(0);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {!preview ? (
                <div
                    {...getRootProps()}
                    className={`h-96 flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer m-6 rounded-xl ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                        <FiUploadCloud className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700">Click or drag prescription here</p>
                    <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, PDF</p>
                </div>
            ) : (
                <div className="p-6">
                    <div className="flex items-start gap-8">
                        {/* Preview */}
                        <div className="w-1/2">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center justify-between">
                                Uploaded Image
                                <button onClick={clearFile} className="text-xs text-red-600 hover:underline">Remove</button>
                            </h3>
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                <img
                                    src={preview}
                                    alt="Prescription Preview"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                        <FiMaximize2 /> View Full
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Results */}
                        <div className="w-1/2 flex flex-col h-full min-h-[400px]">
                            {ocrResult ? (
                                <div className="flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <FiCheck className="text-green-500" /> Extracted Text
                                    </h3>
                                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono text-gray-600 overflow-y-auto max-h-[400px]">
                                        {ocrResult}
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => toast.success('Proceeding to validation...')}
                                            className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                                        >
                                            Validate & Create Prescription
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <FiFile className="w-6 h-6" />
                                        </div>
                                        <p className="font-medium text-gray-900">{file?.name}</p>
                                        <p className="text-xs text-gray-500">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>

                                    {processing ? (
                                        <div className="w-full max-w-xs space-y-2">
                                            <div className="flex justify-between text-xs font-medium text-gray-600">
                                                <span>Processing OCR...</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-teal-500 transition-all duration-300 relative"
                                                    style={{ width: `${progress < 20 ? 20 : progress}%` }}
                                                >
                                                    {/* Shimmer effect */}
                                                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-center text-gray-400">Using standard Tesseract.js engine</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={processImage}
                                            className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                        >
                                            <FiRefreshCw /> Start Scan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OCRUploader;
