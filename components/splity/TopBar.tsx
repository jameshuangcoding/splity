"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import type { Theme } from "@/types";

interface TopBarProps {
  step: number;
  total?: number;
  onBack?: () => void;
  showBack?: boolean;
  theme: Theme;
  onToggleTheme: () => void;
}

export function TopBar({
  step,
  total = 6,
  onBack,
  showBack = true,
  theme,
  onToggleTheme,
}: TopBarProps) {
  return (
    <div className="absolute top-[52px] left-0 right-0 z-[8] flex items-center gap-[10px] px-4">
      <button
        className={cn(
          "w-[38px] h-[38px] rounded-full flex-none flex items-center justify-center",
          "bg-sp-surface border border-sp-hairline shadow-sp-card-sm text-sp-text cursor-pointer",
          "active:scale-[0.92] transition-transform duration-[150ms]",
          !showBack && "invisible"
        )}
        onClick={onBack}
        aria-label="Back"
        tabIndex={showBack ? 0 : -1}
      >
        <Icon name="back" size={20} />
      </button>

      <div className="flex-1 flex gap-[5px] items-center">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i <= step;
          return (
            <div
              key={i}
              role="presentation"
              className="flex-1 h-[4px] rounded-full bg-sp-hairline-2 overflow-hidden"
            >
              <div
                data-fill={filled ? "true" : "false"}
                className={cn(
                  "h-full rounded-full bg-sp-accent transition-none",
                  filled ? "w-full" : "w-0"
                )}
              />
            </div>
          );
        })}
      </div>

      <button
        className="w-[38px] h-[38px] rounded-full flex-none flex items-center justify-center bg-sp-surface border border-sp-hairline shadow-sp-card-sm text-sp-text cursor-pointer active:scale-[0.92] transition-transform duration-[150ms]"
        onClick={onToggleTheme}
        aria-label="Toggle theme"
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
      </button>
    </div>
  );
}
