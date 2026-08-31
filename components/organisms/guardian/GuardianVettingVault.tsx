"use client";

import React from "react";
import AddDocumentButton from "./AddDocumentButton";
import DocumentCard from "./DocumentCard";

export default function GuardianVettingVault({
    guardian,
    id
}: {
    guardian: any;
    id: string;
}) {
    return (
        // Container: Updated bg-white -> bg-card, border-zinc-200 -> border-border
        <div className="bg-card p-6 rounded-dashboard border border-border shadow-glow transition-colors duration-500">

            {/* HEADER: Updated border-zinc-100 -> border-border */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">

                <div className="flex items-center gap-4">

                    {/* ICON: Updated bg-zinc-50 -> bg-shaded, sized up slightly for premium feel */}
                    <span className="text-xl w-12 h-12 flex items-center justify-center rounded-2xl bg-shaded border border-border shadow-inner shrink-0">
                        🛡️
                    </span>

                    <div>
                        {/* TYPOGRAPHY: Updated zinc-900 -> text-text, zinc-500 -> text-text-muted */}
                        <h2 className="text-lg font-black text-text tracking-tight">
                            Application Files
                        </h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                            This guardian's background check documents
                        </p>
                    </div>
                </div>

                <AddDocumentButton guardianId={id} />
            </div>

            {/* DOCUMENTS */}
            {guardian?.backgroundCheckDocs?.length > 0 ? (
                // Increased gap to 4 for better breathing room
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guardian.backgroundCheckDocs.map((url: string, i: number) => (
                        <DocumentCard
                            key={url}
                            url={url}
                            index={i}
                            guardianId={id}
                        />
                    ))}
                </div>
            ) : (
                // EMPTY STATE: Updated to bg-shaded/50 and border-border
                <div className="text-center p-10 border border-dashed border-border rounded-2xl bg-shaded/50 transition-colors">

                    <span className="text-4xl opacity-40 block mb-3 grayscale">
                        📁
                    </span>

                    <p className="text-sm text-text-muted font-bold tracking-wide">
                        No verification documents uploaded
                    </p>
                    <p className="text-[10px] text-text-muted/60 mt-1 uppercase tracking-widest">
                        Click "Add Document" to upload
                    </p>
                </div>
            )}
        </div>
    );
}