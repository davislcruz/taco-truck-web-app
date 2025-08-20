import { forwardRef } from "react";
import type { HTMLAttributes, ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/utils";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "alert-success",
      destructive: "alert-error",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "alert shadow-lg",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Toast.displayName = "Toast";

const ToastAction = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn("btn btn-sm", className)}
      {...props}
    />
  )
);
ToastAction.displayName = "ToastAction";

const ToastClose = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn("btn btn-sm btn-circle btn-ghost", className)}
      {...props}
    >
      ✕
    </button>
  )
);
ToastClose.displayName = "ToastClose";

const ToastTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold", className)}
      {...props}
    />
  )
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
);
ToastDescription.displayName = "ToastDescription";

type ToastActionElement = ReactElement<typeof ToastAction>;

export {
  type ToastActionElement,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
};