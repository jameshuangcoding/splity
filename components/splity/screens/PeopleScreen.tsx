"use client";

import { useState } from "react";
import { useBillStore } from "@/stores/bill-store";
import { Ava } from "@/components/splity/Ava";
import { Dock } from "@/components/splity/Dock";
import { ScreenHead } from "@/components/splity/ScreenHead";
import { Icon } from "@/components/splity/Icon";
import { cn } from "@/lib/utils";
import type { StorePerson } from "@/types";

const PALETTE = ["#ff7a4d", "#3ddc97", "#5b8cff", "#c084fc"];
const RECENT_NAMES = ["Diego", "Sam", "Aisha", "Theo"];

export function PeopleScreen() {
  const people = useBillStore((s) => s.people);
  const setPeople = useBillStore((s) => s.setPeople);
  const nextStep = useBillStore((s) => s.nextStep);

  const [draft, setDraft] = useState("");

  function addPerson(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newPerson: StorePerson = {
      id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      initial: trimmed[0].toUpperCase(),
      color: PALETTE[people.length % PALETTE.length],
      payer: false,
    };
    setPeople([...people, newPerson]);
    setDraft("");
  }

  function removePerson(id: string) {
    setPeople(people.filter((p) => p.id !== id));
  }

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          <ScreenHead eyebrow="Step 2 of 5" title="Who's splitting?" />

          {/* Add-name row */}
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-sp-surface-2 border border-sp-hairline-2 rounded-sp-sm px-[14px] py-[12px] text-[16px] font-semibold text-sp-text placeholder:text-sp-text-faint focus:outline-none focus:ring-2 focus:ring-sp-accent/40 focus:border-sp-accent"
              placeholder="Add a name…"
              value={draft}
              aria-label="Add a name"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson(draft)}
            />
            <button
              aria-label="Add person"
              onClick={() => addPerson(draft)}
              className={cn(
                "flex-none w-[50px] h-[50px] rounded-sp-sm",
                "bg-sp-accent text-white text-[24px] font-bold",
                "flex items-center justify-center",
                "active:scale-[0.95] transition-transform duration-[120ms]"
              )}
            >
              <Icon name="plus" size={22} sw={2.4} />
            </button>
          </div>

          {/* People list */}
          <div className="bg-sp-surface border border-sp-hairline rounded-sp-lg overflow-hidden shadow-sp-card-sm">
            {people.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-[13px]",
                  i < people.length - 1 && "border-b border-sp-hairline"
                )}
              >
                <Ava person={p} />
                <span className="flex-1 text-[16px] font-bold text-sp-text leading-none">
                  {p.name}
                </span>
                {p.payer ? (
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-sp-accent bg-sp-accent-tint rounded-full px-[10px] py-[5px]">
                    payer
                  </span>
                ) : (
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => removePerson(p.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sp-text-faint hover:text-sp-text hover:bg-sp-surface-2 transition-colors"
                  >
                    <Icon name="x" size={16} sw={2} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Recent section */}
          <div className="mt-5">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-sp-text-faint mb-[10px]">
              Recent
            </div>
            <div className="flex flex-wrap gap-2">
              {RECENT_NAMES.map((name) => (
                <button
                  key={name}
                  aria-label={name}
                  onClick={() => addPerson(name)}
                  className={cn(
                    "text-[14px] font-semibold text-sp-text",
                    "bg-sp-surface border border-sp-hairline-2 rounded-full px-[14px] py-[8px]",
                    "active:scale-[0.96] transition-transform duration-[100ms]",
                    "shadow-sp-card-sm"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dock
        primary={{
          label: <>Next · assign items →</>,
          onClick: nextStep,
        }}
      />
    </>
  );
}
