import { cn } from "@/lib/cn";

/**
 * 8. Hero card entrance — fade + montée douce (CSS, GPU, fiable même onglet masqué).
 * `both` garantit l'état final visible une fois l'animation terminée.
 */
export function Reveal({
  children, delay = 0, className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("hero-in", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
