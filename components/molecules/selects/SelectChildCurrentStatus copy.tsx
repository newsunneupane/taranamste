"use client";

import React, { useEffect, useState } from 'react';
import { SelectField } from './SelectField';
import { useUIModals } from "@/hooks/useUIModal";

interface StatusOption {
    label: string;
    value: string;
}

const SelectChildStatus = ({ defaultValue = "", ...props }) => {
    const [options, setOptions] = useState<StatusOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openChildStatusCategoriesForm } = useUIModals(); 
    
    const [refreshKey, setRefreshKey] = useState(0);

    const handleStatusAdded = () => {
        setRefreshKey(prev => prev + 1); 
    };

    useEffect(() => {
        const fetchStatuses = async () => {
            setIsLoading(true);
            try {
                // ✨ Pointing to the new simple status registry endpoint
                const response = await fetch('/api/children/status-registry');
                const data = await response.json();

                // Since we're using simple names, label and value are likely the same
                // or cat.name and cat._id depending on your preference
                const formatted = data.map((status: any) => ({
                    label: status.name,
                    value: status.name, // Using name as value since it's just a string tally
                }));

                setOptions(formatted);
            } catch (error) {
                console.error("Failed to fetch child statuses:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatuses();
    }, [refreshKey]);

    return (
        <div className="relative group">
            <SelectField
                {...props}
                label={isLoading ? 'Loading...' : 'Current Status'}
                options={options}
                disabled={isLoading}
                defaultValue={defaultValue}
                // ✨ Triggering the simple modal we just built
                onAddItem={() => openChildStatusCategoriesForm({ onSaved: handleStatusAdded })} 
            />
            
            {/* Kree Corp Indicator */}
            {!isLoading && (
                <div className="absolute top-0 right-0 h-1 w-8 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </div>
    );
};

export default SelectChildStatus;