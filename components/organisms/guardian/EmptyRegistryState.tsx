export function EmptyRegistryState() {
    return (
        <div className="bg-card rounded-dashboard shadow-glow border border-border overflow-hidden p-20 md:p-24 text-center flex flex-col items-center gap-6 transition-all duration-500">

            {/* ICON CONTAINER: bg-zinc-50 -> bg-shaded with inset shadow */}
            <div className="w-20 h-20 bg-shaded rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-border/50 animate-in zoom-in duration-700">
                🏘️
            </div>

            <div className="space-y-3">
                {/* PRIMARY TEXT: text-zinc-900 -> text-text */}
                <p className="text-text font-black text-xl tracking-tight">
                    No Guardians Yet
                </p>

                {/* SECONDARY TEXT: OrphanAdmin Micro-caps style */}
                <p className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em] opacity-60 max-w-[280px] mx-auto leading-relaxed">
                    Click "Register Family" to add your first guardian.
                </p>
            </div>

            {/* Added a call-to-action link if you want it to be functional */}
            <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                <button className="btn-primary px-8 h-11 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                    Register New Family
                </button>
            </div>
        </div>
    );
}