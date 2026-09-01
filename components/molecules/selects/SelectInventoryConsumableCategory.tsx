"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

export const SelectConsumableCategory = ({ defaultValue = "", ...props }: any) => {
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openAddConsumableCategory } = useUIModals();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchCats = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/inventory/categories?type=CONSUMABLE');
                const data = await res.json();
                setOptions(data.map((c: any) => ({ label: c.name, value: c._id })));
            } catch (err) {
                console.error("Consumable Fetch Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCats();
    }, [refreshTrigger]);

    const handleAddItem = () => {
        openAddConsumableCategory({
            onSaved: (newData?: any) => {
                setRefreshTrigger(prev => prev + 1);
            }
        });
    };

    return (
        <SelectField
            {...props}
            label={isLoading ? 'Loading...' : 'Consumable Class'}
            options={options}
            disabled={isLoading}
            defaultValue={defaultValue}
            onAddItem={handleAddItem}
        />
    );
};