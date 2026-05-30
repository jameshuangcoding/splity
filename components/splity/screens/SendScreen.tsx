"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useBillStore } from "@/stores/bill-store";
import { Ava } from "@/components/splity/Ava";
import { Dock } from "@/components/splity/Dock";
import { Money } from "@/components/splity/Money";
import { Icon } from "@/components/splity/Icon";
import { compute, toCSV } from "@/lib/calculation/engine";
import { cn } from "@/lib/utils";

type ActionType = "venmo" | "zelle" | "copy";

interface ToastState {
  message: string;
  visible: boolean;
}

interface SentState {
  [key: string]: ActionType; // personId → last action taken
}

export function SendScreen() {
  const name = useBillStore((s) => s.name);
  const receipt = useBillStore((s) => s.receipt);
  const people = useBillStore((s) => s.people);
  const assignments = useBillStore((s) => s.assignments);
  const reset = useBillStore((s) => s.reset);

  const [sent, setSent] = useState<SentState>({});
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calc = useMemo(
    () =>
      compute(
        receipt,
        receipt.items,
        people.map((p) => ({ id: p.id, name: p.name, payer: p.payer })),
        assignments
      ),
    [receipt, people, assignments]
  );

  const nonPayers = people.filter((p) => !p.payer);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 1900);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function handleVenmo(personId: string, personName: string) {
    const b = calc.breakdown[personId];
    const amount = (b?.total ?? 0).toFixed(2);
    const note = encodeURIComponent(name || "Bill");
    const url = `venmo://paycharge?txn=pay&recipients=&amount=${amount}&note=${note}`;
    const result = window.open(url, "_blank");
    // window.open returns null when blocked by the browser or no handler exists
    if (result !== null) {
      setSent((prev) => ({ ...prev, [personId]: "venmo" }));
      showToast(`Venmo request opened for ${personName}`);
    } else {
      showToast("Venmo app not found — try Copy instead");
    }
  }

  async function handleZelle(personId: string, personName: string) {
    const b = calc.breakdown[personId];
    const amount = (b?.total ?? 0).toFixed(2);
    const message = `${personName} owes $${amount} for ${name || "Bill"}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // user cancelled share — still mark as sent
      }
    } else {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(message);
      } catch {
        // clipboard unavailable or denied — best-effort fallback
      }
    }

    setSent((prev) => ({ ...prev, [personId]: "zelle" }));
    showToast(`Zelle message ready for ${personName}`);
  }

  async function handleCopy(personId: string, personName: string) {
    const b = calc.breakdown[personId];
    const amount = (b?.total ?? 0).toFixed(2);
    const text = `${personName} — $${amount}`;
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
    } catch {
      showToast("Could not copy — clipboard unavailable");
      return;
    }
    setSent((prev) => ({ ...prev, [personId]: "copy" }));
    showToast("Copied to clipboard");
  }

  function handleExportCSV() {
    const enginePeople = people.map((p) => ({
      id: p.id,
      name: p.name,
      payer: p.payer,
    }));
    const csv = toCSV(name || "Bill", receipt.items, enginePeople, assignments, calc);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "Bill"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const STATUS_LABELS: Record<ActionType, string> = {
    venmo: "✓ venmo sent",
    zelle: "✓ message ready",
    copy: "✓ copied",
  };

  const STATUS_TESTID_PREFIX: Record<ActionType, string> = {
    venmo: "status-venmo",
    zelle: "status-zelle",
    copy: "status-copy",
  };

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          {/* Header */}
          <div className="mt-2 mb-5">
            <h1 className="text-[26px] font-extrabold text-sp-text tracking-[-0.02em] leading-tight mb-[10px]">
              Collect what you&apos;re owed
            </h1>
            <div
              data-testid="memo-chip"
              className={cn(
                "inline-flex items-center gap-[6px]",
                "text-[12px] font-semibold text-sp-text-dim",
                "bg-sp-surface border border-sp-hairline rounded-full px-[10px] py-[5px]"
              )}
            >
              <span className="text-sp-text-faint font-normal">memo ·</span>
              <span>&quot;{name || "Bill"}&quot;</span>
            </div>
          </div>

          {/* Per non-payer cards */}
          <div className="flex flex-col gap-[10px]">
            {nonPayers.map((person) => {
              const b = calc.breakdown[person.id];
              const lastAction = sent[person.id];

              return (
                <div
                  key={person.id}
                  data-testid={`send-card-${person.id}`}
                  className={cn(
                    "bg-sp-surface border border-sp-hairline rounded-sp-lg shadow-sp-card-sm",
                    "px-4 py-[14px]"
                  )}
                >
                  {/* Person row */}
                  <div className="flex items-center gap-3 mb-[14px]">
                    <Ava person={person} size="lg" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[16px] font-bold text-sp-text leading-snug">
                        {person.name}
                      </span>
                    </div>
                    <Money
                      value={b?.total ?? 0}
                      className="text-[21px] font-bold font-num tracking-[-0.02em] text-sp-text flex-none"
                    />
                  </div>

                  {/* Status chip (shown after action) */}
                  {lastAction && (
                    <div className="mb-[12px]">
                      <span
                        data-testid={`${STATUS_TESTID_PREFIX[lastAction]}-${person.id}`}
                        className={cn(
                          "inline-flex items-center gap-[5px]",
                          "text-[12px] font-semibold text-sp-pos",
                          "bg-sp-pos-tint rounded-full px-[10px] py-[4px]"
                        )}
                      >
                        <Icon name="check" size={11} sw={2.5} />
                        {STATUS_LABELS[lastAction]}
                      </span>
                    </div>
                  )}

                  {/* Action button row */}
                  <div className="flex gap-[8px]">
                    <ActionButton
                      label="Venmo"
                      onClick={() => handleVenmo(person.id, person.name)}
                    />
                    <ActionButton
                      label="Zelle"
                      onClick={() => handleZelle(person.id, person.name)}
                    />
                    <ActionButton
                      label="Copy"
                      onClick={() => handleCopy(person.id, person.name)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          data-testid="toast"
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-[100px] left-1/2 -translate-x-1/2 z-50",
            "bg-sp-text text-sp-bg",
            "text-[13px] font-semibold",
            "rounded-full px-[16px] py-[8px] shadow-sp-card"
          )}
        >
          {toast.message}
        </div>
      )}

      <Dock
        primary={{
          label: "Done · new bill",
          onClick: reset,
        }}
        ghost={{
          label: (
            <>
              <Icon name="download" size={18} sw={2} />
              Export to CSV
            </>
          ),
          onClick: handleExportCSV,
        }}
      />
    </>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex-1 py-[10px] rounded-sp-md border border-sp-hairline-2",
        "bg-sp-surface-2 text-[13px] font-bold text-sp-text",
        "active:scale-[0.97] transition-transform duration-[120ms]",
        "cursor-pointer"
      )}
    >
      {label}
    </button>
  );
}
