'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiPlus, FiX } from 'react-icons/fi';

interface Salt {
    name: string;
    strengthValue: string;
    strengthUnit: string;
}

interface SaltEntrySectionProps {
    initialComposition?: string;
    onSave?: (salts: Salt[]) => void;
}

export default function SaltEntrySection({ initialComposition, onSave }: SaltEntrySectionProps) {
    const [salts, setSalts] = useState<Salt[]>([
        { name: '', strengthValue: '', strengthUnit: 'mg' }
    ]);

    const addSalt = () => {
        setSalts([...salts, { name: '', strengthValue: '', strengthUnit: 'mg' }]);
    };

    const removeSalt = (index: number) => {
        setSalts(salts.filter((_, i) => i !== index));
    };

    const updateSalt = (index: number, field: keyof Salt, value: string) => {
        const updated = [...salts];
        updated[index] = { ...updated[index], [field]: value };
        setSalts(updated);
    };

    return (
        <div className="space-y-3">
            {initialComposition && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                    <p className="text-blue-900">
                        <strong>From catalog:</strong> {initialComposition}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                        Verify and add structured composition below
                    </p>
                </div>
            )}

            {salts.map((salt, index) => (
                <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Label className="text-xs">Salt Name</Label>
                        <Input
                            value={salt.name}
                            onChange={(e) => updateSalt(index, 'name', e.target.value)}
                            placeholder="e.g., Paracetamol"
                            className="text-sm"
                        />
                    </div>
                    <div className="w-24">
                        <Label className="text-xs">Strength</Label>
                        <Input
                            type="number"
                            value={salt.strengthValue}
                            onChange={(e) => updateSalt(index, 'strengthValue', e.target.value)}
                            placeholder="500"
                            className="text-sm"
                        />
                    </div>
                    <div className="w-20">
                        <Label className="text-xs">Unit</Label>
                        <select
                            value={salt.strengthUnit}
                            onChange={(e) => updateSalt(index, 'strengthUnit', e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md"
                        >
                            <option value="mg">mg</option>
                            <option value="g">g</option>
                            <option value="mcg">mcg</option>
                            <option value="ml">ml</option>
                            <option value="%">%</option>
                            <option value="IU">IU</option>
                        </select>
                    </div>
                    {salts.length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSalt(index)}
                            className="text-red-600 hover:text-red-700"
                        >
                            <FiX size={18} />
                        </Button>
                    )}
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSalt}
                className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
                <FiPlus className="mr-2" size={16} />
                Add Another Salt
            </Button>

            {onSave && (
                <Button
                    type="button"
                    onClick={() => onSave(salts)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                    Save Composition
                </Button>
            )}
        </div>
    );
}
