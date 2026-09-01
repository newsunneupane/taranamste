"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";
import { addAccountHeadSubType } from "@/app/actions/accounts";

interface SelectAccountHeadProps {
    // ✨ Expanded types for full financial registry
    transactionType: "INCOME" | "EXPENSE" | "ASSET" | "LIABILITY";
    selectedAccountId: string;
    setSelectedAccountId: (id: string) => void;
    initialData?: any;
    required?: boolean;
    name?: string; // Allow custom name for form data
}

const SelectAccountHead: React.FC<SelectAccountHeadProps> = ({
    transactionType,
    selectedAccountId,
    setSelectedAccountId,
    initialData,
    required = false,
    name = "accountHead"
}) => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const { openAccountHeadForm } = useUIModals();

    // ✨ Sub-head state (controlled so we can auto-select a freshly added one)
    const [selectedSubType, setSelectedSubType] = useState<string>(
        initialData?.subType || ""
    );
    const [showSubHeadInput, setShowSubHeadInput] = useState(false);
    const [newSubType, setNewSubType] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const fetchHeads = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/finances/accountHead');
                const data = await response.json();
                setAccounts(data);
            } catch (error) {
                console.error("Error fetching account heads:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHeads();
    }, [refreshKey]);

    // Keep sub-head in sync when editing a different record, but reset when head changes
    useEffect(() => {
        const initialHeadId = initialData?.accountHead?._id || initialData?.accountHead || "";
        const isSameHead = !initialHeadId || selectedAccountId === initialHeadId;
        setSelectedSubType(isSameHead ? (initialData?.subType || "") : "");
        setShowSubHeadInput(false);
        setNewSubType("");
        setAddError(null);
    }, [selectedAccountId, initialData?.subType, initialData?.accountHead]);

    const filteredOptions = accounts
        .filter((acc) => acc.type === transactionType)
        .map((acc) => ({
            label: `${acc.name} (${acc.code})`,
            value: acc._id
        }));

    const selectedAccount = accounts.find((acc) => acc._id === selectedAccountId);
    const availableSubTypes: string[] = selectedAccount?.subType || [];

    const handleAddSubHead = async () => {
        const value = newSubType.trim();
        if (!value || !selectedAccountId) return;
        setIsAdding(true);
        setAddError(null);
        try {
            const fd = new FormData();
            fd.set("headId", selectedAccountId);
            fd.set("subType", value);
            const res = await addAccountHeadSubType(null, fd);
            if (res.success) {
                setSelectedSubType(value);
                setNewSubType("");
                setShowSubHeadInput(false);
                setRefreshKey(prev => prev + 1);
            } else {
                setAddError(res.error);
            }
        } catch (e: any) {
            setAddError(e.message || "Failed to add sub-head");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <SelectField
                name={name}
                label={`Category`}
                required={required}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={filteredOptions}
                disabled={isLoading}
                onAddItem={() => openAccountHeadForm({ 
                    defaultType: transactionType, 
                    onSaved: () => setRefreshKey(prev => prev + 1) 
                })}
            />

            {/* Sub-Head dropdown — always visible once a head is selected */}
            {selectedAccountId && (
                <div className="animate-in slide-in-from-top-2 duration-300 flex flex-col gap-2">
                    <SelectField
                        name="subType"
                        label="Sub-Head"
                        required={required}
                        value={selectedSubType}
                        onChange={(e) => setSelectedSubType(e.target.value)}
                        options={availableSubTypes.map((t: string) => ({ label: t, value: t }))}
                        onAddItem={() => { setAddError(null); setShowSubHeadInput(true); }}
                    />

                    {showSubHeadInput && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubType}
                                onChange={(e) => setNewSubType(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubHead(); } }}
                                placeholder={availableSubTypes.length === 0 ? "e.g. Living, Education..." : "New sub-head name..."}
                                className="flex-1 p-2.5 text-sm bg-bg text-text placeholder:text-text-muted/40 border border-border/60 rounded-xl outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleAddSubHead}
                                disabled={isAdding || !newSubType.trim()}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary/10 !text-primary border border-primary/30 hover:bg-primary hover:!text-text-invert transition-all disabled:opacity-40"
                            >
                                {isAdding ? "+..." : "+ Add"}
                            </button>
                        </div>
                    )}

                    {addError && (
                        <span className="text-[11px] text-danger font-bold animate-in fade-in">
                            ⚠️ {addError}
                        </span>
                    )}

                    {availableSubTypes.length === 0 && !showSubHeadInput && (
                        <span className="text-[10px] text-text-muted/60 uppercase font-black tracking-wider">
                            No sub-heads yet — use "+ Add New Option" to create the first one.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectAccountHead;