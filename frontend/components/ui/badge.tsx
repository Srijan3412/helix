import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "outline";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = "secondary", className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border";

    const variants = {
      primary: "bg-primary/10 text-primary border-primary/20",
      secondary: "bg-zinc-800 text-zinc-300 border-zinc-700/60",
      success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      error: "bg-red-500/10 text-red-400 border-red-500/20",
      outline: "bg-transparent text-zinc-400 border-zinc-700",
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";