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
    inline-flex items-center justify-center
    rounded-xl font-bold transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg
    disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale
    active:scale-95
  `;

  const sizes = {
    sm: "px-3 h-7 text-[10px] uppercase tracking-widest",
    md: "px-5 h-9 text-xs",
    lg: "px-8 h-11 text-sm"
  };

  const variants = {
    // Brand Action: Deep blue, glowing shadow
    primary: `
      bg-primary text-text-invert
      hover:opacity-90 
      focus:ring-primary shadow-glow
    `,

    // Surface Action: Blends with cards, pops on hover
    secondary: `
      bg-card text-text border border-border
      hover:bg-shaded hover:border-text-muted/30
      focus:ring-primary shadow-sm
    `,

    // Destructive: Audit deletions and errors
    danger: `
      bg-danger text-text-invert
      hover:bg-danger/90
      focus:ring-danger shadow-glow-danger
    `,

    // Constructive: Financial income and inventory additions
    success: `
      bg-success text-text-invert
      hover:bg-success/90
      focus:ring-success shadow-glow-success
    `,

    // Subtle: The "Glass" look for secondary header actions
    ghost: `
      bg-transparent text-text-muted
      hover:bg-shaded/80 hover:text-text
      focus:ring-primary/50
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