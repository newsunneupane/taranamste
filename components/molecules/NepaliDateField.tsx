"use client";
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    setValue(toBs(current) || null);
  }, [current]);

  const handleChange = (d: NepaliDate | undefined) => {
    const next = d ?? null;
    setValue(next);
    onChange?.(bsToAdIso(next));
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-text-muted tracking-wide px-0.5 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-danger text-[11px]">*</span>}
      </label>

      {name && <input type="hidden" name={name} value={bsToAdIso(value)} />}

      <Picker
        id={id}
        value={value ?? undefined}
        onChange={handleChange}
        language={language}
        dateFormat="MM/DD/YYYY"
        captionLayout="dropdown"
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-card text-text border border-border shadow-sm placeholder:text-text-muted/50 outline-none transition-all duration-200 hover:border-slate-300 hover:shadow focus:border-primary focus:ring-4 focus:ring-primary/10 ${className}`}
        calendarClassName="rounded-xl shadow-lg border border-border bg-card"
        closeOnSelect
      />
    </div>
  );
};
