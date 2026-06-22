import { cn } from "@/lib/cn";

/** Avatar à dégradé déterministe & unique (jamais dupliqué entre prestataires). */
export function Avatar({
  initials, from, to, size = 48, className, ring,
}: {
  initials: string;
  from: string;
  to: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl font-semibold text-white shrink-0",
        ring && "ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.4)]",
        className,
      )}
      style={{
        width: size, height: size,
        fontSize: size * 0.34,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  );
}

/** Avatar circulaire à lettre (résidents, syndic) */
export function LetterAvatar({
  letter, color, size = 40, className,
}: { letter: string; color: string; size?: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-semibold text-white shrink-0", className)}
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: color }}
    >
      {letter}
    </div>
  );
}
