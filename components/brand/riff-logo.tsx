import type { SVGProps } from 'react';

export function RiffMark({
  className = '',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M8 34V6h12.2C27.7 6 32 9.8 32 15.8S27.7 25 20.2 25H8"
        stroke="currentColor"
        strokeWidth="4.25"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="m21 25 11 9"
        stroke="currentColor"
        strokeWidth="4.25"
        strokeLinecap="square"
      />
      <path d="M8 15.5h24" stroke="#1747D1" strokeWidth="4.25" />
      <circle cx="32" cy="15.5" r="2.8" fill="#1747D1" />
    </svg>
  );
}

export function RiffLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Riff home">
      <RiffMark className="size-8 text-foreground" />
      {!compact && (
        <span className="text-[15px] font-bold tracking-[-.055em]">RIFF</span>
      )}
    </span>
  );
}
