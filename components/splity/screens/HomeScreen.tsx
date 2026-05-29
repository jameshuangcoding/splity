"use client";

import { useBillStore } from "@/stores/bill-store";
import { Icon } from "@/components/splity/Icon";
import { Dock } from "@/components/splity/Dock";
import { Money } from "@/components/splity/Money";
import { Stat } from "@/components/splity/Stat";

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="var(--sp-accent)"
        strokeWidth="2.4"
      />
      <path
        d="M16 2.5 A13.5 13.5 0 0 1 16 29.5 Z"
        fill="var(--sp-accent)"
        opacity="0.9"
      />
      <circle cx="10" cy="16" r="2.1" fill="var(--sp-accent)" />
      <circle cx="22" cy="16" r="2.1" fill="var(--sp-bg)" />
    </svg>
  );
}

export function HomeScreen() {
  const name = useBillStore((s) => s.name);
  const setName = useBillStore((s) => s.setName);
  const setInputMode = useBillStore((s) => s.setInputMode);
  const nextStep = useBillStore((s) => s.nextStep);
  const itemsCount = useBillStore((s) => s.receipt.items.length);
  const peopleCount = useBillStore((s) => s.people.length);
  const total = useBillStore((s) => s.receipt.total);

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          {/* Brand row */}
          <div className="flex items-center gap-[9px] pt-[10px]">
            <Mark size={26} />
            <span className="text-[19px] font-extrabold tracking-[-0.02em] text-sp-text">
              Splity
            </span>
            <span className="ml-auto text-[11.5px] font-semibold tracking-[0.03em] text-sp-text-faint bg-sp-surface-2 border border-sp-hairline rounded-full px-[10px] py-[5px]">
              no account needed
            </span>
          </div>

          {/* Hero */}
          <div className="pt-10">
            <h1 className="text-[38px] font-extrabold tracking-[-0.025em] leading-[1.05] text-sp-text">
              Split a bill,
              <br />
              down to the cent.
            </h1>
            <p className="text-[15px] text-sp-text-dim leading-[1.4] mt-3">
              Scan the receipt and Splity allocates the real tax, tip and
              discounts — never assumed percentages.
            </p>
          </div>

          {/* "This bill" card */}
          <div className="mt-6 bg-sp-surface border border-sp-hairline rounded-sp-lg px-[18px] pt-[18px] pb-[16px] shadow-sp-card-sm">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-sp-text-faint mb-[10px]">
              This bill
            </div>
            <input
              className="w-full bg-sp-surface-2 border border-sp-hairline-2 rounded-sp-sm px-[14px] py-[12px] text-[19px] font-bold tracking-[-0.01em] text-sp-text placeholder:text-sp-text-faint focus:outline-none focus:ring-2 focus:ring-sp-accent/40 focus:border-sp-accent"
              placeholder="Expense name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Expense name"
            />
            <div className="flex gap-[9px] mt-3">
              <Stat label="Items">{itemsCount}</Stat>
              <Stat label="People">{peopleCount}</Stat>
              <Stat label="Total">
                <Money value={total} />
              </Stat>
            </div>
          </div>

          {/* Info hint */}
          <div className="flex items-center gap-2 mt-5 text-sp-text-faint">
            <Icon name="info" size={15} />
            <span className="text-[12.5px]">
              Under 2 minutes from scan to settled.
            </span>
          </div>
        </div>
      </div>

      <Dock
        primary={{
          label: (
            <>
              <Icon name="camera" size={20} />
              Scan a receipt
            </>
          ),
          onClick: () => {
            setInputMode("scan");
            nextStep();
          },
        }}
        ghost={{
          label: (
            <>
              <Icon name="edit" size={18} />
              Enter manually
            </>
          ),
          onClick: () => {
            setInputMode("manual");
            nextStep();
          },
        }}
      />
    </>
  );
}
