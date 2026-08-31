"use client";

import React, { useState } from "react";
import { 
    Home, 
    Users, 
    Stethoscope, 
    HelpCircle, 
    AlertCircle,
    CheckCircle2
} from "lucide-react";

// Types for the options
interface ArrivalOption {
    label: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const arrivalOptions: ArrivalOption[] = [
    { 
        label: 'Police Rescue', 
        value: 'POLICE_RESCUE', 
        description: 'Brought in via local authorities or child helpline.',
        icon: <span className="text-blue-600">👮</span>, 
        color: 'border-blue-200 bg-blue-50' 
    },
    { 
        label: 'Abandoned', 
        value: 'ABANDONED', 
        description: 'Found without guardians; origin unknown.',
        icon: <span className="text-zinc-600">🏚️</span>, 
        color: 'border-zinc-200 bg-zinc-50' 
    },
    { 
        label: 'Family Surrender', 
        value: 'FAMILY_SURRENDER', 
        description: 'Handed over by biological relatives or guardians.',
        icon: <span className="text-amber-600">🤝</span>, 
        color: 'border-amber-200 bg-amber-50' 
    },
    { 
        label: 'Hospital Referral', 
        value: 'HOSPITAL_REFERRAL', 
        description: 'Transferred from medical facilities or social work.',
        icon: <span className="text-emerald-600">🏥</span>, 
        color: 'border-emerald-200 bg-emerald-50' 
    },
    { 
        label: 'Other', 
        value: 'OTHER', 
        description: 'General admission or unspecified intake.',
        icon: <span className="text-purple-600">❓</span>, 
        color: 'border-purple-200 bg-purple-50' 
    }
];

interface Props {
    defaultValue?: string;
    onChange?: (value: string) => void;
}

const ArrivalCategory = ({ defaultValue = 'OTHER', onChange }: Props) => {
    const [selected, setSelected] = useState(defaultValue);

    const handleSelect = (val: string) => {
        setSelected(val);
        if (onChange) onChange(val);
    };

    return (
        <div className="space-y-4">
            {/* Label & Header */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Arrival Protocol Type
                    </label>
                    <p className="text-xs text-zinc-500">How did the child enter the orphanage system?</p>
                </div>
                {selected && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter animate-in zoom-in-95">
                        <CheckCircle2 size={12} /> Selection Valid
                    </div>
                )}
            </div>

            {/* Hidden Input for Form Submission */}
            <input type="hidden" name="arrivalCategory" value={selected} />

            {/* Visual Grid Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {arrivalOptions.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden ${
                                isSelected 
                                ? `${opt.color} border-zinc-900 shadow-md` 
                                : 'border-zinc-100 bg-white hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                <span className={`text-sm font-black tracking-tight ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                    {opt.label}
                                </span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-zinc-400 font-medium line-clamp-2">
                                {opt.description}
                            </p>
                            
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full bg-zinc-900" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mandatory Action Notice */}
            {selected === 'FAMILY_SURRENDER' && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in slide-in-from-top-2">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Mandatory Legal Action</p>
                        <p className="text-xs text-amber-700 leading-normal">
                            Selecting <strong>Family Surrender</strong> requires the attachment of a signed 
                            relinquishment letter and verified guardian identification in the Documents section.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArrivalCategory;