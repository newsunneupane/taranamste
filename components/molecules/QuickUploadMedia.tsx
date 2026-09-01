"use client";
import React, { useActionState, useRef, useEffect } from "react";
import { quickUploadMedia } from "@/app/actions/child";

type ActionState =
  | { error: string; success: false }
  | { error: null; success: true }
  | { error: string | null; success: boolean };

const initialState: ActionState = {
  error: null,
  success: false
};

export const QuickMediaUpload = ({
  childId,
  type,
  accept,
}: {
  childId: string;
  type: "documents" | "gallery";
  accept: string;
}) => {
  const [state, formAction, isPending] = useActionState(
    quickUploadMedia as any,
    initialState
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-auto pt-5 border-t border-border flex flex-col gap-3 transition-colors duration-500"
    >
      {/* Label: Added OrphanAdmin Micro-caps style */}
      <label className="text-[9px] uppercase font-black text-text-muted tracking-[0.2em] px-1 opacity-70">
        {type === "documents" ? "📁 Attach Paperwork" : "🖼️ Add to Gallery"}
      </label>

      {/* Error: Enhanced with OrphanAdmin danger styling */}
      {state?.error && (
        <p className="text-[10px] bg-danger/10 text-danger p-2 px-3 rounded-xl font-bold border border-danger/20 animate-in fade-in slide-in-from-top-1">
          ⚠️ {state.error}
        </p>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="uploadType" value={type} />

      {/* Upload Row: Refined background and borders */}
      <div className="flex items-center gap-2 bg-shaded/80 p-1.5 rounded-xl border border-border hover:border-border/80 transition-all group">

        {/* File Input: Customized 'file:' button logic */}
        <input
          type="file"
          name="files"
          multiple
          accept={accept}
          required
          className={`
            flex-1 text-[11px] font-medium text-text-muted
            cursor-pointer outline-none

            file:mr-3 file:py-1.5 file:px-4
            file:rounded-lg file:border-0
            file:text-[10px] file:font-black file:uppercase file:tracking-widest

            file:bg-bg file:text-text-muted
            hover:file:bg-primary/10 hover:file:text-primary
            file:cursor-pointer
            file:transition-all

            transition-all
          `}
        />

        {/* Action Button */}
        <button
          type="submit"
          disabled={isPending}
          className={`
            btn-primary text-[10px] uppercase tracking-widest px-5 py-2 h-9
            ${isPending ? "opacity-50 grayscale cursor-not-allowed" : "active:scale-95"}
          `}
        >
          {isPending ? "Loading..." : "Upload"}
        </button>
      </div>
    </form>
  );
};