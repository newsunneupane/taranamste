import React from "react";
import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import Transaction from "@/models/Transaction"; 
import PaymentCategory from "@/models/paymentCategory"; // ✨ NEW: Required for lookup
import { notFound } from "next/navigation";
import { StaffProfileHeader } from "@/components/organisms/staffs/staffpage/StaffProfileHeader";
import { BasicInfoCard, ComplianceCard, BankCard } from "@/components/organisms/staffs/staffpage/StaffProfileCards";
import { SalaryCard } from "@/components/organisms/staffs/staffpage/StaffSalaryCard";
import { requirePageAccess } from "@/lib/guards";

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageAccess("/staff");
  await dbConnect();

  const cleanId = id.trim();
  
  // 1. Fetch Staff and Populate User
  const rawStaff = await Staff.findById(cleanId).populate("userId", "email role isActive").lean();
  if (!rawStaff) return notFound();

  // 2. ✨ REFACTORED FINANCIAL AGGREGATION
  let netBalance = 0;
  if (rawStaff.userId) {
      const balanceResult = await Transaction.aggregate([
          { 
              $match: { 
                  createdBy: rawStaff.userId._id, 
                  status: "VERIFIED", 
                  isSettled: false
              } 
          },
          // Join with PaymentCategory to find the Type (CASH vs PERSONAL)
          {
              $lookup: {
                  from: "paymentcategories",
                  localField: "paymentCategory",
                  foreignField: "_id",
                  as: "cat"
              }
          },
          { $unwind: "$cat" },
          {
              $group: { 
                  _id: null, 
                  netBalance: { 
                      $sum: { 
                          $cond: [
                              { $eq: ["$cat.type", "CASH"] }, 
                              "$amount", 
                              { $multiply: ["$amount", -1] }
                          ] 
                      } 
                  }
              } 
          }
      ]);
      netBalance = balanceResult[0]?.netBalance || 0;
  }

  // 3. Serialize and Calculate Gross
  const staff = JSON.parse(JSON.stringify({
      ...rawStaff,
      currentBalance: netBalance 
  }));

  const s = staff.salary || {};
  const a = s.allowances || {};
  const grossSalary =
    (s.basicSalary || 0) + (s.grade || 0) + (s.dearnessAllowance || 0) +
    (a.houseRent || 0) + (a.medical || 0) + (a.transport || 0) +
    (a.food || 0) + (a.communication || 0) + (a.other || 0);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20 pt-4 transition-colors duration-500">
      
      <StaffProfileHeader staff={staff} staffId={cleanId} />

      {/* Financial Status Alert */}
      {staff.userId && staff.currentBalance !== 0 && (
         <div className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all animate-in zoom-in-95 duration-500 ${staff.currentBalance < 0 ? 'bg-warning/5 border-warning/20 text-warning' : 'bg-primary/5 border-primary/20 text-primary'}`}>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">
                 {staff.currentBalance < 0 ? "Outstanding Reimbursement" : "Cash Inventory on Person"}
             </p>
             <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold opacity-60">NPR</span>
                <p className="text-3xl font-black tracking-tighter">
                    {Math.abs(staff.currentBalance).toLocaleString()}
                </p>
             </div>
             <p className="text-[9px] mt-2 font-bold uppercase opacity-40">
                Calculated from un-settled verified entries
             </p>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BasicInfoCard staff={staff} />
        <ComplianceCard staff={staff} />
        <div className="md:col-span-1">
            <SalaryCard staff={staff} grossSalary={grossSalary} />
        </div>
        <BankCard staff={staff} />
      </div>

      {/* Audit Footer */}
      <div className="px-6 flex flex-col gap-1 border-t border-border pt-8 mt-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-50">
            System Record ID: {cleanId} • Tara Namaste Baalgram Internal Roster
          </p>
          {staff.userId && (
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-50">
                Authorized Identity: {staff.userId.email} • Role: {staff.userId.role}
              </p>
          )}
      </div>
    </div>
  );
}