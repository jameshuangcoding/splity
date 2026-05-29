"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MoneyProps {
  value: number;
  prefix?: string;
  className?: string;
  dur?: number;
}

export function Money({ value, prefix = "$", className, dur = 520 }: MoneyProps) {
  const [disp, setDisp] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setDisp(value);
      fromRef.current = value;
      return;
    }

    const start = performance.now();
    const a = fromRef.current;
    const b = value;
    cancelAnimationFrame(rafRef.current);

    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3); // cubic ease-out
      setDisp(a + (b - a) * e);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = b;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value, dur]);

  const neg = disp < -0.005;

  return (
    <span className={cn("font-num", className)}>
      {neg ? "-" : ""}
      {prefix}
      {Math.abs(disp).toFixed(2)}
    </span>
  );
}
