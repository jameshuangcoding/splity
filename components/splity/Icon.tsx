"use client";

export type IconName =
  | "back"
  | "fwd"
  | "arrow"
  | "camera"
  | "edit"
  | "plus"
  | "check"
  | "x"
  | "scan"
  | "download"
  | "copy"
  | "sun"
  | "moon"
  | "info"
  | "users"
  | "receipt"
  | "split"
  | "dollar"
  | "chevdown"
  | "spark"
  | "send";

interface IconProps {
  name: IconName;
  size?: number;
  sw?: number;
  className?: string;
}

export function Icon({ name, size = 22, sw = 1.9, className }: IconProps) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    back: <path d="M14 5l-7 7 7 7" {...p} />,
    fwd: <path d="M9 5l7 7-7 7" {...p} />,
    arrow: (
      <g {...p}>
        <path d="M4 12h15" />
        <path d="M13 6l6 6-6 6" />
      </g>
    ),
    camera: (
      <g {...p}>
        <path d="M3 8.5A1.5 1.5 0 014.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0121 8.5v9A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-9z" />
        <circle cx="12" cy="13" r="3.4" />
      </g>
    ),
    edit: (
      <g {...p}>
        <path d="M4 20h4L19 9l-4-4L4 16v4z" />
        <path d="M13.5 6.5l4 4" />
      </g>
    ),
    plus: (
      <g {...p}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </g>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p} />,
    x: (
      <g {...p}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </g>
    ),
    scan: (
      <g {...p}>
        <path d="M4 8V6a2 2 0 012-2h2" />
        <path d="M20 8V6a2 2 0 00-2-2h-2" />
        <path d="M4 16v2a2 2 0 002 2h2" />
        <path d="M20 16v2a2 2 0 01-2 2h-2" />
        <path d="M7 12h10" />
      </g>
    ),
    download: (
      <g {...p}>
        <path d="M12 4v11" />
        <path d="M7.5 10.5L12 15l4.5-4.5" />
        <path d="M5 19h14" />
      </g>
    ),
    copy: (
      <g {...p}>
        <rect x="8" y="8" width="12" height="12" rx="2.4" />
        <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
      </g>
    ),
    sun: (
      <g {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
      </g>
    ),
    moon: <path d="M20 13.5A8 8 0 1110.5 4a6.4 6.4 0 009.5 9.5z" {...p} />,
    info: (
      <g {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.6v.2" />
      </g>
    ),
    users: (
      <g {...p}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19a5.5 5.5 0 0111 0" />
        <path d="M16 5.2a3.2 3.2 0 010 5.8" />
        <path d="M17 14.2a5.5 5.5 0 013.5 4.8" />
      </g>
    ),
    receipt: (
      <g {...p}>
        <path d="M6 3h12v18l-2.2-1.4L13.6 21l-2.2-1.4L9.2 21 7 19.6 6 21V3z" />
        <path d="M9 8h6M9 12h6" />
      </g>
    ),
    split: (
      <g {...p}>
        <path d="M6 3v4a4 4 0 004 4h4a4 4 0 014 4v6" />
        <path d="M3 7l3-4 3 4" />
        <path d="M18 17l-3 4-3-4" transform="translate(3 0)" />
      </g>
    ),
    dollar: (
      <g {...p}>
        <path d="M12 3v18" />
        <path d="M16.5 7.5C16.5 5.6 14.5 4.5 12 4.5S7.5 5.8 7.5 7.8s2 2.7 4.5 3.2 4.5 1.2 4.5 3.2-2 3.3-4.5 3.3-4.5-1.1-4.5-3" />
      </g>
    ),
    chevdown: <path d="M6 9.5l6 6 6-6" {...p} />,
    spark: (
      <g {...p}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      </g>
    ),
    send: (
      <g {...p}>
        <path d="M5 12l15-7-7 15-2.2-5.8L5 12z" />
      </g>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? null}
    </svg>
  );
}
