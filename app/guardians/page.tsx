import dbConnect from "@/lib/db";
import Guardian from "@/models/Guardian";
import RegistryHeader from "@/components/organisms/guardian/RegisteryHeader";
import StatCards from "@/components/organisms/guardian/StatCards";
import InteractiveGuardianTable from "@/components/organisms/guardian/InteractiveGuardianTable";
import { requirePageAccess } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function GuardiansPage() {
    await requirePageAccess("/guardians");
    await dbConnect();
    const rawGuardians = await Guardian.find({}).sort({ createdAt: -1 }).lean();
    const guardians = JSON.parse(JSON.stringify(rawGuardians));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <RegistryHeader />
            <StatCards guardians={guardians} />
            <div className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest px-1">
                    Guardian Applications
                </h2>
                <InteractiveGuardianTable guardians={guardians} />
            </div>
        </div>
    );
}

