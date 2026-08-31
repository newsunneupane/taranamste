"use client";
import React from "react";
import { FormField } from "@/components/molecules/FormField";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import { IInventoryLog } from "@/models/InventoryLog";

interface StockFieldsProps {
    unit: string;
    actionType: 'IN' | 'OUT';
    defaultValue?: IInventoryLog;
}

export const StockFormFields: React.FC<StockFieldsProps> = ({ unit, actionType, defaultValue }) => {

    return (
        <div className="space-y-6 transition-colors duration-500">
            {/* Quantity Field */}
            <FormField
                label={`Quantity (${unit}) *`}
                name="quantity"
                type="number"
                required
                defaultValue={defaultValue?.quantity}
                placeholder="e.g. 5"
                // Ensuring text color is linked to theme
                className="text-text"
            />

            {/* Reason/Notes Field */}
            <FormField
                label="Reason / Notes *"
                name="reason"
                required
                defaultValue={defaultValue?.reason}
                placeholder={actionType === 'IN' ? "e.g., Purchased from market" : "e.g., Used for daily meals"}
                className="text-text"
            />

            {/* Date Field */}
            <NepaliDateField
                label="Transaction Date"
                name="date"
                required
                defaultValue={defaultValue?.date 
                    ? new Date(defaultValue.date).toISOString().split('T')[0] 
                    : new Date().toISOString().split('T')[0]
                }
                className="text-text"
            />
        </div>
    );
};