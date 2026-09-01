"use client";

import React, { useActionState, useState } from "react";
import { CheckCircle, ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { processMonthlyPayroll } from "@/app/actions/payroll";
import SelectPaymentCategory from "@/components/molecules/selects/SelectPaymentCategory";
import SelectAccountHead from "@/components/molecules/selects/SelectAccontHead";

export const PayrollDashboard = ({ 
  staffList,
  currentMonthYear 
}: { 
  staffList: any[],
  currentMonthYear: string 
}) => {
    const [state, formAction, isPending] = useActionState(processMonthlyPayroll as any, { 
        error: null, success: false, count: 0 
    });
    
    const [selectAccountId, setSelectedAccountId] = useState("");
    const totalPayroll = staffList.reduce((sum, staff) => sum + staff.grossSalary, 0);

    if (state?.success) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-success/10 border border-success/30 rounded-[3rem] text-center animate-in zoom-in-95">
                <CheckCircle className="text-success w-16 h-16 mb-4" />
                <h2 className="text-2xl font-black text-text uppercase tracking-widest">Disbursement Complete</h2>
                <p className="text-sm font-bold text-text-muted mt-2">
                    Success! {state.count} records processed for {currentMonthYear}.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* EXECUTION FORM */}
            <form action={formAction} className="lg:col-span-1 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col gap-6 h-fit">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Execution Parameters</h3>
                    <Lock size={12} className="text-primary opacity-50" />
                </div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-text uppercase tracking-widest">Billing Cycle (Locked)</label>
                    <input 
                        type="month" 
                        name="monthYear" 
                        value={currentMonthYear}
                        readOnly // ✨ Zero tampering allowed
                        className="w-full p-4 text-sm border border-border rounded-2xl bg-shaded text-text-muted font-bold cursor-not-allowed outline-none"
                    />
                </div>

                <SelectPaymentCategory 
                    name="bankAccountId"
                    forceType="BANK" 
                    label="Funding Source (Bank)" 
                    required 
                />

                <SelectAccountHead 
                    name="salaryAccountHeadId"
                    selectedAccountId={selectAccountId} 
                    setSelectedAccountId={setSelectedAccountId} 
                    transactionType="EXPENSE" 
                    required
                />

                <div className="mt-4 p-6 bg-danger/5 border-2 border-dashed border-danger/20 rounded-2xl">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 text-center">Total Authorized Disbursement</p>
                    <p className="text-3xl font-mono font-black text-danger text-center">NPR {totalPayroll.toLocaleString()}</p>
                </div>

                <Button 
                    type="submit" 
                    disabled={isPending || totalPayroll === 0} 
                    className="w-full h-16 bg-primary text-text-invert shadow-glow-primary mt-2 font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-transform"
                >
                    {isPending ? "Loading..." : "EXECUTE PAYROLL"}
                </Button>
            </form>

            {/* ROSTER PREVIEW */}
            <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6">Active Roster ({staffList.length})</h3>
                
                <div className="flex-1 overflow-y-auto max-h-[550px] custom-scrollbar pr-2 flex flex-col gap-3">
                    {staffList.map((staff) => (
                        <div key={staff._id} className="flex justify-between items-center p-5 bg-shaded rounded-2xl border border-border/50">
                            <div>
                                <span className="font-black text-text block text-sm">{staff.fullName}</span>
                                <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">{staff.designation}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-black text-text block">Rs. {staff.grossSalary.toLocaleString()}</span>
                                {staff.ssfEnrolled && <span className="text-[7px] text-accent font-black uppercase tracking-tighter">SSF Enrolled</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};