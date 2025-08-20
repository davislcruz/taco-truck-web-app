import { forwardRef } from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

interface TooltipProps {
  children: ReactNode;
}

const Tooltip = ({ children }: TooltipProps) => {
  return <>{children}</>;
};

interface TooltipTriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const TooltipTrigger = forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("tooltip", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("tooltip-content", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TooltipContent.displayName = "TooltipContent";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};