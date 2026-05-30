"use client";

import { useState } from "react";
import { Ava } from "@/components/splity/Ava";
import { Icon } from "@/components/splity/Icon";
import { cn } from "@/lib/utils";
import type { StorePerson, StoreLineItem } from "@/types";

interface AssignSheetProps {
  item: StoreLineItem;
  currentAssignees: string[];
  people: StorePerson[];
  onDone: (assignees: string[]) => void;
  onClose: () => void;
}

export function AssignSheet({
  item,
  currentAssignees,
  people,
  onDone,
  onClose,
}: AssignSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(currentAssignees)
  );

  function toggle(personId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(people.map((p) => p.id)));
  }

  const splitCount = selected.size;
  const sharePrice = splitCount > 1 ? item.price / splitCount : null;

  return (
    <>
      {/* Scrim */}
      <div
        data-testid="assign-scrim"
        className="fixed inset-0 z-40 bg-sp-scrim animate-scrim-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Assign ${item.name}`}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-sp-surface rounded-t-[24px]",
          "px-[18px] pt-5",
          "animate-sheet-up shadow-sp-card"
        )}
        style={{
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full bg-sp-hairline-2 mx-auto mb-4" />

        {/* Item header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[18px] font-bold text-sp-text leading-snug">
            {item.name}
          </span>
          <span className="text-[18px] font-bold text-sp-text font-num">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <div className="mb-4 min-h-[20px]">
          {sharePrice !== null && (
            <p className="text-[13px] text-sp-text-dim">
              ÷{splitCount} · ${sharePrice.toFixed(2)} ea
            </p>
          )}
        </div>

        {/* Person toggle grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {people.map((person) => {
            const isSelected = selected.has(person.id);
            return (
              <button
                key={person.id}
                aria-label={`Toggle ${person.name}`}
                aria-pressed={isSelected}
                onClick={() => toggle(person.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-[11px] rounded-sp-sm",
                  "border transition-colors duration-[120ms]",
                  isSelected
                    ? "bg-sp-accent-tint border-sp-accent"
                    : "bg-sp-surface-2 border-sp-hairline-2"
                )}
              >
                <Ava person={person} size="sm" />
                <span
                  className={cn(
                    "flex-1 text-left text-[14px] font-semibold leading-none",
                    isSelected ? "text-sp-accent" : "text-sp-text"
                  )}
                >
                  {person.name}
                </span>
                {isSelected && (
                  <Icon
                    name="check"
                    size={16}
                    sw={2.2}
                    className="text-sp-accent flex-none"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Everyone + Done */}
        <div className="flex gap-2">
          <button
            aria-label="Everyone"
            onClick={selectAll}
            className={cn(
              "flex-1 py-[13px] rounded-sp-md text-[15px] font-bold text-sp-text",
              "border border-sp-hairline-2 bg-sp-surface-2",
              "active:scale-[0.98] transition-transform duration-[120ms]"
            )}
          >
            Everyone
          </button>
          <button
            aria-label="Done"
            onClick={() => onDone(Array.from(selected))}
            className={cn(
              "flex-[2] py-[13px] rounded-sp-md text-[15px] font-bold text-white",
              "bg-sp-accent shadow-sp-accent",
              "active:scale-[0.98] active:bg-sp-accent-press transition-transform duration-[120ms]"
            )}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
