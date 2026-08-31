import React from 'react'
import ArrivalCategory from './ArrivalCategory'
import { AlertCircle, History, ShieldCheck } from 'lucide-react'
import { FormField } from '@/components/molecules/FormField'
import { Section } from './ChildForm'

const ArrivalProtocol = ({initialData, arrivalType, setArrivalType}: any) => {
    return (
        <Section icon={<History size={18} />} title="03. Arrival Protocol">
            <div className="flex flex-col gap-8">
                <ArrivalCategory
                    defaultValue={arrivalType}
                    onChange={(val) => setArrivalType(val)}
                />

                {/* FIELD A: GENERAL CONTEXT */}
                <FormField
                    label="Location / Referral Source Details"
                    name="arrivalDetails"
                    defaultValue={initialData?.arrivalDetails}
                    placeholder={
                        arrivalType === 'POLICE_RESCUE' ? "Which Police Station / Case No?" :
                        arrivalType === 'HOSPITAL_REFERRAL' ? "Hospital Name & Ward?" :
                        "Where was the child found?"
                    }
                />

                {/* CASE 1: FAMILY SURRENDER (Using Warning Tokens) */}
                {arrivalType === 'FAMILY_SURRENDER' && (
                    <div className="p-8 bg-warning/5 border border-warning/20 rounded-[2rem] animate-in slide-in-from-top-4 duration-500 space-y-6">
                        <div className="flex items-center gap-3 border-b border-warning/10 pb-4">
                            <ShieldCheck className="text-warning" size={20} />
                            <h4 className="text-[10px] font-black text-warning uppercase tracking-widest">
                                Guardian Documentation
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Guardian Name" name="guardianName" required defaultValue={initialData?.guardianName} />
                            <FormField label="Relationship" name="guardianRelation" required defaultValue={initialData?.guardianRelation} />
                            <FormField label="Contact Number" name="guardianContact" required defaultValue={initialData?.guardianContact} />
                            <FormField label="Govt ID Number" name="guardianId" defaultValue={initialData?.guardianId} />
                            <div className="md:col-span-2">
                                <FormField label="Reason for Surrender" name="surrenderReason" required defaultValue={initialData?.surrenderReason} />
                            </div>
                        </div>
                    </div>
                )}

                {/* CASE 2: HOSPITAL / POLICE (Using Primary Tokens) */}
                {(arrivalType === 'HOSPITAL_REFERRAL' || arrivalType === 'POLICE_RESCUE') && (
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] animate-in fade-in duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-primary" size={18} />
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                                Verification Required
                            </p>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed mb-0">
                            Please ensure the <strong className="text-text">Official {arrivalType === 'POLICE_RESCUE' ? 'Police Report' : 'Medical Referral'}</strong> is scanned and uploaded to the <strong className="text-text">Documents</strong> section below for legal compliance.
                        </p>
                    </div>
                )}
            </div>
        </Section>
    )
}

export default ArrivalProtocol