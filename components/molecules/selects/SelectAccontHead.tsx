"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

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

    const filteredOptions = accounts
        .filter((acc) => acc.type === transactionType)
        .map((acc) => ({
            label: `${acc.name} (${acc.code})`,
            value: acc._id
        }));

    const selectedAccount = accounts.find((acc) => acc._id === selectedAccountId);
    const availableSubTypes = selectedAccount?.subType || [];

    return (
        <div className="flex flex-col gap-6 w-full">
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

            {availableSubTypes.length > 0 && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <SelectField
                        name="subType"
                        label="More Detail"
                        defaultValue={initialData?.subType || ""}
                        options={availableSubTypes.map((t: string) => ({ label: t, value: t }))}
                    />
                </div>
            )}
        </div>
    );
};

export default SelectAccountHead;