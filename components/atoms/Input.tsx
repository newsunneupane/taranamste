"use client";
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`
        w-full px-3.5 py-2.5 text-sm rounded-xl
        bg-card text-text
        border border-border
        placeholder:text-text-muted/50
        outline-none
        shadow-sm
        transition-all duration-200

        hover:border-slate-300 hover:shadow
        focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md
        disabled:opacity-50 disabled:bg-shaded disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
};