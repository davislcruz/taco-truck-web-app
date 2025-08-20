import { forwardRef } from "react";
import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Dialog = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

const DialogTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      className={cn("btn", className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn("modal modal-open", className)}
      ref={ref}
      {...props}
    >
      <div className="modal-box relative">
        {children}
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn("mb-4", className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});
DialogHeader.displayName = "DialogHeader";

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      className={cn("font-bold text-lg", className)}
      ref={ref}
      {...props}
    >
      {children}
    </h3>
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      className={cn("py-4 text-sm opacity-70", className)}
      ref={ref}
      {...props}
    >
      {children}
    </p>
  );
});
DialogDescription.displayName = "DialogDescription";

const DialogClose = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      className={cn("btn btn-sm btn-circle btn-ghost absolute right-2 top-2", className)}
      ref={ref}
      {...props}
    >
      {children || "✕"}
    </button>
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
};