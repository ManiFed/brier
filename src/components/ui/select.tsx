"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  items: { value: string; label: string }[];
  registerItem: (value: string, label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [items, setItems] = React.useState<{ value: string; label: string }[]>(
    []
  );
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  const registerItem = React.useCallback(
    (itemValue: string, label: string) => {
      setItems((prev) => {
        if (prev.some((item) => item.value === itemValue)) return prev;
        return [...prev, { value: itemValue, label }];
      });
    },
    []
  );

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value,
        onValueChange: handleValueChange,
        triggerRef,
        activeIndex,
        setActiveIndex,
        items,
        registerItem,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSelectContext();

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
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, items } = useSelectContext();
  const selectedItem = items.find((item) => item.value === value);
  return (
    <span className={cn(!selectedItem && "text-muted-foreground")}>
      {selectedItem ? selectedItem.label : placeholder}
    </span>
  );
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, activeIndex, setActiveIndex, items, onValueChange } =
      useSelectContext();
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

    // Close on outside click
    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      // Use timeout to avoid catching the trigger click
      const timeout = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeout);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, setOpen]);

    // Keyboard navigation
    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setActiveIndex(
              activeIndex < items.length - 1 ? activeIndex + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setActiveIndex(
              activeIndex > 0 ? activeIndex - 1 : items.length - 1
            );
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            if (activeIndex >= 0 && items[activeIndex]) {
              onValueChange(items[activeIndex].value);
              setOpen(false);
            }
            break;
          case "Escape":
            e.preventDefault();
            setOpen(false);
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, activeIndex, items, onValueChange, setOpen, setActiveIndex]);

    if (!open) return null;

    return (
      <div
        ref={combinedRef}
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value: itemValue, disabled, ...props }, ref) => {
    const { value, onValueChange, setOpen, registerItem, items, activeIndex } =
      useSelectContext();
    const isSelected = value === itemValue;
    const label = typeof children === "string" ? children : itemValue;

    React.useEffect(() => {
      registerItem(itemValue, label);
    }, [itemValue, label, registerItem]);

    const itemIndex = items.findIndex((item) => item.value === itemValue);
    const isActive = itemIndex === activeIndex;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        data-disabled={disabled || undefined}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
          isActive && "bg-accent text-accent-foreground",
          isSelected && "font-medium",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={() => {
          if (!disabled) {
            onValueChange(itemValue);
            setOpen(false);
          }
        }}
        {...props}
      >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
