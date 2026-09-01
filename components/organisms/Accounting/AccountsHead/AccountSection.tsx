"use client";
import React from "react";
import { ChevronDown, Edit2, FolderOpen } from "lucide-react"; 
import { useUIModals } from "@/hooks/useUIModal";

interface AccountHead {
  _id: string;
  name: string;
  code: string;
  subType?: string[];
  [key: string]: any;
}

interface AccountSectionProps {
  title: string;
  heads: AccountHead[];
  theme: "success" | "danger" | "primary" | "warning";
  isOpen: boolean;
  onToggle: () => void;
  onAdd: () => void;
}

const THEME_STYLES = {
  success: { text: "text-success", bg: "bg-success/10", border: "border-success/30", button: "text-success hover:bg-success hover:text-text-invert border-success/50" },
  danger: { text: "text-danger", bg: "bg-danger/10", border: "border-danger/30", button: "text-danger hover:bg-danger hover:text-text-invert border-danger/50" },
  primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30", button: "text-primary hover:bg-primary hover:text-text-invert border-primary/50" },
  warning: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30", button: "text-warning hover:bg-warning hover:text-text-invert border-warning/50" },
};
export const AccountSection: React.FC<AccountSectionProps> = ({ 
  title, heads, theme, isOpen, onToggle, onAdd,  
}) => {
  const styles = THEME_STYLES[theme];
  const { openAccountHeadForm } = useUIModals();

  return (
    <div className={`bg-card rounded-xl border transition-all duration-300 overflow-hidden ${
      isOpen ? 'border-border shadow-sm' : 'border-border/40 shadow-none hover:border-border'
    }`}>
      
      <div 
        onClick={onToggle}
        role="button"
        tabIndex={0}
        className={`cursor-pointer w-full px-4 py-3.5 flex justify-between items-center transition-colors select-none ${styles.bg} ${
          isOpen ? 'border-b ' + styles.border : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${styles.text} ${isOpen ? 'rotate-180' : ''}`} />
          <h3 className={`font-ubuntu font-black uppercase tracking-[0.15em] text-[11px] ${styles.text}`}>
            {title} <span className="opacity-50 ml-1.5">[{heads.length}]</span>
          </h3>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all active:scale-95 bg-card ${styles.button}`}
        >
          + Add Head
        </button>
      </div>

      {/* ACCORDION BODY */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-3 flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            
            {heads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-30">
                <FolderOpen size={24} className="mb-1.5" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em]">No Active Records</p>
              </div>
            ) : (
              heads.map((head) => (
                <div 
                  key={head._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-shaded/30 border border-border/40 rounded-xl hover:border-primary/30 hover:bg-shaded/60 transition-all group gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${styles.bg} flex items-center justify-center text-[9px] font-black border ${styles.border} ${styles.text}`}>
                       {head.code?.slice(0, 3) || '??'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text group-hover:text-primary transition-colors truncate">
                        {head.name}
                      </span>
                      <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                        REF: {head.code || "UNCATEGORIZED"}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: Tags & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                      {head.subType?.map((st, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter border border-border/60 rounded-md bg-card text-text-muted">
                          {st}
                        </span>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => openAccountHeadForm({initialData: head})} 
                      className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>

                </div>
              ))
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
