import { forwardRef } from "react";
import type { HTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const RadioGroup = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("space-y-2", className)}
      {...props}
      ref={ref}
      role="radiogroup"
    />
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      type="radio"
      className={cn("radio radio-primary", className)}
      ref={ref}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };