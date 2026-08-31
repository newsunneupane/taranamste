import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import Payroll from "@/models/Payroll"; // Assuming this is your ledger model
import { PayrollDashboard } from "@/components/organisms/Admin/PayrollDashboard";
import { CheckCircle2 } from "lucide-react";
import { requirePageAccess } from "@/lib/guards";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
    await requirePageAccess("/payroll");
    await dbConnect();

    const now = new Date();
    const currentMonthYear = now.toISOString().slice(0, 7); // "2026-04"

    // 1. DUPLICATE CHECK: Check if payroll was already run for this month
    const existingPayroll = await Payroll.findOne({ monthYear: currentMonthYear });

    if (existingPayroll) {
        return (
            <div className="max-w-7xl mx-auto p-8 h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-black text-text uppercase tracking-tighter">Already Paid This Month</h1>
                <p className="text-text-muted font-bold mt-2 max-w-md">
                    Payroll for <span className="text-primary">{currentMonthYear}</span> has already been paid.
                    Salaries cannot be paid twice for the same month.
                </p>
                <button className="mt-8 px-8 py-3 bg-shaded border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border transition-all">
                    View Payroll History
                </button>
            </div>
        );
    }

    // 2. FETCH & SANITIZE STAFF (POJO Conversion)
    const rawStaff = await Staff.find({ status: "ACTIVE" })
        .select("fullName designation salary ssf bankDetails")
        .sort({ fullName: 1 })
        .lean();

    const sanitizedStaff = JSON.parse(JSON.stringify(rawStaff)).map((staff: any) => {
        const s = staff.salary || {};
        const basic = (Number(s.basicSalary) || 0) + (Number(s.grade) || 0) + (Number(s.dearnessAllowance) || 0);
        const allowances = Object.values(s.allowances || {}).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);

        return {
            _id: staff._id,
            fullName: staff.fullName,
            designation: staff.designation,
            grossSalary: basic + allowances,
            ssfEnrolled: !!staff.ssf?.enrolled
        };
    }).filter((s: any) => s.grossSalary > 0);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-black tracking-tighter text-text uppercase">
                    Payroll
                </h1>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em]">
                    Month: {currentMonthYear} | Ready to pay
                </p>
            </header>

            <PayrollDashboard staffList={sanitizedStaff} currentMonthYear={currentMonthYear} />
        </div>
    );
}