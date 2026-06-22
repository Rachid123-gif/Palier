import { cn } from "@/lib/cn";

/** Monogramme Palier — un "P" en escalier (palier) stylisé. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect width="48" height="48" rx="13" fill="url(#pg)" />
      <path
        d="M16 35V14a1 1 0 0 1 1-1h9.5a7.5 7.5 0 0 1 0 15H21"
        stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="21" cy="35" r="2" fill="#8a9a4e" />
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e5b50" />
          <stop offset="1" stopColor="#11302b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("text-xl font-bold tracking-tight", light ? "text-white" : "text-ink", className)}>
      Palier
    </span>
  );
}
