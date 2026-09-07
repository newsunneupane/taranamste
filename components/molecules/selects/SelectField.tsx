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
    <div className="flex flex-col gap-2 w-full">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-text-muted tracking-wide px-0.5 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-danger text-[11px]">*</span>}
      </label>

      <div className="relative group">
        <select
          id={id}
          required={required}
          onChange={handleSelectChange}
          {...props}
          className={`
            w-full px-3.5 py-2.5 text-sm rounded-xl
            bg-card text-text
            border border-border shadow-sm
            outline-none appearance-none cursor-pointer
            transition-all duration-200
            hover:border-slate-300 hover:shadow
            focus:border-primary focus:ring-4 focus:ring-primary/10
            ${error ? 'border-danger focus:border-danger focus:ring-danger/15 bg-danger/5' : ''}
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

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <span className="text-xs text-danger font-medium flex items-center gap-1 px-0.5 animate-in fade-in slide-in-from-top-1">
          <span className="w-3.5 h-3.5 rounded-full bg-danger/10 flex items-center justify-center text-[10px]">!</span> {error}
        </span>
      )}
    </div>
  );
};