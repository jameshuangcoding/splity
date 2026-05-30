"use client";

import { useMemo, useState } from "react";
import { useBillStore } from "@/stores/bill-store";
import { Ava, AvaStack } from "@/components/splity/Ava";
import { Dock } from "@/components/splity/Dock";
import { Money } from "@/components/splity/Money";
import { AssignSheet } from "@/components/splity/AssignSheet";
import { compute } from "@/lib/calculation/engine";
import { cn } from "@/lib/utils";

export function AssignScreen() {
  const receipt = useBillStore((s) => s.receipt);
  const people = useBillStore((s) => s.people);
  const assignments = useBillStore((s) => s.assignments);
  const setAssignments = useBillStore((s) => s.setAssignments);
  const nextStep = useBillStore((s) => s.nextStep);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);

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

  function handleDone(itemId: string, assignees: string[]) {
    const next = { ...assignments };
    if (assignees.length === 0) {
      delete next[itemId];
    } else {
      next[itemId] = assignees;
    }
    setAssignments(next);
    setActiveItemId(null);
  }

  function splitRemaining() {
    const allIds = people.map((p) => p.id);
    const next = { ...assignments };
    for (const item of receipt.items.filter((it) => !it.isDiscount)) {
      if (!(next[item.id] || []).length) {
        next[item.id] = allIds;
      }
    }
    setAssignments(next);
  }

  const regularItems = receipt.items.filter((it) => !it.isDiscount);
  const { assignedCount, itemCount, fullyAssigned } = calc;
  const unassignedCount = itemCount - assignedCount;
  const activeItem = activeItemId
    ? receipt.items.find((it) => it.id === activeItemId)
    : null;

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          {/* Compact header */}
          <div className="pt-1.5 pb-[18px]">
            <div className="text-[12px] font-bold tracking-[0.14em] uppercase text-sp-text-faint mb-[9px]">
              Step 3 · Assign
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-[30px] font-extrabold tracking-[-0.02em] leading-[1.05] text-sp-text">
                Who had what?
              </div>
              <span
                className={cn(
                  "text-[13px] font-semibold px-[10px] py-[4px] rounded-full flex-none",
                  fullyAssigned
                    ? "bg-sp-pos-tint text-sp-pos"
                    : "bg-sp-surface-2 text-sp-text-dim"
                )}
              >
                {assignedCount}/{itemCount} assigned
              </span>
            </div>
          </div>

          {/* Live rail */}
          <div
            className="flex gap-4 overflow-x-auto mb-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {people.map((person) => {
              const total = calc.breakdown[person.id]?.total ?? 0;
              return (
                <div
                  key={person.id}
                  className="flex flex-col items-center gap-[6px] flex-none"
                >
                  <Ava person={person} />
                  <span
                    data-testid={`rail-name-${person.id}`}
                    className="text-[11px] font-semibold text-sp-text-dim leading-none"
                  >
                    {person.name}
                  </span>
                  <span data-testid={`rail-total-${person.id}`}>
                    <Money
                      value={total}
                      className="text-[13px] font-bold font-num text-sp-text leading-none"
                    />
                  </span>
                </div>
              );
            })}
          </div>

          {/* Items card */}
          <div className="bg-sp-surface border border-sp-hairline rounded-sp-lg overflow-hidden shadow-sp-card-sm">
            {regularItems.map((item, i) => {
              const assignees = assignments[item.id] || [];
              const assignedPeople = people.filter((p) =>
                assignees.includes(p.id)
              );
              const isAssigned = assignees.length > 0;

              return (
                <button
                  key={item.id}
                  aria-label={`Assign ${item.name}`}
                  onClick={() => setActiveItemId(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-[13px] text-left",
                    "active:bg-sp-surface-2 transition-colors duration-[100ms]",
                    i < regularItems.length - 1 &&
                      "border-b border-sp-hairline"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-sp-text leading-snug truncate">
                      {item.name}
                    </p>
                    {assignees.length > 1 && (
                      <p className="text-[12px] text-sp-text-dim mt-[2px]">
                        ÷{assignees.length} ea
                      </p>
                    )}
                  </div>

                  <span className="text-[14px] font-bold font-num text-sp-text-dim flex-none">
                    ${item.price.toFixed(2)}
                  </span>

                  {isAssigned ? (
                    <AvaStack people={assignedPeople} size="sm" />
                  ) : (
                    <span
                      className={cn(
                        "text-[12px] font-semibold text-sp-text-faint",
                        "bg-sp-surface-2 border border-dashed border-sp-hairline-2",
                        "rounded-full px-[10px] py-[5px] flex-none"
                      )}
                    >
                      tap to assign
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Split remaining */}
          {!fullyAssigned && (
            <button
              aria-label={`Split the remaining ${unassignedCount} evenly`}
              onClick={splitRemaining}
              className={cn(
                "mt-4 w-full text-[14px] font-semibold text-sp-accent",
                "py-[11px] rounded-sp-sm border border-dashed border-sp-accent/30",
                "active:bg-sp-accent-tint transition-colors duration-[120ms]"
              )}
            >
              Split the remaining {unassignedCount} evenly
            </button>
          )}
        </div>
      </div>

      <Dock
        primary={{
          label: <>See the breakdown →</>,
          onClick: nextStep,
        }}
      />

      {activeItem && (
        <AssignSheet
          item={activeItem}
          currentAssignees={assignments[activeItem.id] || []}
          people={people}
          onDone={(assignees) => handleDone(activeItem.id, assignees)}
          onClose={() => setActiveItemId(null)}
        />
      )}
    </>
  );
}
