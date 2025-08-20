import { forwardRef } from "react";
import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "label-text text-base-content font-medium",
        className
      )}
      {...props}
    />
  )
);

Label.displayName = "Label";

export { Label };