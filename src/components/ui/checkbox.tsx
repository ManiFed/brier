"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState<boolean | "indeterminate">(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleClick = () => {
      const newChecked = checked === "indeterminate" ? true : !checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked === "indeterminate" ? "mixed" : checked}
        data-state={
          checked === "indeterminate"
            ? "indeterminate"
            : checked
              ? "checked"
              : "unchecked"
        }
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className="flex items-center justify-center text-current">
          {checked === "indeterminate" ? (
            <Minus className="h-3 w-3" />
          ) : checked ? (
            <Check className="h-3 w-3" />
          ) : null}
        </span>
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
