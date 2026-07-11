import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-6 md:gap-4">
      <div>
        <h1 className="text-[18px] font-bold tracking-tight text-ink md:text-[22px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label, value, unit, hint, trend,
}: {
  icon?: string; label: string; value: string; unit?: string; tint?: string; color?: string; hint?: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-cream-card p-4 shadow-card">
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="mt-1 text-[22px] font-bold leading-none text-ink">
        {value}{unit && <span className="ml-1 text-[12px] font-medium text-ink-soft">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
      {trend && <p className="mt-1 text-[11px] font-semibold text-success">{trend}</p>}
    </div>
  );
}

const pills: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-success-soft text-success" },
  partial: { label: "Partiel", cls: "bg-info-soft text-info" },
  due: { label: "À payer", cls: "bg-warning-soft text-warning" },
  late: { label: "En retard", cls: "bg-danger-soft text-danger" },
  open: { label: "Ouvert", cls: "bg-warning-soft text-warning" },
  resolved: { label: "Résolu", cls: "bg-success-soft text-success" },
};

export function StatusPill({ status }: { status: string }) {
  const p = pills[status] ?? { label: status, cls: "bg-sand text-ink-soft" };
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", p.cls)}>{p.label}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card", className)}>{children}</div>;
}
