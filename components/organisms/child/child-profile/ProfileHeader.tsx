"use client";

import { Button } from "@/components/atoms/Button";
import Image from "next/image";
import { X, Edit3 } from "lucide-react";
import { useUIModals } from "@/hooks/useUIModal";
import { formatNepaliDate } from "@/lib/nepaliDate";

interface ChildProfile {
  firstName: string;
  lastName: string;
  admissionDate: string | Date;
  status: string;
  profileImageUrl?: string;
}

export const ProfileHeader = ({ child, id }: { child: ChildProfile; id: string }) => {
  const { openChildModal } = useUIModals();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-4 md:p-5 rounded-2xl shadow-sm border border-border mb-6">
      <div className="relative shrink-0">
        {child.profileImageUrl ? (
          <div className="relative w-14 h-14 rounded-xl border border-border overflow-hidden shadow-sm">
            <Image
              src={child.profileImageUrl}
              alt="Subject"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-14 h-14 rounded-xl border border-border bg-primary/10 flex items-center justify-center text-primary font-ubuntu font-black text-lg">
            {child.firstName?.[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="font-ubuntu text-[15px] md:text-lg font-black text-text tracking-tight truncate">
          {child.firstName} <span className="font-light text-text-muted">{child.lastName}</span>
        </h1>
        <p className="font-ubuntu text-[11px] font-semibold text-primary/70 tracking-wide">
          Admitted {formatNepaliDate(child.admissionDate)}
        </p>
        <Button
          onClick={() => openChildModal({data:child})}
          className="mt-2 h-7 px-3 bg-card border border-border text-text-muted hover:text-primary hover:border-primary/30 text-[10px] font-bold tracking-wider rounded-lg"
        >
          <Edit3 className="w-3 h-3 mr-1.5" />
          Edit
        </Button>
      </div>

      <div className="shrink-0">
        <span className="inline-block px-3 py-1 rounded-full border border-success/20 bg-success/10 text-success text-[10px] font-black tracking-widest uppercase">
          {child.status.replace("_", " ")}
        </span>
      </div>
    </div>
  );
};