import dbConnect from "@/lib/db";
import User from "@/models/User";
import { UserManagement } from "@/components/organisms/Admin/UserManagement";
import { getServerSession } from "next-auth/next";
import { requirePageAccess } from "@/lib/guards";

export default async function SystemUsersPage() {
    await requirePageAccess("/usersmanagement");
    await dbConnect();

    // Fetch users and split them. We exclude ADMINs so the Admin doesn't accidentally delete themselves.
    const rawUsers = await User.find({ role: { $ne: "ADMIN" } }).sort({ createdAt: -1 }).lean();

    const sanitizedUsers = rawUsers.map((u: any) => ({
        ...u,
        _id: u._id.toString()
    }));

    const pending = sanitizedUsers.filter(u => !u.isActive);
    const active = sanitizedUsers.filter(u => u.isActive);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <UserManagement pendingUsers={pending} activeUsers={active} />
        </div>
    );
}