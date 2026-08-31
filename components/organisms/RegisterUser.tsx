"use client";

import React, { useActionState, useState } from "react";
import { FormField } from "../molecules/FormField";
import { SelectField } from "../molecules/selects/SelectField";
import { Button } from "../atoms/Button";
import { ShieldAlert, UserPlus, CheckCircle, Eye, EyeOff, User, Lock } from "lucide-react";
import { registerUser } from "@/app/actions/auth";
import Link from "next/link";

export const Register = () => {
  const [state, formAction, isPending] = useActionState(registerUser as any, { error: null, success: false });
  const [showPassword, setShowPassword] = useState(false);

  // If successfully registered, show the "Awaiting Clearance" screen
  if (state?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 transition-colors duration-500">
        <div className="w-full max-w-md bg-card border border-border rounded-dashboard shadow-glow overflow-hidden text-center p-10">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6 border border-success/20">
            <CheckCircle className="text-success" size={32} />
          </div>
          <h2 className="text-xl font-black text-text uppercase tracking-widest mb-2">Request Received</h2>
          <p className="text-sm text-text-muted font-bold mb-8">
            Your access request has been saved. An administrator must approve it before you can log in.
          </p>
          <Link href="/">
            <Button variant="ghost" className="w-full h-12">Return to Gateway</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-8 lg:py-12 transition-colors duration-500">
      <form
        action={formAction}
        // ✨ WIDENED THE CARD to max-w-2xl for grid layout
        className="w-full max-w-2xl bg-card border border-border rounded-dashboard shadow-glow overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="p-8 border-b border-border text-center bg-shaded/30 flex flex-col items-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <UserPlus className="text-primary" size={28} />
          </div>
          <h2 className="text-2xl font-black text-text uppercase tracking-widest">
            Register a New User
          </h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-2 opacity-70">
            Request access to the system
          </p>
        </div>

        {/* FORM BODY */}
        <div className="p-6 md:p-10 flex flex-col gap-8">
          
          {/* Status Alerts */}
          {state?.error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-[10px] font-black p-4 rounded-xl text-center uppercase tracking-widest animate-in shake-1">
              ⚠ {state.error}
            </div>
          )}

          <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-3">
            <ShieldAlert className="text-warning shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
              <span className="text-warning font-black">Strict Notice:</span> All new accounts are locked by default and require manual verification by the System Administrator prior to authentication.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* SECTION 1: IDENTITY PROFILE */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <User size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  1. Identity Profile
                </h3>
              </div>
              
              {/* ✨ 2-COLUMN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <FormField label="Full Legal Name" name="name" required placeholder="e.g. John Doe" />
                <FormField label="Work Email" name="email" type="email" required placeholder="name@kree-corp.com" />
                <FormField label="Contact Number" name="phone" type="tel" placeholder="+977..." />
                <SelectField
                  label="Requested Clearance Level"
                  name="role"
                  required
                  options={[
                    { label: "Samity Member", value: "SAMITY" },
                    { label: "Operations Staff", value: "STAFF" },
                    { label: "Caregiver", value: "CAREGIVER" },
                    { label: "Medical Staff", value: "MEDICAL_STAFF" },
                    { label: "Teacher", value: "TEACHER" }
                  ]}
                />
              </div>
            </div>

            {/* SECTION 2: ACCESS CREDENTIALS */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Lock size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  2. Access Credentials
                </h3>
              </div>

              {/* ✨ 2-COLUMN GRID FOR PASSWORDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 relative">
                <div className="relative group/pass">
                  <FormField
                    label="Create Access Key"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-[0.35rem] p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all active:scale-90 z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="relative group/pass">
                  <FormField
                    label="Confirm Access Key"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 btn-primary shadow-glow mt-4 font-black uppercase tracking-widest text-[11px]"
          >
            {isPending ? "Transmitting..." : "Submit Requisition"}
          </Button>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-shaded/30 text-center border-t border-border/50">
          <Link href="/">
            <p className="text-[10px] text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest cursor-pointer">
              ← Return to Secure Gateway
            </p>
          </Link>
        </div>
      </form>
    </div>
  );
};