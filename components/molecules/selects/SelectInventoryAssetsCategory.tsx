"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

export const SelectAssetCategory = ({ defaultValue = "", ...props }: any) => {
    const [options, setOptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedValue, setSelectedValue] = useState(defaultValue);
    const { openAddAssetCategory } = useUIModals();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => { setSelectedValue(defaultValue); }, [defaultValue]);
    useEffect(() => {
        const fetchCats = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/inventory/categories?type=ASSET', { cache: 'no-store' });
                const data = await res.json();
                setOptions(data.map((c: any) => ({ label: c.name, value: c._id })));
                if (data.length === 0) setSelectedValue("");
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
                if (newData?.value) setSelectedValue(newData.value);
                setRefreshTrigger(prev => prev + 1);
            }
        });
    };

    return (
        <SelectField
            {...props}
            label={isLoading ? 'Loading...' : 'Asset Class'}
            options={options}
            disabled={false}
            value={selectedValue}
            onChange={(e: any) => setSelectedValue(e.target.value)}
            required={props.required && !isLoading}
            defaultValue={undefined}
            onAddItem={handleAddItem}
        />
    );
};