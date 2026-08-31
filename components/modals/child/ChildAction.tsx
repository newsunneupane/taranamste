"use client";

import React, { useActionState, useEffect } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { createActionItem } from "@/app/actions/actionPlans";
import { Target, ClipboardList } from "lucide-react";
import { SubmitButton } from "@/components/atoms/SubmitButton";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

export const ChildAction = ({
    childId,
    closeModal
}: {
    childId?: string;
    closeModal: () => void;
}) => {
    const [state, formAction, isPending] = useActionState(
        createActionItem as any,
        { error: null, success: false }
    );

    useEffect(() => {
        if (state?.success) closeModal();
    }, [state?.success, closeModal]);

    return (
        <div className="flex flex-col gap-10 animate-in fade-in duration-500">
            
            {/* ADMINISTRATIVE HEADER: High-contrast accent for directive logging */}
            <div className="flex flex-col gap-1 border-l-4 border-primary pl-6 py-1">
                <h2 className="text-2xl font-black text-text tracking-tight flex items-center gap-3">
                    <Target className="text-primary w-6 h-6" />
                    New Action Directive
                </h2>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] opacity-60">
                    Tasking Protocol // Case ID: {childId}
                </p>
            </div>

            {/* ERROR FEEDBACK: Semantic danger alerting */}
            {state?.error && (
                <div className="p-5 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95">
                    ⚠ System Alert: {state.error}
                </div>
            )}

            {/* FORM BODY */}
            <form action={formAction} className="flex flex-col gap-8">
                <input type="hidden" name="childId" value={childId} />

                {/* 01. TASK PARAMETERS */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-primary/60 w-4 h-4" />
                        <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">
                            01. Core Requirements
                        </h3>
                    </div>
                    <FormField
                        label="Directive Title *"
                        name="title"
                        required
                        placeholder="e.g., Immediate Medical Audit, Academic Provision"
                    />
                </div>

                {/* 02. PRIORITY & CATEGORY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                        label="Registry Sector"
                        name="category"
                        required
                        options={[
                            { label: "Medical (स्वास्थ्य)", value: "MEDICAL" },
                            { label: "Education (शिक्षा)", value: "EDUCATION" },
                            { label: "Legal (कानूनी)", value: "LEGAL" },
                            { label: "Material (सामग्री)", value: "MATERIAL" },
                            { label: "Other (अन्य)", value: "OTHER" }
                        ]}
                    />

                    <SelectField
                        label="Priority Level"
                        name="priority"
                        defaultValue="MEDIUM"
                        options={[
                            { label: "Low (P3)", value: "LOW" },
                            { label: "Medium (P2)", value: "MEDIUM" },
                            { label: "High (P1)", value: "HIGH" },
                            { label: "Urgent 🚨 (P0)", value: "URGENT" }
                        ]}
                    />
                </div>

                {/* 03. LOGISTICS INSET: Clean, grouped administrative fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-shaded/30 p-8 rounded-dashboard border border-border/50 shadow-inner">
                    <NepaliDateField 
                        label="Target Deadline" 
                        name="dueDate" 
                        className="bg-bg" 
                    />
                    <FormField 
                        label="Projected Cost (NPR)" 
                        name="estimatedCost" 
                        type="number" 
                        placeholder="0" 
                        className="bg-bg" 
                    />
                </div>

                {/* 04. OPERATIONAL NOTES */}
                <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] opacity-40">
                        02. Detailed Instructions
                    </h3>
                    <FormField
                        label="Operational Description"
                        name="description"
                        placeholder="Input specific administrative details or staff notes..."
                    />
                </div>

                <div className="flex justify-end items-center gap-8 pt-10 border-t border-border/50 mt-4">
                    <button 
                        type="button"
                        onClick={closeModal} 
                        className="text-[10px] font-black text-text-muted hover:text-text uppercase tracking-[0.2em] transition-all"
                    >
                        CANCEL
                        
                    </button>
                   
                    
                    <Button 
                        type="submit" 
                        disabled={isPending} 
                        className="btn-primary min-w-[220px] h-14 shadow-glow"
                    >
                        {isPending ? "Syncing Directive..." : "SAVE"}
                    </Button>
                </div>
            </form>
        </div>
    );
};