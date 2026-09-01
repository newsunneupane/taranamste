"use client";
import React from 'react';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  onAddItem?: () => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  onAddItem,
  label,
  options,
  id,
  required,
  error,
  className = '',
  onChange,
  ...props
}) => {

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW_TRIGGER" && onAddItem) {
      onAddItem();
      e.target.value = ""; 
      return;
    }
    if (onChange) onChange(e);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full transition-colors duration-500">
      <label
        htmlFor={id}
        className="text-[9px] font-black uppercase tracking-[0.12em] text-text-muted opacity-90"
      >
        {label}{" "}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>

      <div className="relative group">
        <select
          id={id}
          required={required}
          onChange={handleSelectChange}
          {...props}
          className={`
            w-full px-3 py-2.5 text-[13px] rounded-lg
            bg-card text-text
            border border-border
            outline-none appearance-none cursor-pointer
            transition-all duration-300
            hover:border-primary/50
            focus:ring-2 focus:ring-primary/10 focus:border-primary
            ${error ? 'border-danger focus:ring-danger/10' : ''}
            ${className}
          `}
        >
          <option value="" disabled hidden className="bg-card text-text-muted">
            Select an option...
          </option>

          {options.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="text-text bg-card"
            >
              {opt.label}
            </option>
          ))}

          {onAddItem && (
            <option 
              value="ADD_NEW_TRIGGER" 
              className="text-primary font-black bg-shaded"
            >
              + Add New Option
            </option>
          )}
        </select>

        {/* Custom Arrow - using text-text-muted */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted opacity-50 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <span className="text-[10px] text-danger font-bold mt-1 animate-in fade-in slide-in-from-top-1">
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};