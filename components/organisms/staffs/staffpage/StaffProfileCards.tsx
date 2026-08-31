"use client";

import React from "react";
import { formatNepaliDate } from "@/lib/nepaliDate";

type Staff = any;

// Updated Row: Now respects dark/light mode via theme tokens
const Row = ({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex justify-between gap-4 text-sm transition-colors">
    <span className="text-text-muted font-medium w-40">{label}</span>
    <span
      className={`font-medium transition-colors ${
        highlight ? "text-text font-bold" : "text-text/80"
      } ${mono ? "font-mono tracking-wide" : ""}`}
    >
      {value ?? "N/A"}
    </span>
  </div>
);

export const BasicInfoCard = ({ staff }: { staff: Staff }) => (
  <div className="bg-card p-6 rounded-dashboard shadow-glow border border-border flex flex-col gap-5 transition-colors duration-500">
    <h2 className="text-lg font-black text-text border-b border-border pb-3">
      Basic Information
    </h2>

    <div className="flex flex-col gap-3">
      <Row label="Phone" value={staff?.phone} highlight />
      <Row label="Email" value={staff?.email} />
      <Row label="Address" value={staff?.address} />
      <Row label="Gender" value={staff?.gender} />
      <Row label="Marital Status" value={staff?.maritalStatus} />
      <Row
        label="Join Date"
        value={
          staff?.joinDate
            ? formatNepaliDate(staff.joinDate)
            : "N/A"
        }
      />
    </div>
  </div>
);


export const ComplianceCard = ({ staff }: { staff: Staff }) => (
  <div className="bg-card p-6 rounded-dashboard shadow-glow border border-border flex flex-col gap-5 transition-colors duration-500">
    <h2 className="text-lg font-black text-text border-b border-border pb-3">
      Identity & Compliance
    </h2>

    <div className="flex flex-col gap-3">
      <Row label="Citizenship No" value={staff?.citizenshipNo} />
      <Row label="PAN Number" value={staff?.panNumber} />
      <Row
        label="TDS Status"
        value={staff?.applyTDS ? "Yes (Taxable)" : "No"}
        highlight={staff?.applyTDS}
      />

      {/* SSF BLOCK: bg-zinc-50 -> bg-shaded */}
      <div className="mt-2 bg-shaded border border-border rounded-xl p-4 flex flex-col gap-2">
        <p className="font-black text-text text-sm">
          Retirement Scheme ({staff?.ssf?.type || "NONE"})
        </p>

        <Row
          label="ID Number"
          value={staff?.ssf?.idNumber}
          mono
        />

        {staff?.ssf?.type !== "NONE" && (
          <Row
            label="Contributions"
            value={
              <>
                {/* emerald-700 -> success */}
                <span className="text-success font-bold">
                  {staff?.ssf?.employeeContribution}%
                </span>{" "}
                /{" "}
                {/* blue-700 -> primary */}
                <span className="text-primary font-bold">
                  {staff?.ssf?.employerContribution}%
                </span>
              </>
            }
          />
        )}
      </div>
    </div>
  </div>
);


export const BankCard = ({ staff }: { staff: Staff }) => {
  const bank = staff?.bank;

  return (
    <div className="bg-card p-6 rounded-dashboard shadow-glow border border-border flex flex-col gap-5 transition-colors duration-500">
      <h2 className="text-lg font-black text-text border-b border-border pb-3">
        Bank Details
      </h2>

      {bank?.accountNumber ? (
        <div className="flex flex-col gap-3">
          <Row label="Bank Name" value={bank.bankName} />
          <Row label="Branch" value={bank.branch} />
          <Row label="Account Name" value={bank.accountName} />

          {/* BANK ACC BLOCK: bg-zinc-900 -> bg-bg-invert / text-white -> text-text-invert */}
          {/* This ensures the block is black in light mode and white in dark mode */}
          <div className="mt-2 p-5 bg-bg-invert text-text-invert rounded-xl text-center font-mono tracking-[0.2em] text-lg shadow-inner">
            {bank.accountNumber}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-muted italic">
          No banking information recorded.
        </p>
      )}
    </div>
  );
};