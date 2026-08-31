"use client";

import { quickUploadMedia } from "@/app/actions/child";
import { useRef, useState, useEffect, useTransition } from "react";


export const ProfileDocumentVault = ({ childId, existingDocs = [] }: { childId: string, existingDocs?: string[] }) => {
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setStagedFiles(prev => [...prev, ...newFiles]);
        }
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("childId", childId);
            formData.append("uploadType", "documents");
            stagedFiles.forEach(file => formData.append("files", file));

            const result = await quickUploadMedia(null, formData);
            if (result?.success) setStagedFiles([]);
            else alert(result?.error || "Failed to upload documents.");
        });
    };

    return (
        <div className="bg-card p-6 md:p-8 rounded-dashboard border border-border shadow-glow flex flex-col h-full transition-colors duration-500">
            {/* Header: Micro-caps sync */}
            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-6 flex items-center gap-2 border-b border-border pb-3 opacity-80">
                📄 Documents
            </h2>

            {/* Existing Documents */}
            <div className="flex flex-col gap-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {existingDocs?.map((url, i) => (
                    <a key={i} href={url} target="_blank"
                        className="flex items-center gap-3 text-sm font-bold text-text bg-shaded/50 p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-glow transition-all group">
                        <span className="text-xl group-hover:scale-110 transition-transform">📎</span>
                        <span className="truncate flex-1">Document {i + 1}</span>
                        <span className="text-[9px] font-black tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                            VIEW
                        </span>
                    </a>
                ))}
                {existingDocs.length === 0 && (
                    <p className="text-xs text-text-muted italic py-4 text-center border border-dashed border-border rounded-xl">
                        No documents archived yet.
                    </p>
                )}
            </div>

            {/* Staged Area */}
            {stagedFiles.length > 0 && (
                <div className="flex flex-col gap-2 mb-6 pt-5 border-t border-border animate-in fade-in slide-in-from-top-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest px-1">
                        Ready to Sync ({stagedFiles.length})
                    </span>

                    <div className="flex flex-col gap-2">
                        {stagedFiles.map((file, idx) => (
                            <div key={idx}
                                className="flex justify-between items-center p-3 bg-shaded rounded-xl border border-border text-text group">
                                <span className="text-xs font-bold truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                    ⏳ {file.name}
                                </span>
                                <button onClick={() => removeFile(idx)}
                                    className="w-6 h-6 flex items-center justify-center bg-danger/10 text-danger rounded-lg text-[10px] hover:bg-danger hover:text-text-invert transition-all">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="mt-auto pt-4 flex gap-3">
                <label className="flex-1 text-center cursor-pointer bg-bg border border-border text-text-muted hover:text-text hover:bg-shaded px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                    + Browse Files
                    <input ref={inputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                </label>

                {stagedFiles.length > 0 && (
                    <button
                        onClick={handleUpload}
                        disabled={isPending}
                        className="flex-1 btn-primary text-[10px] uppercase tracking-widest flex justify-center items-center h-11"
                    >
                        {isPending ? "Uploading..." : `Upload Now`}
                    </button>
                )}
            </div>
        </div>
    );
};

export const ProfilePhotoGallery = ({ childId, existingPhotos = [] }: { childId: string, existingPhotos?: string[] }) => {
    const [stagedImages, setStagedImages] = useState<{ file: File, url: string }[]>([]);
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const mapped = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
        setStagedImages(prev => [...prev, ...mapped]);
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(stagedImages[index].url);
        setStagedImages(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        return () => stagedImages.forEach(img => URL.revokeObjectURL(img.url));
    }, []);

    const handleUpload = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("childId", childId);
            formData.append("uploadType", "gallery");
            stagedImages.forEach(img => formData.append("files", img.file));

            const result = await quickUploadMedia(null, formData);
            if (result?.success) setStagedImages([]);
            else alert(result?.error || "Failed to upload photos.");
        });
    };

    return (
        <div className="bg-card p-6 md:p-8 rounded-dashboard border border-border shadow-glow flex flex-col h-full overflow-hidden transition-colors duration-500">
            {/* Header: Micro-caps sync */}
            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-6 border-b border-border pb-3 opacity-80">
                🖼️ Photo Gallery
            </h2>

            {/* Existing Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {existingPhotos?.map((url, i) => (
                    <a key={i} href={url} target="_blank"
                        className="aspect-square rounded-2xl border border-border overflow-hidden bg-bg group relative">
                        <img src={url} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-primary/80 px-2 py-1 rounded">View</span>
                        </div>
                    </a>
                ))}
                {existingPhotos.length === 0 && (
                    <p className="text-xs text-text-muted col-span-3 italic py-8 text-center border border-dashed border-border rounded-xl">
                        No photos in gallery yet.
                    </p>
                )}
            </div>

            {/* Staged Preview Tray */}
            {stagedImages.length > 0 && (
                <div className="flex flex-col gap-3 mb-6 pt-5 border-t border-border animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest px-1">
                        New Memories ({stagedImages.length})
                    </span>

                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {stagedImages.map((img, idx) => (
                            <div key={idx} className="relative shrink-0 w-24 h-24 group">
                                <img src={img.url} className="w-full h-full object-cover rounded-xl border border-primary/30" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-text-invert text-xs rounded-lg shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="mt-auto pt-4 flex gap-3">
                <label className="flex-1 text-center cursor-pointer bg-bg border border-border text-text-muted hover:text-text hover:bg-shaded px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                    + Pick Photos
                    <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {stagedImages.length > 0 && (
                    <button
                        onClick={handleUpload}
                        disabled={isPending}
                        className="flex-1 btn-primary text-[10px] uppercase tracking-widest flex justify-center items-center h-11"
                    >
                        {isPending ? "Syncing..." : `Upload Gallery`}
                    </button>
                )}
            </div>
        </div>
    );
};

