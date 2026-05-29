interface ScreenHeadProps {
  eyebrow?: string;
  title: string;
  sub?: string;
}

export function ScreenHead({ eyebrow, title, sub }: ScreenHeadProps) {
  return (
    <div className="pt-1.5 pb-[18px]">
      {eyebrow && (
        <div
          className="text-[12px] font-bold tracking-[0.14em] uppercase text-sp-text-faint mb-[9px]"
          data-testid="eyebrow"
        >
          {eyebrow}
        </div>
      )}
      <div className="text-[30px] font-extrabold tracking-[-0.02em] leading-[1.05] text-sp-text">
        {title}
      </div>
      {sub && (
        <div
          className="text-[15px] text-sp-text-dim leading-[1.4] mt-[7px]"
          data-testid="sub"
        >
          {sub}
        </div>
      )}
    </div>
  );
}
