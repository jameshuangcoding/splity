"use client";

import { useBillStore } from "@/stores/bill-store";
import { TopBar } from "./TopBar";
import { HomeScreen } from "./screens/HomeScreen";

// Placeholder — replaced per-phase
function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sp-text-dim">
      <span className="text-[15px] font-medium">{label}</span>
    </div>
  );
}

const PLACEHOLDER_LABELS = [
  "Receipt Review — Phase 4",
  "People — Phase 5",
  "Assign — Phase 6",
  "Summary — Phase 7",
  "Send — Phase 8",
];

export function StepRouter() {
  const step = useBillStore((s) => s.step);
  const theme = useBillStore((s) => s.theme);
  const prevStep = useBillStore((s) => s.prevStep);
  const toggleTheme = useBillStore((s) => s.toggleTheme);

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

      {/* Screen slot — each screen owns its scroll area and dock */}
      <div className="flex-1 flex flex-col min-h-0">
        {step === 0 && <HomeScreen />}
        {step > 0 && (
          <PlaceholderScreen
            label={PLACEHOLDER_LABELS[step - 1] ?? "Unknown step"}
          />
        )}
      </div>
    </div>
  );
}
