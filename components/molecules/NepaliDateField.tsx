"use client";
import React, { useState } from "react";
import { Picker, type NepaliDate } from "@munatech/nepali-datepicker";
import { bsToAdIso, toBs } from "@/lib/nepaliDate";

interface NepaliDateFieldProps {
  label: string;
  name?: string;
  id?: string;
  required?: boolean;
  defaultValue?: string;
  /** Controlled AD ISO value (YYYY-MM-DD). When provided, the picker is fully controlled. */
  value?: string;
  /** Called whenever the selected date changes. Receives the AD ISO string ("" if cleared). */
  onChange?: (adIso: string) => void;
  className?: string;
  placeholder?: string;
  language?: "en" | "ne";
}

/**
 * A Nepali (Bikram Sambat) date field for standard HTML forms.
 *
 * The picker lets the user choose a BS date, but this component writes the
 * selected date back to the form as an AD (Gregorian) `YYYY-MM-DD` string in a
 * hidden input, so the existing server actions / database keep working unchanged.
 */
export const NepaliDateField: React.FC<NepaliDateFieldProps> = ({
  label,
  name,
  id,
  required,
  defaultValue,
  value: controlledValue,
  onChange,
  className = "",
  placeholder = "Select Nepali Date",
  language = "en",
}) => {
  const current = controlledValue !== undefined ? controlledValue : defaultValue;
  const [value, setValue] = useState<NepaliDate | null>(() => toBs(current) || null);

  const handleChange = (d: NepaliDate | undefined) => {
    const next = d ?? null;
    setValue(next);
    onChange?.(bsToAdIso(next));
  };

  return (
    <div className="flex flex-col gap-2 w-full transition-colors duration-500">
      <label
        htmlFor={id}
        className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted opacity-90 px-1"
      >
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>

      {/* Hidden AD value the server actually receives (only when a name is set) */}
      {name && <input type="hidden" name={name} value={bsToAdIso(value)} />}

      <Picker
        id={id}
        value={value ?? undefined}
        onChange={handleChange}
        language={language}
        dateFormat="YYYY-MM-DD"
        captionLayout="dropdown"
        placeholder={placeholder}
        className={`w-full px-4 py-3 text-sm rounded-xl bg-bg text-text border border-border placeholder:text-text-muted/40 outline-none transition-all duration-300 hover:border-border/80 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:shadow-glow ${className}`}
        calendarClassName="rounded-2xl shadow-lg border border-border bg-card"
        closeOnSelect
      />
    </div>
  );
};
