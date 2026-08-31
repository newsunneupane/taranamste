import dbConnect from "@/lib/db";
import Child from "@/models/Child";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Images, CalendarDays, HeartPulse, GraduationCap, MapPin } from "lucide-react";
import { getChildActionPlans } from "@/app/actions/getChildActionPlans";
import { ActionPlanSection } from "@/components/organisms/child/child-profile/ActionPlanSection";
import { formatNepaliDate } from "@/lib/nepaliDate";

export const dynamic = 'force-dynamic';

export default async function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    const { id } = await params;

    const rawChild = await Child.findById(id).lean();
    if (!rawChild) notFound();

    const child = JSON.parse(JSON.stringify(rawChild));

    const serializedTasks = await getChildActionPlans(id);

    const formattedDate = (d: any) =>
        formatNepaliDate(d);

    const detailRows = [
        { label: "Gender", value: child.gender ? child.gender.replace("_", " ") : "—" },
        { label: "Date of Birth", value: formattedDate(child.dateOfBirth) },
        { label: "Admitted", value: formattedDate(child.admissionDate) },
        { label: "Status", value: child.status ? child.status.replace("_", " ") : "—" },
        { label: "Blood Type", value: child.bloodType || "—" },
        { label: "Allergies", value: child.allergies || "None on file" },
        { label: "School", value: child.schoolName || "—" },
        { label: "Grade", value: child.gradeLevel || "—" },
        { label: "Arrival Category", value: child.arrivalCategory || "—" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 w-full md:p-6 md:pt-6 lg:p-8 animate-in fade-in duration-500">
            {/* BACK LINK */}
            <div className="flex items-center justify-between">
                <Link href="/children" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors">
                    <ArrowLeft size={16} /> Back to Children
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/children/${id}/documents`}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted border border-border bg-card px-4 py-2 rounded-xl hover:text-primary hover:border-primary/30 transition-all"
                    >
                        <FileText size={15} /> Documents
                    </Link>
                    <Link
                        href={`/children/${id}/images`}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted border border-border bg-card px-4 py-2 rounded-xl hover:text-primary hover:border-primary/30 transition-all"
                    >
                        <Images size={15} /> Gallery
                    </Link>
                </div>
            </div>

            {/* PROFILE HEADER */}
            <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-40" />

                <div className="relative w-20 h-20 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center bg-primary/10 text-primary font-mono text-3xl font-black shrink-0">
                    {child.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={child.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (child.firstName?.[0] || "?").toUpperCase()
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black text-text uppercase tracking-tight leading-none">
                        {child.firstName} <span className="text-text-muted font-light">{child.lastName || ""}</span>
                    </h1>
                    <p className="text-[10px] font-mono text-primary font-bold tracking-[0.2em] uppercase mt-3 flex items-center gap-2">
                        <CalendarDays size={14} /> Registration // {formattedDate(child.admissionDate)}
                    </p>
                    <p className="text-xs text-text-muted mt-2 max-w-2xl">
                        {child.arrivalDetails || "No arrival details on file for this resident."}
                    </p>
                </div>

                <div className="shrink-0">
                    <span
                        className={`inline-block px-5 py-2 border text-[10px] font-black tracking-[0.25em] uppercase rounded-xl ${
                            child.status === "IN_CARE"
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-primary/30 bg-primary/10 text-primary"
                        }`}
                    >
                        {child.status ? child.status.replace("_", " ") : "UNKNOWN"}
                    </span>
                </div>
            </div>

            {/* DETAIL SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IDENTITY & ADMISSION */}
                <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted mb-4">
                        <MapPin size={15} className="text-primary" /> Identity & Admission
                    </h2>
                    <div className="flex flex-col gap-1">
                        {detailRows.slice(0, 4).map((row) => (
                            <DetailRow key={row.label} label={row.label} value={row.value} />
                        ))}
                    </div>
                </section>

                {/* MEDICAL & EDUCATION */}
                <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted mb-4">
                        <HeartPulse size={15} className="text-danger" /> Medical & Education
                    </h2>
                    <div className="flex flex-col gap-1">
                        {detailRows.slice(4).map((row) => (
                            <DetailRow key={row.label} label={row.label} value={row.value} />
                        ))}
                    </div>
                    {child.medicalNotes && (
                        <p className="text-xs text-text-muted mt-4 border-t border-border pt-3">
                            <span className="text-xs font-black uppercase tracking-widest text-text-muted block mb-1">
                                <GraduationCap size={14} className="inline mr-1" /> Medical Notes
                            </span>
                            {child.medicalNotes}
                        </p>
                    )}
                </section>
            </div>

            {/* ACTION PLANS */}
            <ActionPlanSection childId={id} serializedTasks={serializedTasks} />
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-1.5 gap-4 border-b border-border/40 last:border-0">
            <span className="font-ubuntu text-[10px] text-text-muted uppercase tracking-widest shrink-0 pt-1">{label}</span>
            <span className="text-sm font-semibold text-text text-right">{value}</span>
        </div>
    );
}
