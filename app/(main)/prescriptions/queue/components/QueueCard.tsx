'use client';

import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FiClock, FiUser, FiAlertTriangle, FiFileText, FiCheckCircle } from 'react-icons/fi';

interface QueueCardProps {
    prescription: any;
    index: number;
}

const QueueCard = ({ prescription, index }: QueueCardProps) => {
    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    // Priority badge color
    const getPriorityColor = (priority: string) => {
        return priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600';
    };

    return (
        <Draggable draggableId={prescription.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white rounded-lg p-3 shadow-sm border mb-3 transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-teal-500 rotate-2' : 'hover:shadow-md border-gray-200'
                        }`}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-mono text-gray-500">#{prescription.id.slice(-6)}</span>
                            <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[140px]">
                                {prescription.patient.firstName} {prescription.patient.lastName}
                            </h4>
                        </div>
                        {prescription.assignedUser ? (
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold" title={`Assigned to ${prescription.assignedUser.firstName}`}>
                                {prescription.assignedUser.firstName[0]}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                <FiUser size={12} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getPriorityColor(prescription.priority)}`}>
                            {prescription.priority}
                        </span>
                        {prescription.controlledFlag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 flex items-center gap-0.5">
                                <FiAlertTriangle size={10} /> Controlled
                            </span>
                        )}
                        {prescription.source !== 'manual' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {prescription.source}
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                        {prescription.items.length} item{prescription.items.length !== 1 ? 's' : ''}
                        {prescription.items.length > 0 && (
                            <span className="text-gray-400 ml-1">• {prescription.items[0].drug.name}</span>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                            <FiClock size={12} />
                            {formatDate(prescription.createdAt)}
                        </div>

                        {prescription.prescriber && (
                            <div className="flex items-center gap-1 truncate max-w-[80px]" title={prescription.prescriber.name}>
                                <FiFileText size={12} />
                                Dr. {prescription.prescriber.name.split(' ').pop()}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                        <a
                            href={`/prescriptions/${prescription.id}/dispense`}
                            className="flex-1 bg-teal-50 text-teal-700 text-xs font-semibold py-1.5 rounded hover:bg-teal-100 transition-colors text-center border border-teal-100"
                        >
                            Open Workflow
                        </a>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default QueueCard;
