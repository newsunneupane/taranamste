"use client";

import React, { useMemo } from "react";
import { FormField } from "../../../molecules/FormField";
import { SelectField } from "../../../molecules/selects/SelectField";
import { NepaliDateField } from "@/components/molecules/NepaliDateField";
import { StaffFormInputs } from "@/types/StaffFormInputs";

const departmentOptions = [
    { label: "Child Care (बाल हेरचाह)", value: "CHILD_CARE" },
    { label: "Administration & HR (प्रशासन र मानव संसाधन)", value: "ADMINISTRATION" },
    { label: "Education (शिक्षा)", value: "EDUCATION" },
    { label: "Healthcare & Medical (स्वास्थ्य)", value: "HEALTHCARE" },
    { label: "Kitchen & Nutrition (भान्सा र पोषण)", value: "KITCHEN" },
    { label: "Social Work & Counseling (सामाजिक कार्य)", value: "SOCIAL_WORK" },
    { label: "Security & Maintenance (सुरक्षा र मर्मत)", value: "SECURITY" },
    { label: "Logistics & Transport (रसद र यातायात)", value: "LOGISTICS" },
    { label: "Other (अन्य)", value: "OTHER" },
];

const employmentTypeOptions = [
    { label: "Full Time", value: "FULL_TIME" },
    { label: "Part Time", value: "PART_TIME" },
    { label: "Contract", value: "CONTRACT" },
];

type Props = {
    initialData?: StaffFormInputs;
};

export const EmploymentDetails = ({ initialData }: Props) => {

    const formattedDate = useMemo(() => {
        if (!initialData?.joinDate) return "";
        // Safely handle date formatting
        try {
            return new Date(initialData.joinDate)
                .toISOString()
                .split("T")[0];
        } catch (e) {
            return "";
        }
    }, [initialData?.joinDate]);

    return (
        // Updated: Increased padding to p-8 and gap to 6 for a more spacious, premium feel
        // Added bg-card and transition classes
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-6 transition-colors duration-500">

            <SelectField
                label="Department (विभाग)"
                name="department"
                options={departmentOptions}
                defaultValue={initialData?.department}
                className="text-text"
            />

            <FormField
                label="Designation (पद)"
                name="designation"
                placeholder="e.g. Caregiver, Nurse, Cook"
                defaultValue={initialData?.designation}
                className="text-text placeholder:text-text-muted/40"
            />

            <SelectField
                label="Employment Type (रोजगारी प्रकार)"
                name="employmentType"
                options={employmentTypeOptions}
                defaultValue={initialData?.employmentType}
                className="text-text"
            />

            <NepaliDateField
                label="Date of Joining (कार्यग्रहण मिति)"
                name="joinDate"
                required
                defaultValue={formattedDate}
                language="en"
            />

        </div>
    );
};