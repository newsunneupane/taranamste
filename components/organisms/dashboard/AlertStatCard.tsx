"use client";
import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlertStatCard({ count }: { count: number }) {
  const handleScroll = () => {
    const element = document.getElementById("urgent");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // ✨ Added a temporary "Highlight" effect
      element.classList.add("ring-2", "ring-danger", "ring-offset-4", "ring-offset-background");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-danger", "ring-offset-4", "ring-offset-background");
      }, 2000);
    }
  };

  return (
    <div 
      onClick={handleScroll}
      className={`cursor-pointer bg-card p-4 md:p-6 rounded-2xl md:rounded-dashboard border shadow-sm flex flex-col transition-all active:scale-95 select-none ${
        count > 0 ? 'border-danger/40 bg-danger/5 ring-1 ring-danger/10' : 'border-border'
      }`}
    >
      <div className="flex justify-between items-center md:items-start mb-2 md:mb-4">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg ${
          count > 0 ? 'bg-danger text-white animate-pulse shadow-glow' : 'bg-shaded text-text-muted border border-border'
        }`}>
          {count > 0 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        </div>
        <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Alerts</span>
      </div>
      
      <span className={`text-2xl md:text-4xl font-black tracking-tighter ${count > 0 ? 'text-danger' : 'text-text'}`}>
        {count}
      </span>
      
      <p className="hidden md:block text-[10px] font-black text-text-muted mt-1 uppercase tracking-widest opacity-60">Need Attention</p>
      
      {count > 0 && (
        <span className="text-[8px] font-black text-danger uppercase mt-2 flex items-center gap-1">
          <span className="animate-bounce">↓</span> View Details
        </span>
      )}
    </div>
  );
}