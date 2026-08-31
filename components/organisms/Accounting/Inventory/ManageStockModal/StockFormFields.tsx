"use client";
import React from "react";
import { FormField } from "@/components/molecules/FormField";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import InventoryLog, { IInventoryLog } from "@/models/InventoryLog";

interface StockFieldsProps {
    unit: string;
    actionType: 'IN' | 'OUT';
    defaultValue?: IInventoryLog;
}

export const StockFormFields: React.FC<StockFieldsProps> = ({ unit, actionType, defaultValue }) => {

    return (
        <div className="space-y-6">
            <FormField
                label={`Quantity (${unit}) *`}
                name="quantity"
                type="number"
                required
                defaultValue={defaultValue?.quantity}
                placeholder="e.g. 5"
            />

            <FormField
                label="Reason / Notes *"
                name="reason"
                required
                defaultValue={defaultValue?.reason}
                placeholder={actionType === 'IN' ? "e.g., Purchased from market" : "e.g., Used for daily meals"}
            />

            <NepaliDateField
                label="Date of Purchase"
                name="date"
                defaultValue={defaultValue?.date ? new Date(defaultValue.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />
        </div>
    );
};