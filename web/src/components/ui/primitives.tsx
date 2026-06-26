import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/* ---------------- Card ---------------- */
export function Card({
  className, children, ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-4", className)} {...props}>
      {children}
    </div>
  );
}

/* ---------------- Badge ---------------- */
const badgeTones: Record<string, string> = {
  neutral: "bg-sand text-ink-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  brand: "bg-palier-100 text-palier-700",
  gold: "bg-[#fbf0d8] text-[#a87d12]",
};

export function Badge({
  tone = "neutral", icon, children, className,
}: {
  tone?: keyof typeof badgeTones;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        badgeTones[tone], className,
      )}
    >
      {icon && <Icon name={icon} className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </span>
  );
}

/* ---------------- Button ---------------- */
const btnVariants: Record<string, string> = {
  primary: "bg-palier-600 text-white shadow-[0_8px_20px_-10px_rgba(30,91,80,0.9)] active:bg-palier-700",
  light: "bg-white text-palier-700 border border-palier-100",
  ghost: "bg-sand text-ink",
  danger: "bg-danger text-white",
  whatsapp: "bg-[#25D366] text-white",
};

export function Button({
  variant = "primary", icon, iconRight, full, className, children, ...props
}: {
  variant?: keyof typeof btnVariants;
  icon?: string;
  iconRight?: string;
  full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "press inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
        full && "w-full",
        btnVariants[variant], className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} className="h-4 w-4" strokeWidth={2.5} />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4" strokeWidth={2.5} />}
    </button>
  );
}

/* ---------------- Section header ---------------- */
export function SectionTitle({
  children, action, onAction, count,
}: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
        {children}
        {count !== undefined && (
          <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-ink-soft">
            {count}
          </span>
        )}
      </h2>
      {action && (
        <button onClick={onAction} className="text-sm font-semibold text-palier-600">
          {action}
        </button>
      )}
    </div>
  );
}

/* ---------------- Rating ---------------- */
export function Rating({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
      <Icon name="Star" className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
      {value.toFixed(1)}
      {reviews !== undefined && (
        <span className="font-normal text-ink-faint">({reviews} avis)</span>
      )}
    </span>
  );
}
