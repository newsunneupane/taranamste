"use client";

import React, { useActionState, useEffect, useState } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { createGuardian, updateGuardian } from "@/app/actions/guardian";
import { User, Camera, FileText, X } from "lucide-react";

interface GuardianModalProps {
    mode: "ADD" | "EDIT";
    initialData?: any;
    closeModal: () => void;
}

export const GuardianModal = ({ mode, initialData, closeModal }: GuardianModalProps) => {
    const isEdit = mode === "EDIT";

    // 1. DYNAMIC ACTION BINDING
    // If Edit, we bind the specific ID. If Add, we use the standard create action.
    const action = isEdit
        ? updateGuardian.bind(null, initialData?._id)
        : createGuardian;

    const [state, formAction, isPending] = useActionState(action as any, {
        error: null,
        success: false
    });

    const [previewImage, setPreviewImage] = useState<string | null>(initialData?.profileImageUrl || null);
    useEffect(() => { setPreviewImage(initialData?.profileImageUrl || null); }, [initialData?._id, initialData?.profileImageUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreviewImage(URL.createObjectURL(file));
    };

    // 3. AUTO-CLOSE ON SUCCESS
    useEffect(() => {
        if (state?.success) closeModal();
    }, [state?.success, closeModal]);

    return (
        <form action={formAction} className="flex flex-col gap-10">

            {/* --- ADMINISTRATIVE HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center gap-8 border-b border-border/50 pb-8">

                {/* PROXIMITY AVATAR BOX */}
                <div className="relative w-24 h-24 shrink-0 group">
                    <div className="w-full h-full rounded-3xl bg-bg border-2 border-border shadow-inner flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-text-muted opacity-20" />
                        )}
                    </div>

                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-card border border-border rounded-2xl flex items-center justify-center shadow-glow cursor-pointer hover:bg-shaded transition-all active:scale-90">
                        <Camera size={18} className="text-primary" />
                        <input type="file" name="profilePicture" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>

                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-text tracking-tight">
                        {isEdit ? "Modify Guardian Dossier" : "Register New Applicant"}
                    </h2>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">
                        {isEdit ? `Record ID: ${initialData?._id}` : "Initiating Vetting & Background Check Protocol"}
                    </p>
                </div>
            </div>

            {/* ERROR FEEDBACK */}
            {state?.error && (
                <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                    ⚠ System Alert: {state.error}
                </div>
            )}

            {/* --- DATA SECTIONS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">

                {/* PERSONAL SECTION */}
                <div className="col-span-2">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">01. Identity Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Primary Applicant Name *" name="primaryName" defaultValue={initialData?.primaryName} required />
                        <FormField label="Spouse / Partner Name" name="secondaryName" defaultValue={initialData?.secondaryName} />
                        <FormField label="Secure Email Address *" name="email" type="email" defaultValue={initialData?.email} required />
                        <FormField label="Contact Number *" name="phone" defaultValue={initialData?.phone} required />
                    </div>
                </div>

                {/* VETTING SECTION */}
                <div className="col-span-2 pt-4">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">02. Vetting & Finance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <FormField label="Full Residential Address *" name="address" defaultValue={initialData?.address} required />
                        </div>

                        <SelectField
                            label="Applicant Status"
                            name="vettingStatus"
                            defaultValue={initialData?.vettingStatus || "INQUIRY"}
                            options={[
                                { label: 'Inquiry', value: 'INQUIRY' },
                                { label: 'Vetting', value: 'VETTING' },
                                { label: 'Approved', value: 'APPROVED' },
                                { label: 'Rejected', value: 'REJECTED' },
                                { label: 'Blacklisted', value: 'BLACKLISTED' }
                            ]}
                        />

                        <SelectField
                            label="Application Type *"
                            name="type"
                            defaultValue={initialData?.type}
                            options={[
                                { label: 'Foster Parent', value: 'FOSTER' },
                                { label: 'Adoptive Parent', value: 'ADOPTIVE' },
                                { label: 'Financial Sponsor', value: 'SPONSOR' }
                            ]}
                        />

                        <FormField label="Occupation" name="occupation" defaultValue={initialData?.occupation} />
                        <FormField label="Annual Income (NPR)" name="annualIncome" type="number" defaultValue={initialData?.annualIncome} />
                    </div>
                </div>

                {/* ATTACHMENTS SECTION */}
                <div className="col-span-2 pt-4">
                    <div className="bg-shaded/50 border border-border p-8 rounded-3xl group hover:border-primary/30 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                            {/* ICON & TEXT */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-text uppercase tracking-widest">Background Documentation</h4>
                                    <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-tighter opacity-70">
                                        Police reports, Citizenship, Marriage Certs
                                    </p>
                                </div>
                            </div>

                            {/* CUSTOM UPLOAD BUTTON UNIT */}
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <label className="cursor-pointer group/btn">
                                    {/* The "Visible" Button */}
                                    <div className="px-6 py-3 bg-primary text-text-invert text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-glow group-hover/btn:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                        <span>Browse Files</span>
                                    </div>

                                    {/* The Hidden Actual Input */}
                                    <input
                                        type="file"
                                        name="documents"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            // Quick logic to show count if you want
                                            const count = e.target.files?.length || 0;
                                            const label = document.getElementById('file-count-label');
                                            if (label) label.innerText = count > 0 ? `${count} FILES SELECTED` : "NO FILES ATTACHED";
                                        }}
                                    />
                                </label>

                                {/* The "Below" Text */}
                                <span
                                    id="file-count-label"
                                    className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-50"
                                >
                                    No Files Attached
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER ACTIONS --- */}
            <div className="flex justify-end items-center gap-6 pt-8 border-t border-border/50 mt-4">
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
                    className="btn-primary min-w-[200px] h-12 shadow-glow"
                >
                    {isPending ? "Loading..." : (isEdit ? "Update" : "SAVE ")}
                </Button>
            </div>
        </form>
    );
};