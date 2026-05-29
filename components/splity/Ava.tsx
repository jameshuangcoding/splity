"use client";

import { cn } from "@/lib/utils";
import type { StorePerson } from "@/types";

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 255) + amt;
  let b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

type AvaSize = "sm" | "lg" | "";

const sizeClasses: Record<string, string> = {
  sm: "w-7 h-7 text-[11px]",
  lg: "w-[46px] h-[46px] text-[17px]",
  "": "w-[38px] h-[38px] text-[14px]",
};

interface AvaProps {
  person: Pick<StorePerson, "initial" | "color">;
  size?: AvaSize;
  off?: boolean;
  ghost?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Ava({
  person,
  size = "",
  off,
  ghost,
  className,
  style,
}: AvaProps) {
  const base = cn(
    "flex-none rounded-full flex items-center justify-center font-bold text-white select-none",
    sizeClasses[size],
    off && "grayscale-[0.6] brightness-90 opacity-[0.42]",
    className
  );

  if (ghost) {
    return (
      <div
        className={cn(
          base,
          "bg-sp-surface-2 text-sp-text-faint border-[1.5px] border-dashed border-sp-hairline-2"
        )}
        style={style}
      >
        {person.initial}
      </div>
    );
  }

  return (
    <div
      className={base}
      style={{
        background: `linear-gradient(155deg, ${person.color}, ${shade(person.color, -18)})`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        ...style,
      }}
    >
      {person.initial}
    </div>
  );
}

interface AvaStackProps {
  people: Pick<StorePerson, "id" | "initial" | "color">[];
  size?: AvaSize;
}

export function AvaStack({ people, size }: AvaStackProps) {
  return (
    <div className="flex">
      {people.map((p, i) => (
        <Ava
          key={p.id}
          person={p}
          size={size}
          className={i > 0 ? "-ml-[9px]" : undefined}
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.18), 0 0 0 2px var(--sp-surface)",
          }}
        />
      ))}
    </div>
  );
}
