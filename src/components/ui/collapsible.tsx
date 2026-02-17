"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<
  CollapsibleContextValue | undefined
>(undefined);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "Collapsible components must be used within a Collapsible"
    );
  }
  return context;
}

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const handleOpenChange = React.useCallback(
      (value: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(value);
        }
        onOpenChange?.(value);
      },
      [isControlled, onOpenChange]
    );

    return (
      <CollapsibleContext.Provider
        value={{ open, onOpenChange: handleOpenChange }}
      >
        <div
          ref={ref}
          data-state={open ? "open" : "closed"}
          className={className}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { open, onOpenChange } = useCollapsibleContext();

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={(e) => {
        onOpenChange(!open);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, ...props }, ref) => {
  const { open } = useCollapsibleContext();

  if (!open) return null;

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
