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
        // ✨ Added pt-20 for mobile menu clearance
        <div className="flex flex-col gap-6 max-w-7xl mx-auto md:p-6 md:pt-6 lg:p-8 animate-in fade-in duration-500">
            <RegistryHeader />
            
            <StatCards guardians={guardians} />

            <div className="flex flex-col gap-3 mt-2">
                <h2 className="font-ubuntu text-[10px] font-black text-text-muted uppercase tracking-[0.3em] pl-2">
                    Guardian Applications
                </h2>
                <InteractiveGuardianTable guardians={guardians} />
            </div>
        </div>
    );
}

