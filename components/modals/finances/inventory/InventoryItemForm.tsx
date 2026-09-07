"use client";
import React from "react";
import { ConsumableItemForm } from "./InventoryItemFormConsumable";

export const InventoryItemForm = ({ item, closeModal }: { item?: any; closeModal: () => void; }) => {
    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                <ConsumableItemForm item={item} closeModal={closeModal} />
            </div>
        </div>
    );
};