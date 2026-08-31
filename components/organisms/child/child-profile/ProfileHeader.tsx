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
    <div className="
      relative overflow-hidden
      bg-zinc-950/50 border border-zinc-800/60 p-6 rounded-lg 
      flex items-center gap-6 mb-8
    ">
      {/* 2. Avatar with System Glow */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
        {child.profileImageUrl ? (
          <div className="relative w-16 h-16 rounded-full border border-indigo-500/50 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Image
              src={child.profileImageUrl}
              alt="Subject"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-16 h-16 rounded-full border border-indigo-500/50 bg-indigo-950/30 flex items-center justify-center text-indigo-400 font-mono text-2xl">
            {child.firstName?.[0].toLowerCase()}
          </div>
        )}
      </div>

      {/* 3. Subject Identity */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
            {child.firstName} <span className="text-zinc-600 font-light">{child.lastName}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-mono text-indigo-500/80 font-bold tracking-[0.2em] uppercase">
            REGISTRATION_DT //
          </span>
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest">
            {formatNepaliDate(child.admissionDate)}
          </p>
        </div>

        <Button
          onClick={() => openChildModal({data:child})}
          className="h-10 px-4 border border-zinc-700 bg-zinc-800/40 text-zinc-200 hover:bg-indigo-900/20 hover:border-indigo-500/50 transition-all font-mono text-[10px] tracking-tighter"
        >
          <Edit3 className="w-3 h-3 mr-2 text-indigo-400" />
          MODIFY_DATA
        </Button>
      </div>

      {/* 4. Status Badge */}
      <div className="text-right">
        <div className="
          inline-block px-4 py-1.5 border border-emerald-500/30 
          bg-emerald-500/5 text-emerald-400 
          text-[10px] font-mono font-black tracking-[0.3em] uppercase
          shadow-[0_0_15px_rgba(16,185,129,0.05)]
        ">
          {child.status.replace("_", " ")}
        </div>
      </div>
      
      {/* Decorative Top Scanline */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-30" />
    </div>
  );
};