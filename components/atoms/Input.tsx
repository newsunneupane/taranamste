"use client";
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`
        w-full px-3 py-2.5 text-[13px] rounded-lg
        bg-bg text-text
        border border-border
        placeholder:text-text-muted/40
        outline-none
        transition-all duration-300

        hover:border-border
        focus:ring-2 focus:ring-primary/10
        focus:border-primary

        disabled:opacity-50 disabled:bg-shaded disabled:cursor-not-allowed
        color-scheme-adaptive
        
        ${className}
      `}
      {...props}
    />
  );
};