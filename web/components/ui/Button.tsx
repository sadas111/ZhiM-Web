"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-sky-500/15 ring-1 ring-sky-500/15 hover:shadow-sky-500/25 active:shadow-sky-500/10 transition-[transform,box-shadow,background-color] duration-200",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-1 ring-border transition-[transform,background-color,box-shadow] duration-200",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-sky-500/15 transition-[transform,background-color,box-shadow] duration-200",
  ghost:
    "text-muted-foreground hover:bg-accent hover:text-accent-foreground ring-1 ring-transparent hover:ring-sky-500/10 transition-[transform,background-color,box-shadow,color] duration-200",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        active:translate-y-[0.5px]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
