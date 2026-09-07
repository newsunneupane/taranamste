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
    FileSpreadsheet,
    UploadCloud,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import SelectChildStatus from "@/components/molecules/selects/SelectChildCurrentStatus";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import { generateChildBulkExcel } from "@/lib/childBulkExcel";
import { parseBulkChildrenAction, commitBulkChildrenAction } from "@/app/actions/bulkChildren";

export const ChildForm = ({ initialData, closeModal }: { initialData?: any, closeModal?: () => void }) => {
    const actionToUse = initialData ? updateChild : createChild;
    const [state, formAction, isPending] = useActionState(actionToUse as any, { error: null, success: false });
    const formRef = useRef<HTMLFormElement>(null);

    const [mode, setMode] = useState<'single' | 'bulk'>(initialData ? 'single' : 'single');
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkDragOver, setBulkDragOver] = useState(false);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const [bulkParseState, bulkParseAction, isBulkParsing] = useActionState(parseBulkChildrenAction as any, null as any);
    const [bulkCommitState, bulkCommitAction, isBulkCommitting] = useActionState(commitBulkChildrenAction as any, null as any);
    const bulkRows: any[] = (bulkParseState as any)?.rows || [];
    const bulkIsParsed = !!(bulkParseState as any)?.success;
    const bulkValid = bulkRows.filter((r: any) => r.isValid);
    const bulkInvalid = bulkRows.filter((r: any) => !r.isValid);
    useEffect(() => { if ((bulkCommitState as any)?.success) setTimeout(() => closeModal?.(), 1200); }, [bulkCommitState, closeModal]);

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

    // When editing, force single mode (bulk only for new admissions)
    if (initialData && mode === 'bulk') {
        // keep single for edit
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Mode switch — only for creating new children */}
            {!initialData && (
                <div className="flex flex-col gap-3">
                    <div className="inline-flex bg-shaded p-1 rounded-2xl border border-border self-start">
                        <button
                            type="button"
                            onClick={() => setMode('single')}
                            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-card shadow-sm border border-border text-text' : 'text-text-muted hover:text-text'}`}
                        >
                            Single Admission
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('bulk')}
                            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 ${mode === 'bulk' ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text'}`}
                        >
                            <FileSpreadsheet size={14} /> Bulk Upload
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[8px]">XLSX</span>
                        </button>
                    </div>
                    {mode === 'bulk' && (
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 flex items-start gap-2 text-[11px] leading-relaxed">
                            <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                            <span className="text-text-muted"><span className="font-black text-text">Bulk mode:</span> Download the Excel template (2 example rows + 100 blank rows), fill it with the same fields as this form, upload & preview — duplicates (First+Last+DOB) are blocked. Great for admitting a whole class or yearly intake.</span>
                        </div>
                    )}
                </div>
            )}

            {mode === 'bulk' && !initialData ? (
                <div className="flex flex-col gap-4">
                    {/* Download card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => generateChildBulkExcel()}
                            className="inline-flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-white font-black text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                        >
                            <FileSpreadsheet size={16} /> Download Template — .xlsx
                        </button>
                        <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-[11px] leading-relaxed text-text-muted">
                            <span className="font-black text-danger">Required*: </span>First Name, Last Name, Gender, DOB (BS/AD M/D/YYYY e.g. 5/22/2083). BS years 2070–2100 auto-convert. Keep header row.
                        </div>
                    </div>

                    {/* Upload zone */}
                    <form action={bulkParseAction} className="space-y-3">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setBulkDragOver(true); }}
                            onDragLeave={() => setBulkDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setBulkDragOver(false); const list = e.dataTransfer.files; if (list?.length) { setBulkFiles(Array.from(list)); if (bulkFileInputRef.current) (bulkFileInputRef.current as any).files = list; } }}
                            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-3 ${bulkDragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${bulkDragOver ? 'bg-primary text-white border-primary' : 'bg-shaded text-text-muted border-border'}`}><UploadCloud size={18} /></div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-text text-center">Drop .xlsx here or browse</p>
                            <input ref={bulkFileInputRef} type="file" name="files" multiple accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" required onChange={(e) => setBulkFiles(e.target.files ? Array.from(e.target.files) : [])} className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:bg-shaded file:text-text file:font-bold file:text-xs" />
                            {bulkFiles.length > 0 && <p className="text-[10px] font-mono text-primary">{bulkFiles.map(f => f.name).join(', ')} • {(bulkFiles.reduce((s,f)=>s+f.size,0)/1024).toFixed(1)} KB</p>}
                            {bulkFiles.length === 0 && <input type="hidden" name="file" value="" />}
                            <Button type="submit" disabled={bulkFiles.length===0 || isBulkParsing} className="bg-primary text-white font-black text-[11px] uppercase tracking-widest h-9 px-8">{isBulkParsing ? 'Parsing...' : `Parse & Preview (${bulkFiles.length})`}</Button>
                        </div>
                        {(bulkParseState as any)?.error && <div className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">{(bulkParseState as any).error}</div>}
                    </form>

                    {bulkIsParsed && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-widest">
                                <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20">Valid: {(bulkParseState as any).validCount}</span>
                                <span className="px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/20">Invalid: {(bulkParseState as any).invalidCount}</span>
                                <span className="px-3 py-1 rounded-full bg-shaded border border-border text-text-muted">Total: {bulkRows.length}</span>
                            </div>
                            <div className="overflow-auto border border-border rounded-xl max-h-[300px] bg-card">
                                <table className="w-full text-[11px] min-w-[700px]">
                                    <thead className="sticky top-0 bg-card border-b border-border"><tr className="text-[9px] uppercase tracking-widest text-text-muted"><th className="p-2 text-left">#</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Gender</th><th className="p-2 text-left">DOB</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Result</th></tr></thead>
                                    <tbody>
                                        {bulkRows.slice(0,300).map((r:any)=>(
                                            <tr key={`${r._sourceFile}-${r.rowIndex}`} className={`border-b border-border/50 ${r.isValid ? 'bg-success/5':'bg-danger/5'}`}>
                                                <td className="p-2 font-mono">{r.rowIndex+1}</td>
                                                <td className="p-2 font-bold">{r.firstName} {r.lastName}</td>
                                                <td className="p-2">{r.genderNorm || r.gender}</td>
                                                <td className="p-2 font-mono">{r._wasBsDob ? `${r._originalDob} → ${r.dobSlash || r.dobAdIso}` : (r.dobSlash || r.dobAdIso)}</td>
                                                <td className="p-2">{r.statusNorm}</td>
                                                <td className="p-2">{r.isValid ? <span className="text-success font-black inline-flex items-center gap-1"><CheckCircle2 size={12}/>Ready</span> : <span className="text-danger font-bold" title={r.errors.join('; ')}>{r.errors[0]}</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {bulkRows.length>300 && <div className="p-2 text-center text-[10px] text-text-muted font-bold">Showing 300 of {bulkRows.length}</div>}
                            </div>
                            {bulkInvalid.length>0 && <p className="text-[11px] font-bold text-danger">Fix {bulkInvalid.length} invalid rows — hover status for details, then re-upload.</p>}
                            <form action={bulkCommitAction} className="flex justify-end gap-2 pt-2 border-t border-border">
                                <input type="hidden" name="payload" value={JSON.stringify(bulkRows)} />
                                <Button type="button" variant="ghost" onClick={() => closeModal?.()} className="h-9 text-[11px] uppercase font-black">Cancel</Button>
                                <Button type="submit" disabled={bulkValid.length===0 || isBulkCommitting} className="bg-primary text-white font-black text-[11px] uppercase h-9 px-6">{isBulkCommitting ? 'Importing...' : `Import ${bulkValid.length} Children`}</Button>
                            </form>
                            {(bulkCommitState as any)?.error && <div className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl p-3">{(bulkCommitState as any).error}</div>}
                            {(bulkCommitState as any)?.success && <div className="text-[11px] font-black text-success bg-success/10 border border-success/20 rounded-xl p-3">✓ Imported {(bulkCommitState as any).inserted} children. Refreshing...</div>}
                        </div>
                    )}
                    <div className="text-center">
                        <button type="button" onClick={() => setMode('single')} className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text underline underline-offset-2">← Back to single admission form</button>
                    </div>
                </div>
            ) : (
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
            )}
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