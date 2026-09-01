"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { X } from "lucide-react";

type Relative = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  photoPreview: string | null;
};

export const KnownRelatives = ({ initialRelatives = [] }: { initialRelatives?: any[] }) => {
  const [relatives, setRelatives] = useState<Relative[]>(
    initialRelatives.length > 0 ? initialRelatives : []
  );

  useEffect(() => { setRelatives(initialRelatives.length > 0 ? initialRelatives : []); }, [JSON.stringify(initialRelatives)]);

  const addRelative = () => {
    setRelatives([
      ...relatives,
      {
        id: Math.random().toString(36).substring(7),
        name: "",
        relation: "",
        phone: "",
        email: "",
        photoPreview: null
      }
    ]);
  };

  const removeRelative = (idToRemove: string) => {
    setRelatives(relatives.filter((rel) => rel.id !== idToRemove));
  };

  const handlePhotoChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setRelatives((prev) =>
      prev.map((rel) =>
        rel.id === id ? { ...rel, photoPreview: previewUrl } : rel
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-card border border-border rounded-2xl mt-2">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍👩‍👧‍👦</span>
          <div>
            <h3 className="font-bold text-text text-sm">
              Known Relatives (ज्ञात आफन्तहरू)
            </h3>
            <p className="text-[11px] text-text-muted">
              Add family members, emergency contacts, or sponsors.
            </p>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-4">
        {relatives.map((relative, index) => (
          <div
            key={relative.id}
            className="relative bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-4 group transition-all"
          >
            {/* REMOVE */}
            {/* ✨ Updated Remove Button Logic */}
            <button
              type="button"
              onClick={() => removeRelative(relative.id)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full
             flex items-center justify-center
             bg-danger text-white shadow-glow border-2 border-card
             opacity-100 transition-all z-[100] 
             hover:scale-110 active:scale-90"
              title="Remove Relative"
            >
              <X size={14} strokeWidth={3} />
            </button>

            <div className="flex flex-col md:flex-row gap-5 items-start">

              {/* PHOTO */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative w-16 h-16 rounded-full cursor-pointer group/avatar">

                  {relative.photoPreview ? (
                    <img
                      src={relative.photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-full border border-border shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl border border-primary/20">
                      👤
                    </div>
                  )}

                  <input
                    type="file"
                    name={`relative_photo_${index}`}
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(relative.id, e)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  <div className="absolute bottom-0 right-0 bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center text-[8px]">
                    📷
                  </div>
                </div>

                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                  Optional
                </span>
              </div>

              {/* FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

                <input type="hidden" name="relativesCount" value={relatives.length} />

                <FormField
                  label="Full Name"
                  name={`relative_name_${index}`}
                  defaultValue={relative.name}
                  required
                />

                <FormField
                  label="Relationship"
                  name={`relative_relation_${index}`}
                  defaultValue={relative.relation}
                  placeholder="e.g. Aunt, Uncle, Sibling"
                  required
                />

                <FormField
                  label="Phone Number"
                  name={`relative_phone_${index}`}
                  defaultValue={relative.phone}
                />

                <FormField
                  label="Email Address"
                  name={`relative_email_${index}`}
                  defaultValue={relative.email}
                  type="email"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD BUTTON */}
      <Button
        type="button"
        variant="ghost"
        onClick={addRelative}
        className="w-full py-4 border border-dashed border-border text-text-muted
                   hover:border-primary hover:text-primary hover:bg-primary/5
                   transition-all rounded-xl flex items-center justify-center gap-2 font-bold"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Relative
      </Button>

    </div>
  );
};