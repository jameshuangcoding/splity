"use client";

import { useMemo, useState } from "react";
import { useBillStore } from "@/stores/bill-store";
import { Ava } from "@/components/splity/Ava";
import { Dock } from "@/components/splity/Dock";
import { Money } from "@/components/splity/Money";
import { Icon } from "@/components/splity/Icon";
import { compute } from "@/lib/calculation/engine";
import { cn } from "@/lib/utils";

export function SummaryScreen() {
  const name = useBillStore((s) => s.name);
  const receipt = useBillStore((s) => s.receipt);
  const people = useBillStore((s) => s.people);
  const assignments = useBillStore((s) => s.assignments);
  const nextStep = useBillStore((s) => s.nextStep);

  const [expandedId, setExpandedId] = useState<string | null>(
    people[0]?.id ?? null
  );

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

  const regularItems = receipt.items.filter((it) => !it.isDiscount);

  function toggleCard(personId: string) {
    setExpandedId((prev) => (prev === personId ? null : personId));
  }

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          {/* Hero card */}
          <div
            className={cn(
              "mt-2 mb-5 rounded-sp-lg px-5 py-5",
              "bg-sp-surface border border-sp-hairline shadow-sp-card-sm",
              "relative overflow-hidden"
            )}
            style={{
              background:
                "linear-gradient(135deg, var(--sp-accent-tint) 0%, var(--sp-surface) 55%)",
            }}
          >
            <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-sp-accent mb-[6px]">
              {name || "Bill"}
            </p>
            <div
              data-testid="summary-grand-total"
              className="mb-[10px]"
            >
              <Money
                value={receipt.total}
                className="text-[40px] font-extrabold font-num tracking-[-0.03em] text-sp-text leading-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-[5px]",
                  "text-[12px] font-semibold text-sp-pos",
                  "bg-sp-pos-tint rounded-full px-[10px] py-[4px]"
                )}
              >
                <Icon name="check" size={11} sw={2.5} />
                matches receipt
              </span>
              {receipt.place && (
                <span className="text-[12px] text-sp-text-dim font-medium">
                  {receipt.place}
                </span>
              )}
              <span className="text-[12px] text-sp-text-faint">
                · split {people.length} ways
              </span>
            </div>
          </div>

          {/* Per-person cards */}
          <div className="flex flex-col gap-[10px]">
            {people.map((person) => {
              const b = calc.breakdown[person.id];
              const isExpanded = expandedId === person.id;
              const personItems = regularItems.filter((it) =>
                (assignments[it.id] || []).includes(person.id)
              );
              const itemCount = personItems.length;
              const hasTax = receipt.tax > 0;
              const hasTip = receipt.tip > 0;
              const hasDiscount = receipt.discount > 0;
              const taxPct = (calc.taxRate * 100).toFixed(1);
              const tipPct = (calc.tipRate * 100).toFixed(1);

              return (
                <div
                  key={person.id}
                  data-testid={`person-card-${person.id}`}
                  className={cn(
                    "bg-sp-surface border border-sp-hairline rounded-sp-lg overflow-hidden shadow-sp-card-sm",
                    "cursor-pointer active:bg-sp-surface-2"
                  )}
                  onClick={() => toggleCard(person.id)}
                >
                  {/* Card header row */}
                  <div className="flex items-center gap-3 px-4 py-[14px]">
                    <Ava person={person} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[7px] flex-wrap">
                        <span className="text-[16px] font-bold text-sp-text leading-snug">
                          {person.name}
                        </span>
                        {person.payer && (
                          <span
                            className={cn(
                              "text-[11px] font-bold tracking-[0.08em] uppercase",
                              "bg-sp-accent-tint text-sp-accent rounded-full px-[8px] py-[3px]"
                            )}
                          >
                            payer
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-sp-text-faint">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="flex items-center gap-[8px] flex-none">
                      <Money
                        value={b?.total ?? 0}
                        className="text-[22px] font-bold font-num tracking-[-0.02em] text-sp-text"
                      />
                      <span
                        className={cn(
                          "transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      >
                        <Icon
                          name="chevdown"
                          size={18}
                          sw={2}
                          className="text-sp-text-faint"
                        />
                      </span>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      data-testid={`person-expanded-${person.id}`}
                      className="border-t border-sp-hairline px-4 pb-4 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Item rows */}
                      {personItems.length === 0 ? (
                        <p className="text-[13px] text-sp-text-faint italic">
                          No items assigned
                        </p>
                      ) : (
                        <div className="flex flex-col gap-[6px] mb-3">
                          {personItems.map((item) => {
                            const assignees = assignments[item.id] || [];
                            const share = item.price / assignees.length;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-[6px] min-w-0">
                                  <span className="text-[14px] text-sp-text font-medium truncate">
                                    {item.name}
                                  </span>
                                  {assignees.length > 1 && (
                                    <span className="text-[11px] text-sp-text-faint flex-none">
                                      ÷{assignees.length}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[14px] font-semibold font-num text-sp-text-dim flex-none">
                                  ${share.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Dashed divider */}
                      <div className="border-t border-dashed border-sp-hairline-2 mb-3" />

                      {/* Breakdown lines */}
                      <div className="flex flex-col gap-[5px]">
                        <BreakdownLine
                          label="Subtotal"
                          value={b?.sub ?? 0}
                        />
                        {hasTax && (
                          <BreakdownLine
                            label={`+tax ${taxPct}%`}
                            value={b?.tax ?? 0}
                          />
                        )}
                        {hasTip && (
                          <BreakdownLine
                            label={`+tip ${tipPct}%`}
                            value={b?.tip ?? 0}
                          />
                        )}
                        {hasDiscount && (
                          <BreakdownLine
                            label="−discount"
                            value={-(b?.disc ?? 0)}
                            accent
                          />
                        )}
                      </div>

                      {/* Payer rounding note */}
                      {person.payer && b?.remainder && (
                        <p
                          data-testid="payer-rounding-note"
                          className="mt-3 text-[11px] text-sp-text-faint italic leading-snug"
                        >
                          Absorbs rounding remainder so the split sums exactly.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dock
        primary={{
          label: (
            <>
              <Icon name="send" size={18} sw={2} className="text-white" />
              Send payment requests
            </>
          ),
          onClick: nextStep,
        }}
      />
    </>
  );
}

function BreakdownLine({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-[13px]",
          accent ? "text-sp-pos font-medium" : "text-sp-text-dim"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[13px] font-semibold font-num",
          accent ? "text-sp-pos" : "text-sp-text-dim"
        )}
      >
        {value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}
