"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined
);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet provider");
  }
  return context;
}

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
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
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { onOpenChange } = useSheetContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onOpenChange(true);
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useSheetContext();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
SheetClose.displayName = "SheetClose";

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b translate-y-0 data-[state=closed]:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 border-t translate-y-0 data-[state=closed]:translate-y-full",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm translate-x-0 data-[state=closed]:-translate-x-full",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-r sm:max-w-sm translate-x-0 data-[state=closed]:translate-x-full",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => {
    const { open, onOpenChange } = useSheetContext();
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (open) {
        // Small delay to trigger CSS transition
        requestAnimationFrame(() => {
          setVisible(true);
        });
      } else {
        setVisible(false);
      }
    }, [open]);

    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }, [open, onOpenChange]);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/80 transition-opacity duration-300",
            visible ? "opacity-100" : "opacity-0"
          )}
          onClick={() => onOpenChange(false)}
        />
        {/* Content */}
        <div
          ref={ref}
          data-state={visible ? "open" : "closed"}
          className={cn(sheetVariants({ side }), className)}
          {...props}
        >
          {children}
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
      </div>,
      document.body
    );
  }
);
SheetContent.displayName = "SheetContent";

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
}

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
