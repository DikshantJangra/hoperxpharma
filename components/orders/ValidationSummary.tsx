import React from 'react';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

interface ValidationError {
    lineId?: string;
    lineNumber?: number;
    message: string;
}

interface ValidationWarning {
    lineId?: string;
    message: string;
}

interface ValidationSummaryProps {
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export default function ValidationSummary({ errors, warnings }: ValidationSummaryProps) {
    if (errors.length === 0 && warnings.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <FiAlertCircle className="text-red-600 shrink-0" size={16} />
                        <span className="font-medium text-red-800 text-sm">
                            {errors.length} error{errors.length > 1 ? 's' : ''} must be fixed
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {errors.map((error, i) => (
                            <li key={i} className="text-xs text-red-700 pl-6">
                                {error.lineNumber && `Line ${error.lineNumber}: `}
                                {error.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <FiAlertTriangle className="text-yellow-600 shrink-0" size={16} />
                        <span className="font-medium text-yellow-800 text-sm">
                            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {warnings.map((warning, i) => (
                            <li key={i} className="text-xs text-yellow-700 pl-6">
                                {warning.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
