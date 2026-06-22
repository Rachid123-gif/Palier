"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { LetterAvatar } from "@/components/ui/Avatar";
import { mad, num, shortDate, longDate } from "@/lib/format";
import { useData } from "@/lib/DataProvider";

const actions = [
  { href: "/charges", icon: "CreditCard", label: "Payer mes charges", sub: "Virement instantané", tint: "bg-info-soft", color: "text-info" },
  { href: "/immeuble/signaler", icon: "Wrench", label: "Signaler un problème", sub: "Ascenseur, fuite…", tint: "bg-danger-soft", color: "text-danger", badgeKey: "incidents" },
  { href: "/immeuble/documents", icon: "FolderOpen", label: "Voir documents", sub: "PV, contrats…", tint: "bg-warning-soft", color: "text-warning" },
  { href: "/immeuble/ag", icon: "Vote", label: "Voter à l'AG", sub: "AG le 12 mai", tint: "bg-[#f0e4fb]", color: "text-[#7a4ea8]" },
];

export default function ImmeubleScreen() {
  const { building, buildingKpis, ledger, incidents } = useData();
  const [showLedger, setShowLedger] = useState(false);
  const lastOut = ledger.find((l) => l.type === "out");
  const lastIn = ledger.find((l) => l.type === "in");

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header immeuble */}
      <header className="flex items-start justify-between px-5 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Building2" className="h-6 w-6 text-palier-600" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink">{building.name}</h1>
            <p className="text-[13px] text-ink-soft">{building.address} · {building.city}</p>
          </div>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-5 px-4 pt-1">
        {/* Alerte */}
        <Link href="/immeuble/signaler" className="tap flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-3.5">
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-warning" />
          <p className="flex-1 text-[13px] font-semibold text-[#8a6a12]">Attention · {buildingKpis.openIncidents} incidents en cours</p>
          <Icon name="ChevronRight" className="h-4 w-4 text-[#8a6a12]" />
        </Link>

        {/* KPI santé immeuble */}
        <div className="grid grid-cols-3 gap-3">
          <Kpi icon="Wallet" tint="bg-coral-400/15" color="text-coral-600" value={`${num(buildingKpis.balance, false)}`} unit="MAD" label="Solde caisse" />
          <Kpi icon="CircleCheck" tint="bg-success-soft" color="text-success" value={`${buildingKpis.paymentRate}%`} label="Recouvrement" progress={buildingKpis.paymentRate} />
          <Kpi icon="TriangleAlert" tint="bg-danger-soft" color="text-danger" value={`${buildingKpis.openIncidents}`} label="Incidents" />
        </div>

        {/* Actions */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="tap card relative flex flex-col gap-2 p-3.5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${a.tint}`}>
                  <Icon name={a.icon} className={`h-5 w-5 ${a.color}`} strokeWidth={2.2} />
                </span>
                {a.badgeKey === "incidents" && buildingKpis.openIncidents > 0 ? (
                  <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{buildingKpis.openIncidents}</span>
                ) : null}
                <div>
                  <p className="text-[14px] font-bold leading-tight text-ink">{a.label}</p>
                  <p className="text-[11.5px] text-ink-faint">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Transparence financière */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
              <Icon name="ShieldCheck" className="h-5 w-5 text-palier-600" /> Transparence financière
            </h2>
          </div>
          <div className="card space-y-3 p-4">
            <p className="text-[13px] text-ink-soft">Suivez en temps réel où va l'argent de l'immeuble : qui a payé, quelles dépenses ont été faites.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sand p-3">
                <p className="text-[11px] font-semibold uppercase text-ink-faint">Dernière dépense</p>
                <p className="mt-1 text-[15px] font-bold text-ink">{lastOut ? mad(lastOut.amount, { decimals: false }) : "—"}</p>
                <p className="truncate text-[11px] text-ink-soft">{lastOut?.label ?? "Aucune"}</p>
              </div>
              <div className="rounded-2xl bg-sand p-3">
                <p className="text-[11px] font-semibold uppercase text-ink-faint">Dernier encaissement</p>
                <p className="mt-1 text-[15px] font-bold text-success">{lastIn ? mad(lastIn.amount, { decimals: false }) : "—"}</p>
                <p className="truncate text-[11px] text-ink-soft">{lastIn?.label ?? "Aucun"}</p>
              </div>
            </div>

            <button onClick={() => setShowLedger((v) => !v)} className="tap flex w-full items-center justify-center gap-1.5 rounded-full bg-palier-50 py-2.5 text-[13px] font-semibold text-palier-700">
              <Icon name="ListChecks" className="h-4 w-4" />
              {showLedger ? "Masquer le détail" : "Vérifier la cohérence des comptes"}
              <Icon name={showLedger ? "ChevronUp" : "ChevronDown"} className="h-4 w-4" />
            </button>

            {showLedger && (
              <div className="animate-[rise_0.3s_ease] space-y-1.5 pt-1">
                {ledger.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl bg-white p-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${l.type === "in" ? "bg-success-soft" : "bg-coral-400/15"}`}>
                      <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-4 w-4 ${l.type === "in" ? "text-success" : "text-coral-600"}`} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{l.label}</p>
                      <p className="text-[11px] text-ink-faint">{shortDate(l.date)} · {l.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-bold ${l.type === "in" ? "text-success" : "text-ink"}`}>
                        {l.type === "in" ? "+" : "−"}{num(l.amount, false)}
                      </p>
                      {l.signed && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-palier-600">
                          <Icon name="ShieldCheck" className="h-3 w-3" /> signé
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="px-1 pt-1 text-center text-[11px] text-ink-faint">Journal infalsifiable · chaque opération est signée et horodatée.</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochaine AG */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Prochaine assemblée</h2>
          <Link href="/immeuble/ag" className="tap card block p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-palier-600 text-white">
                <span className="text-[10px] font-semibold uppercase">Mai</span>
                <span className="text-xl font-bold leading-none">12</span>
              </div>
              <div className="flex-1">
                <Badge tone="brand">Dans 13 jours</Badge>
                <p className="mt-1 text-[15px] font-bold text-ink">AG ordinaire 2026</p>
                <p className="text-[12px] text-ink-soft">Approbation comptes 2025 · budget travaux</p>
              </div>
              <Icon name="ChevronRight" className="h-5 w-5 text-ink-faint" />
            </div>
          </Link>
        </div>

        {/* Activité */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Activité de l'immeuble</h2>
          <div className="card divide-y divide-black/5 p-0">
            <div className="flex items-start gap-3 p-3.5">
              <LetterAvatar letter="K" color="#1e5b50" size={36} />
              <div className="flex-1">
                <p className="text-[13px]"><b className="text-ink">Karim — Syndic</b> <span className="text-ink-faint">· dans 13 j</span></p>
                <p className="text-[13px] text-ink-soft">AG ordinaire — {longDate("2026-05-12")}</p>
              </div>
            </div>
            {incidents.slice(0, 2).map((i) => (
              <Link key={i.id} href="/immeuble/signaler" className="tap flex items-start gap-3 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft">
                  <Icon name="Wrench" className="h-4 w-4 text-danger" />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink">{i.title}</p>
                  <p className="text-[12px] text-ink-soft">Signalé par {i.reporter} · {shortDate(i.createdAt)}</p>
                </div>
                <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, tint, color, value, unit, label, progress }: {
  icon: string; tint: string; color: string; value: string; unit?: string; label: string; progress?: number;
}) {
  return (
    <div className="card p-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tint}`}>
        <Icon name={icon} className={`h-4 w-4 ${color}`} strokeWidth={2.3} />
      </span>
      <p className="mt-2 text-[16px] font-bold leading-none text-ink">{value}{unit && <span className="text-[10px] font-semibold text-ink-faint"> {unit}</span>}</p>
      <p className="mt-1 text-[11px] text-ink-soft">{label}</p>
      {progress !== undefined && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
