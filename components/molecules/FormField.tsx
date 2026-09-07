"use client";
import React from 'react';
import { Input } from '../atoms/Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, error, id, required, ...props 
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label 
        htmlFor={id} 
        className="text-xs font-semibold text-text-muted tracking-wide px-0.5 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-danger text-[11px]">*</span>}
      </label>
      <Input 
        id={id} 
        required={required} 
        aria-invalid={!!error}
        className={`
          ${error 
            ? "border-danger focus:border-danger focus:ring-danger/15 bg-danger/5" 
            : ""
          }
        `}
        {...props} 
      />
      {error && (
        <span className="text-xs text-danger font-medium flex items-center gap-1 px-0.5 animate-in fade-in slide-in-from-top-1">
          <span className="w-3.5 h-3.5 rounded-full bg-danger/10 flex items-center justify-center text-[10px]">!</span> {error}
        </span>
      )}
    </div>
  );
};