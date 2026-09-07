import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import ChildrenStatCards from "@/components/organisms/child/ChildrenStatCards";
import InteractiveChildrenTable from "@/components/organisms/child/InteractiveChildrenTable";
import { ChildrenHeader } from "@/components/organisms/child/childrenHeader";

export const dynamic = 'force-dynamic';

export default async function ChildrenPage() {
    await dbConnect();
    const rawChildren = await Child.find({}).sort({ createdAt: -1 }).lean();
    const children = JSON.parse(JSON.stringify(rawChildren));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <ChildrenHeader />
            <ChildrenStatCards children={children} />
            <InteractiveChildrenTable children={children} />
        </div>
    );
}