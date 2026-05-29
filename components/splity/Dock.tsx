"use client";

import { cn } from "@/lib/utils";

interface DockButton {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface DockProps {
  primary: DockButton;
  ghost?: DockButton;
}

export function Dock({ primary, ghost }: DockProps) {
  return (
    <div
      className="flex-none px-[18px] pt-3 flex flex-col gap-3"
      style={{
        paddingBottom: "calc(30px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(to top, var(--sp-bg) 56%, transparent)",
      }}
    >
      {ghost && (
        <button
          onClick={ghost.onClick}
          disabled={ghost.disabled}
          className={cn(
            "w-full border cursor-pointer font-[family-name:var(--font-ui)]",
            "text-[17px] font-bold text-sp-text tracking-[-0.01em]",
            "bg-sp-surface border-sp-hairline-2 rounded-sp-md px-4 py-4",
            "flex items-center justify-center gap-[9px] shadow-sp-card-sm",
            "active:scale-[0.98] transition-transform duration-[150ms]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {ghost.label}
        </button>
      )}
      <button
        onClick={primary.onClick}
        disabled={primary.disabled}
        className={cn(
          "w-full border-none cursor-pointer font-[family-name:var(--font-ui)]",
          "text-[17px] font-bold text-white tracking-[-0.01em]",
          "bg-sp-accent rounded-sp-md px-4 py-4 shadow-sp-accent",
          "flex items-center justify-center gap-[9px]",
          "active:scale-[0.98] active:bg-sp-accent-press transition-transform duration-[150ms]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        )}
      >
        {primary.label}
      </button>
    </div>
  );
}
