"use client";

import React, { useActionState, useEffect, useState, useRef } from "react";
import { FormField } from "@/components/molecules/FormField";
import { SelectField } from "@/components/molecules/selects/SelectField";
import { Button } from "@/components/atoms/Button";
import { createChild, updateChild } from "@/app/actions/child";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";
import { KnownRelatives } from "@/components/organisms/child/KnownRelatives";
import { DocumentVaultUpload, PhotoGalleryUpload } from "./UploadVault";
import ArrivalProtocol from "./ArrivalProtocol";
import {
    Baby,
    HeartPulse,
    GraduationCap,
    Users,
    FolderLock,
    AlertCircle,
} from "lucide-react";
import SelectChildStatus from "@/components/molecules/selects/SelectChildCurrentStatus";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";

export const ChildForm = ({ initialData, closeModal }: { initialData?: any, closeModal?: () => void }) => {
    const actionToUse = initialData ? updateChild : createChild;
    const [state, formAction, isPending] = useActionState(actionToUse as any, { error: null, success: false });
    const formRef = useRef<HTMLFormElement>(null);

    const [arrivalType, setArrivalType] = useState(initialData?.arrivalCategory || 'OTHER');

    useEffect(() => { setArrivalType(initialData?.arrivalCategory || 'OTHER'); }, [initialData?._id, initialData?.arrivalCategory]);

    const dob = initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '';
    const adminDate = initialData?.admissionDate
        ? new Date(initialData.admissionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (state?.success && closeModal) closeModal();
    }, [state?.success, closeModal]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            if (target.tagName === "TEXTAREA" || target.getAttribute("type") === "submit") return;

            e.preventDefault();
            const form = formRef.current;
            if (!form) return;

            const focusableElements = Array.from(form.querySelectorAll<HTMLElement>(
                'input:not([type="hidden"]):not([disabled]), button:not([disabled]):not([type="button"]), select:not([disabled]), textarea:not([disabled]), [role="combobox"], [tabindex="0"]'
            )).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 || el.tagName === "SELECT";
            });

            const currentIndex = focusableElements.indexOf(target);
            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                let nextElement = focusableElements[currentIndex + 1];
                if (nextElement.tagName === "SELECT" || nextElement.offsetParent === null) {
                    const parent = nextElement.parentElement;
                    const visibleTrigger = parent?.querySelector('button, [role="combobox"]') as HTMLElement;
                    if (visibleTrigger) nextElement = visibleTrigger;
                }
                nextElement.focus();
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
            <form 
            ref={formRef} 
            action={formAction} 
            onKeyDown={handleKeyDown} 
            className="flex flex-col gap-6 animate-in fade-in duration-300"
        >
            {initialData && <input type="hidden" name="_id" value={initialData._id} />}

            {/* 01. IDENTITY SECTION */}
            <Section icon={<Baby size={18} />} title="01. Identity Parameters">
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
                    <div className="flex flex-col items-center gap-3">
                        <ImageUploadField defaultValue={initialData?.profileImageUrl} />
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Profile Portrait</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="First Name" name="firstName" required defaultValue={initialData?.firstName} />
                        <FormField label="Last Name" name="lastName" required defaultValue={initialData?.lastName} />
                        <SelectField
                            label="Gender"
                            name="gender"
                            required
                            defaultValue={initialData?.gender || ""}
                            options={[
                                { label: 'Select Gender', value: '', disabled: true },
                                { label: 'Male', value: 'MALE' }, 
                                { label: 'Female', value: 'FEMALE' }, 
                                { label: 'Other', value: 'OTHER' }
                            ]}
                        />
           
                        <SelectChildStatus defaultValue={initialData?.currentStatus || initialData?.status || ""} name="currentStatus"/>
                        <NepaliDateField label="Date of Birth" name="dateOfBirth" required defaultValue={dob} />
                        <NepaliDateField label="Admission Date" name="admissionDate" required defaultValue={adminDate} />
                    </div>
                </div>
            </Section>

            {/* 03. ARRIVAL PROTOCOL */}
            <ArrivalProtocol initialData={initialData} arrivalType={arrivalType} setArrivalType={setArrivalType} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Section icon={<GraduationCap size={18} />} title="04. Education">
                    <div className="space-y-6">
                        <FormField label="Current School" name="schoolName" defaultValue={initialData?.schoolName} />
                        <FormField label="Current Grade" name="gradeLevel" defaultValue={initialData?.gradeLevel} />
                    </div>
                </Section>

                <Section icon={<HeartPulse size={18} className="text-danger" />} title="02. Health & Vitals">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SelectField
                            label="Blood Type"
                            name="bloodType"
                            defaultValue={initialData?.bloodType || ""}
                            options={[
                                { label: 'Select', value: '', disabled: true },
                                ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ label: v, value: v }))
                            ]}
                        />
                        <div className="md:col-span-2">
                            <FormField label="Known Allergies" name="allergies" defaultValue={initialData?.allergies} placeholder="e.g. Peanuts" />
                        </div>
                        <div className="md:col-span-3">
                            <FormField label="Medical Synopsis" name="medicalNotes" defaultValue={initialData?.medicalNotes} />
                        </div>
                    </div>
                </Section>
            </div>

            <Section icon={<Users size={18} />} title="05. Known Relatives">
                <KnownRelatives initialRelatives={initialData?.knownRelatives || []} />
            </Section>

            <Section icon={<FolderLock size={18} />} title="06. Documents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DocumentVaultUpload existingDocs={initialData?.documents} />
                    <PhotoGalleryUpload existingPhotos={initialData?.gallery} />
                </div>
            </Section>

            {state?.error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-xs font-bold">
                    <AlertCircle size={18} />
                    <span>Action Failed: {state.error}</span>
                </div>
            )}

            <div className="sticky bottom-4 bg-card/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-card flex justify-end items-center gap-3 z-10">
                {closeModal && (
                    <button 
                        type="button" 
                        onClick={closeModal} 
                        className="px-6 py-2.5 text-sm font-medium text-text-muted hover:text-text hover:bg-shaded rounded-xl transition-colors"
                    >
                        Discard
                    </button>
                )}
                <Button 
                    type="submit" 
                    disabled={isPending} 
                    className="px-8 h-11 text-sm"
                >
                    {isPending ? "Saving..." : (initialData ? "Update Record" : "Finalize Admission")}
                </Button>
            </div>
        </form>
        </div>
    );
};

export const Section = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shrink-0">
                {icon}
            </div>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">{title}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-card">
            {children}
        </div>
    </div>
);