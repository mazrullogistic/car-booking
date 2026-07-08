"use client";

import {
  type InputHTMLAttributes,
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type SuggestOption = {
  value: string;
  label: string;
  meta?: Record<string, string>;
};

interface SuggestInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SuggestOption[];
  onSelectOption?: (option: SuggestOption) => void;
  filterKeys?: ("value" | "label")[];
}

export const SuggestInput = forwardRef<HTMLInputElement, SuggestInputProps>(
  (
    {
      label,
      error,
      hint,
      options,
      onSelectOption,
      filterKeys = ["value", "label"],
      className = "",
      id,
      value,
      onChange,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const query = String(value ?? "").trim().toLowerCase();
    const filtered = useMemo(() => {
      if (!query) return options.slice(0, 8);
      return options
        .filter((opt) =>
          filterKeys.some((key) =>
            String(opt[key] ?? "")
              .toLowerCase()
              .includes(query),
          ),
        )
        .slice(0, 8);
    }, [options, query, filterKeys]);

    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
      <div className="relative flex flex-col gap-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onChange?.(e);
            setOpen(true);
          }}
          onFocus={(e) => {
            onFocus?.(e);
            setOpen(true);
          }}
          onBlur={(e) => {
            onBlur?.(e);
          }}
          className={`h-10 w-full rounded-lg border bg-card-bg px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-border-light disabled:opacity-60 ${
            error ? "border-danger" : "border-border"
          } ${className}`}
          {...props}
        />
        {open && filtered.length > 0 && (
          <ul className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card-bg py-1 shadow-lg">
            {filtered.map((opt) => (
              <li key={`${opt.value}-${opt.label}`}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-border-light"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelectOption?.(opt);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-text-primary">{opt.label}</span>
                  {opt.value !== opt.label && (
                    <span className="text-xs text-text-muted">{opt.value}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  },
);

SuggestInput.displayName = "SuggestInput";
