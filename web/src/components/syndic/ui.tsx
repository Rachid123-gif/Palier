import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[14px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  icon, label, value, unit, tint, color, hint, trend,
}: {
  icon: string; label: string; value: string; unit?: string; tint: string; color: string; hint?: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(20,32,29,0.04)]">
      <div className="flex items-center justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tint)}>
          <Icon name={icon} className={cn("h-5 w-5", color)} strokeWidth={2.2} />
        </span>
        {trend && <span className="text-[11px] font-semibold text-success">{trend}</span>}
      </div>
      <p className="mt-3 text-[24px] font-bold leading-none text-ink">
        {value}{unit && <span className="ml-1 text-[12px] font-semibold text-ink-faint">{unit}</span>}
      </p>
      <p className="mt-1 text-[12.5px] text-ink-soft">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

const pills: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-success-soft text-success" },
  partial: { label: "Partiel", cls: "bg-info-soft text-info" },
  due: { label: "À payer", cls: "bg-warning-soft text-warning" },
  late: { label: "En retard", cls: "bg-danger-soft text-danger" },
  open: { label: "Ouvert", cls: "bg-warning-soft text-warning" },
  in_progress: { label: "En cours", cls: "bg-info-soft text-info" },
  resolved: { label: "Résolu", cls: "bg-success-soft text-success" },
};

export function StatusPill({ status }: { status: string }) {
  const p = pills[status] ?? { label: status, cls: "bg-sand text-ink-soft" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", p.cls)}>{p.label}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(20,32,29,0.04)]", className)}>{children}</div>;
}
