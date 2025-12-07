'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import QueueCard from './QueueCard';
import { prescriptionApi } from '@/lib/api/prescriptions';
import toast from 'react-hot-toast';
import { FiInbox, FiCheckCircle, FiAlertCircle, FiPackage, FiTruck, FiPauseCircle } from 'react-icons/fi';

const COLUMNS = {
    'NEW': { title: 'New', icon: FiInbox, color: 'border-blue-400 bg-blue-50 text-blue-700' },
    'UNVERIFIED': { title: 'Unverified', icon: FiAlertCircle, color: 'border-amber-400 bg-amber-50 text-amber-700' },
    'VERIFIED': { title: 'Verified', icon: FiCheckCircle, color: 'border-green-400 bg-green-50 text-green-700' },
    'READY': { title: 'Ready', icon: FiPackage, color: 'border-teal-400 bg-teal-50 text-teal-700' },
    'DELIVERED': { title: 'Delivered', icon: FiTruck, color: 'border-gray-400 bg-gray-50 text-gray-700' },
    'ON_HOLD': { title: 'On Hold', icon: FiPauseCircle, color: 'border-red-400 bg-red-50 text-red-700' }
};

interface QueueBoardProps {
    prescriptions: any[];
    onRefresh: () => void;
}

const QueueBoard = ({ prescriptions, onRefresh }: QueueBoardProps) => {
    const [enabled, setEnabled] = useState(false);
    const [columns, setColumns] = useState<any>({});

    useEffect(() => {
        // Fix for React Strict Mode
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    // Group prescriptions by stage
    useEffect(() => {
        const newColumns: any = {};
        Object.keys(COLUMNS).forEach(key => {
            newColumns[key] = {
                id: key,
                items: prescriptions.filter((p: any) => p.stage === key)
            };
        });
        setColumns(newColumns);
    }, [prescriptions]);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        // If dropped in same column and same index
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        // Optimistic UI Update
        const sourceCol = columns[source.droppableId];
        const destCol = columns[destination.droppableId];
        const sourceItems = [...sourceCol.items];
        const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destCol.items];

        const [removed] = sourceItems.splice(source.index, 1);

        // If moving between columns, update the item's stage
        if (source.droppableId !== destination.droppableId) {
            removed.stage = destination.droppableId;
            destItems.splice(destination.index, 0, removed);

            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceCol, items: sourceItems },
                [destination.droppableId]: { ...destCol, items: destItems }
            });

            // API Call
            try {
                await prescriptionApi.updateStage(draggableId, destination.droppableId);
                toast.success(`Moved to ${COLUMNS[destination.droppableId as keyof typeof COLUMNS].title}`);
                onRefresh(); // Refresh to ensure data consistency
            } catch (error) {
                toast.error('Failed to update stage');
                onRefresh(); // Revert on error
            }
        } else {
            // Reordering in same column (if we add sort order later)
            sourceItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceCol, items: sourceItems }
            });
        }
    };

    if (!enabled) return null;

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full min-w-max p-4">
                    {Object.entries(COLUMNS).map(([columnId, config]: [string, any]) => (
                        <div key={columnId} className="w-80 flex flex-col h-full bg-gray-50 rounded-xl border border-gray-200">
                            {/* Header */}
                            <div className={`p-3 border-b border-gray-100 flex items-center justify-between rounded-t-xl bg-white sticky top-0 z-10 ${config.color.replace('bg-', 'border-l-4 ')}`}>
                                <div className="flex items-center gap-2">
                                    <config.icon className="w-4 h-4" />
                                    <h3 className="font-semibold text-gray-700 text-sm">{config.title}</h3>
                                </div>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {columns[columnId]?.items.length || 0}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-100/50' : ''
                                            }`}
                                    >
                                        {columns[columnId]?.items.map((item: any, index: number) => (
                                            <QueueCard key={item.id} prescription={item} index={index} />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default QueueBoard;
