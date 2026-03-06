"use client";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  uncheckedBg?: string;
}

export function Toggle({
  checked,
  onChange,
  className = "",
  uncheckedBg = "var(--color-border-light)",
}: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`btn-toggle flex h-7 w-[52px] shrink-0 items-center rounded-[14px] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${className}`}
      style={{
        backgroundColor: checked ? "var(--color-primary)" : uncheckedBg,
        transition: "background-color 0.12s ease-out",
      }}
    >
      <span
        className="block h-5 w-5 shrink-0 rounded-[10px] bg-[var(--color-bg-card)] shadow-sm"
        style={{
          transform: checked ? "translateX(24px)" : "translateX(0)",
          transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      />
    </button>
  );
}
