import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    const baseClasses = "btn";
    
    const variantClasses = {
      default: "btn-primary",
      ghost: "btn-ghost", 
      outline: "btn-outline",
      destructive: "btn-error",
      secondary: "btn-secondary",
      link: "btn-link"
    };

    const sizeClasses = {
      default: "",
      sm: "btn-sm",
      lg: "btn-lg", 
      icon: "btn-sm btn-square"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          disabled && "btn-disabled",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };