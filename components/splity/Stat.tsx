interface StatProps {
  label: string;
  children: React.ReactNode;
}

export function Stat({ label, children }: StatProps) {
  return (
    <div className="flex-1 flex flex-col items-center bg-sp-surface-2 rounded-sp-sm py-[10px] px-2 gap-[3px]">
      <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-sp-text-faint">
        {label}
      </span>
      <span className="text-[15px] font-bold text-sp-text">{children}</span>
    </div>
  );
}
