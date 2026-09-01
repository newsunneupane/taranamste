"use client";
import React, { useTransition } from "react";
import { uploadGuardianDoc } from "@/app/actions/guardian";

export default function AddDocumentButton({ guardianId }: { guardianId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("document", file);

        startTransition(async () => {
            const result = await uploadGuardianDoc(guardianId, formData);

            if (result?.error) {
                alert(`Upload failed: ${result.error}`);
            }
        });

        // reset input so same file can be uploaded again
        e.target.value = "";
    };

    return (
        <label
            className={`
                cursor-pointer inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl text-xs font-bold
                border transition-all duration-300
                ${isPending
                    // PENDING STATE: bg-zinc-100 -> bg-shaded, text-zinc-400 -> text-text-muted
                    ? "bg-shaded text-text-muted border-border opacity-70 pointer-events-none"
                    // IDLE STATE: bg-white -> bg-transparent, hover:bg-zinc-50 -> hover:bg-shaded
                    : "bg-transparent hover:bg-shaded text-text border-border active:scale-95"
                }
            `}
        >
            <span>
                {isPending ? "Loading..." : "➕ Add Document"}
            </span>

            <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                disabled={isPending}
            />
        </label>
    );
}