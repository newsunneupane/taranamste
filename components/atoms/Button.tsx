"use client";
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '', 
  children, 
  ...props 
}) => {

  const base = `
    inline-flex items-center justify-center gap-1.5
    rounded-xl font-semibold transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
    disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale
    active:scale-[0.98] select-none whitespace-nowrap
  `;

  const sizes = {
    sm: "px-3.5 h-8 text-xs font-semibold",
    md: "px-5 h-10 text-sm font-semibold",
    lg: "px-7 h-12 text-sm font-bold"
  };

  const variants = {
    primary: `
      bg-primary text-white shadow-sm
      hover:bg-primary/90 hover:shadow-md hover:-translate-y-[1px]
      focus-visible:ring-primary
    `,
    secondary: `
      bg-card text-text border border-border shadow-sm
      hover:bg-shaded hover:border-border hover:shadow-sm
      focus-visible:ring-primary
    `,
    danger: `
      bg-danger text-white shadow-sm
      hover:bg-danger/90 hover:shadow-md
      focus-visible:ring-danger
    `,
    success: `
      bg-success text-white shadow-sm
      hover:bg-success/90
      focus-visible:ring-success
    `,
    ghost: `
      bg-transparent text-text-muted
      hover:bg-shaded hover:text-text
      focus-visible:ring-primary/50
    `
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};