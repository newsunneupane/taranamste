import dbConnect from "@/lib/db";
import PaymentCategory from "@/models/paymentCategory";

import { Button } from "@/components/atoms/Button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PaymentCategoryTable } from "@/components/organisms/Accounting/payementCategory/PaymentCategoryTable";
import PaymentCategoryHead from "@/components/organisms/Accounting/payementCategory/PaymentCategoryHead";
import { requirePageAccess } from "@/lib/guards";

export default async function PaymentCategoriesPage() {
    await requirePageAccess("/payment-categories");
    await dbConnect();
    const categories = await PaymentCategory.find().sort({ isSystem: -1, name: 1 });

    return (
        <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto animate-in fade-in duration-700">
           <PaymentCategoryHead/>
            {/* INFO CALLOUT */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-relaxed">
                    Security Protocol: System categories marked with a shield icon are essential for 
                    the OrphanAdmin ledger and cannot be deleted.
                </p>
            </div>

            {/* TABLE COMPONENT */}
            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
                <PaymentCategoryTable initialData={JSON.parse(JSON.stringify(categories))} />
            </div>
        </div>
    );
}

