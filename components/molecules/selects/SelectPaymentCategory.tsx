"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

interface CategoryOption {
    label: string;
    value: string;
}

// ✨ Added forceType to strictly filter the list (e.g., "BANK")
const SelectPaymentCategory = ({ defaultValue = "", forceType = "", ...props }) => {
    const [options, setOptions] = useState<CategoryOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openAddCateGoryForm } = useUIModals();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/finances/payment-categories');
                const data = await response.json();

                // ✨ Filter by identifier if forceType is provided
                const filtered = forceType 
                    ? data.filter((cat: any) => cat.identifier === forceType)
                    : data;

                const formatted = filtered.map((cat: any) => ({
                    label: `${cat.name} (${cat.identifier})`,
                    value: cat._id,
                }));

                setOptions(formatted);
            } catch (error) {
                console.error("Failed to fetch payment categories:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, [refreshKey, forceType]); // Re-fetch if forceType changes

    return (
        <SelectField
            {...props}
            label={isLoading ? 'Loading...' : props.label || 'Money Account'}
            options={options}
            disabled={isLoading}
            defaultValue={defaultValue}
            onAddItem={() => openAddCateGoryForm({ 
                defaultIdentifier: forceType, // Pass to form to auto-select type
                onSaved: () => setRefreshKey(prev => prev + 1) 
            })} 
        />
    );
};

export default SelectPaymentCategory;