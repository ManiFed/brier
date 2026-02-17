"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(
  undefined
);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip");
  }
  return context;
}

// TooltipProvider is a no-op wrapper for API compatibility
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface TooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children: React.ReactNode;
}

function Tooltip({
  open: controlledOpen,
  onOpenChange,
  children,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
  const { setOpen, triggerRef } = useTooltipContext();

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, triggerRef]
  );

  return (
    <button
      ref={combinedRef}
      type="button"
      onMouseEnter={(e) => {
        setOpen(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setOpen(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setOpen(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setOpen(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, ...props }, ref) => {
    const { open, triggerRef } = useTooltipContext();
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (!open || !triggerRef.current || !contentRef.current) return;

      const trigger = triggerRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (side) {
        case "top":
          top = trigger.top - content.height - sideOffset;
          left = trigger.left + trigger.width / 2 - content.width / 2;
          break;
        case "bottom":
          top = trigger.bottom + sideOffset;
          left = trigger.left + trigger.width / 2 - content.width / 2;
          break;
        case "left":
          top = trigger.top + trigger.height / 2 - content.height / 2;
          left = trigger.left - content.width - sideOffset;
          break;
        case "right":
          top = trigger.top + trigger.height / 2 - content.height / 2;
          left = trigger.right + sideOffset;
          break;
      }

      setPosition({ top: top + window.scrollY, left: left + window.scrollX });
    }, [open, side, sideOffset, triggerRef]);

    if (!open) return null;

    return (
      <div
        ref={combinedRef}
        className={cn(
          "fixed z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{ top: position.top, left: position.left }}
        {...props}
      />
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
