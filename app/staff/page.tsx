import dbConnect from "@/lib/db";
import Staff from "@/models/Staff";
import User from "@/models/User"; // ✨ Import the User model
import StaffHomeTop from "@/components/organisms/staffs/StaffHomeTop";
import InteractiveStaffTable from "@/components/organisms/staffs/staffpage/InteractiveStaffTable";
import StaffStatCards from "@/components/organisms/staffs/staffpage/StaffStatCards";
import { requirePageAccess } from "@/lib/guards";

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
    await requirePageAccess("/staff");
    await dbConnect();

    // 1. Fetch raw staff data
    const rawStaffMembers = await Staff.find({}).sort({ firstName: 1 }).lean();

    // ✨ 2. Fetch Pending Requisitions (Users without a Staff record)
    const existingStaffUserIds = rawStaffMembers.map(s => s.userId?.toString()).filter(Boolean);
    const pendingUsersRaw = await User.find({
        _id: { $nin: existingStaffUserIds }
    }).select('name email phone role').lean();
    
    const pendingUsers = JSON.parse(JSON.stringify(pendingUsersRaw));

    // 3. Sanitize Staff (Keep your existing map logic)
    const staffMembers = rawStaffMembers.map((person: any) => {
        const s = person.salary || {};
        const a = s.allowances || {};
        const grossSalary = (s.basicSalary || 0) + (s.grade || 0) + (s.dearnessAllowance || 0) +
            Object.values(a).reduce((sum:number, val) => sum + (Number(val) || 0), 0);

        return JSON.parse(JSON.stringify({
            ...person,
            _id: person._id?.toString(),
            grossSalary,
            admissionDate: person.admissionDate ? new Date(person.admissionDate).toISOString() : null,
        }));
    });

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <StaffHomeTop pendingUsers={pendingUsers} />
            <StaffStatCards staffMembers={staffMembers} />
            <div className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest px-1">
                    Staff List
                </h2>
                <InteractiveStaffTable staffMembers={staffMembers} />
            </div>
        </div>
    );
}