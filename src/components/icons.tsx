type IconProps = {
  className?: string;
};

const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function PlayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function AgeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 21h16" />
      <path d="M6 21v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
      <path d="M6 16.4c1.3.9 2.7.9 4 0s2.7-.9 4 0 2.7.9 4 0" />
      <path d="M12 11.5V8.7" />
      <path
        d="M12 5.6c.9.8.9 1.9 0 2.5-.9-.6-.9-1.7 0-2.5z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.6 9.8l6.5-.9L12 2.5z" />
    </svg>
  );
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

export function Logo({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="22.5"
        height="22.5"
        rx="5.5"
        fill="var(--color-accent)"
      />
      <g fill="var(--color-on-accent)">
        <circle cx="5.2" cy="5.2" r="1.05" opacity="0.4" />
        <circle cx="18.8" cy="5.2" r="1.05" opacity="0.4" />
        <circle cx="5.2" cy="18.8" r="1.05" opacity="0.4" />
        <circle cx="18.8" cy="18.8" r="1.05" opacity="0.4" />
        <circle cx="12" cy="7" r="2.4" />
        <path d="M12 9.6C10.4 9.6 9.7 10.7 9.7 11.7L6.9 12.9C6.1 13.2 6.1 14.3 6.9 14.6L9.6 15.6C9.1 16.6 8.2 17.7 7.8 18.9C7.5 19.7 8.1 20.5 9 20.5L10.2 20.5C10.8 20.5 11.3 20.1 11.4 19.5L12 17.9L12.6 19.5C12.7 20.1 13.2 20.5 13.8 20.5L15 20.5C15.9 20.5 16.5 19.7 16.2 18.9C15.8 17.7 14.9 16.6 14.4 15.6L17.1 14.6C17.9 14.3 17.9 13.2 17.1 12.9L14.3 11.7C14.3 10.7 13.6 9.6 12 9.6Z" />
      </g>
    </svg>
  );
}
