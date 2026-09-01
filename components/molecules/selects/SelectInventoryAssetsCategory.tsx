"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

export const SelectAssetCategory = ({ defaultValue = "", ...props }: any) => {
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openAddAssetCategory } = useUIModals();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchCats = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/inventory/categories?type=ASSET');
                const data = await res.json();
                // Map data to the format SelectField expects
                setOptions(data.map((c: any) => ({ label: c.name, value: c._id })));
            } catch (err) {
                console.error("Asset Fetch Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCats();
    }, [refreshTrigger]);

    const handleAddItem = () => {
        openAddAssetCategory({
            onSaved: (newData?: any) => {
                // Incrementing state forces the useEffect to run again
                setRefreshTrigger(prev => prev + 1);
            }
        });
    };

    return (
        <SelectField
            {...props}
            label={isLoading ? 'Loading...' : 'Asset Class'}
            options={options}
            disabled={isLoading}
            defaultValue={defaultValue}
            onAddItem={handleAddItem}
        />
    );
};