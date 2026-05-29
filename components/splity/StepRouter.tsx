"use client";

import { useBillStore } from "@/stores/bill-store";
import { TopBar } from "./TopBar";

// Placeholder screen — replaced in Phase 3+
function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-sp-text-dim">
      <span className="text-[15px] font-medium">{label}</span>
    </div>
  );
}

const SCREEN_LABELS = [
  "Home — Phase 3",
  "Receipt Review — Phase 4",
  "People — Phase 5",
  "Assign — Phase 6",
  "Summary — Phase 7",
  "Send — Phase 8",
];

export function StepRouter() {
  const { step, theme, prevStep, toggleTheme } = useBillStore();

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        height: "100dvh",
        background:
          "radial-gradient(120% 80% at 50% -10%, var(--sp-surface) 0%, var(--sp-bg) 60%)",
        color: "var(--sp-text)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <TopBar
        step={step}
        theme={theme}
        onBack={prevStep}
        showBack={step > 0}
        onToggleTheme={toggleTheme}
      />

      {/* Top spacer — clears the absolute TopBar */}
      <div className="h-[98px] flex-none" />

      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px]"
        style={{ scrollbarWidth: "none" }}
      >
        <PlaceholderScreen label={SCREEN_LABELS[step] ?? "Unknown step"} />
      </div>
    </div>
  );
}
