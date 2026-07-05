import Link from "next/link";
import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, KpiCard, Card, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { num, mad, timeAgo, currentPeriod, shortDate } from "@/lib/format";

export default async function SyndicDashboard() {
  const d = await fetchSyndicData();
  const k = d.kpis;

  /* ── Recouvrement segments ── */
  const counts = {
    paid: d.recouvrement.filter((r) => r.status === "paid").length,
    partial: d.recouvrement.filter((r) => r.status === "partial").length,
    due: d.recouvrement.filter((r) => r.status === "due").length,
    late: d.recouvrement.filter((r) => r.status === "late").length,
  };
  const seg = [
    { key: "paid", label: "Payé", n: counts.paid, color: "#059669" },
    { key: "partial", label: "Partiel", n: counts.partial, color: "#2563eb" },
    { key: "due", label: "À payer", n: counts.due, color: "#d97706" },
    { key: "late", label: "En retard", n: counts.late, color: "#dc2626" },
  ];
  const total = d.recouvrement.length || 1;

  /* ── Incidents ── */
  const openIncidents = d.incidents.filter((i: any) => i.status !== "resolved");

  /* ── Prochaine AG ── */
  const today = new Date().toISOString().slice(0, 10);
  const nextAssembly = d.assemblies
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  /* ── Dernières dépenses ── */
  const recentExpenses = d.ledger
    .filter((e: any) => e.type === "expense")
    .slice(0, 4);

  /* ── Derniers documents ── */
  const recentDocs = d.documents.slice(0, 3);

  /* ── Résidents en retard (top 5) ── */
  const lateResidents = d.recouvrement
    .filter((r) => r.status === "late")
    .sort((a, b) => (b.amount - b.paid) - (a.amount - a.paid))
    .slice(0, 5);

  const iconBox = "flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]";
  const iconCls = "h-4 w-4 text-ink-soft";
  const smallIconBox = "flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04]";
  const smallIconCls = "h-3.5 w-3.5 text-ink-soft";

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${d.building.name} · ${currentPeriod()}`}
        action={
          <Link href="/syndic/recouvrement" className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-palier-700">
            <Icon name="Banknote" className="h-3.5 w-3.5" /> Recouvrement
          </Link>
        }
      />

      {/* ═══════ KPIs ═══════ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Taux de recouvrement" value={`${k.rate}%`} hint={`${counts.paid} lots à jour sur ${k.lots}`} />
        <KpiCard label="Encaissé" value={num(k.collected, false)} unit="MAD" hint={`sur ${num(k.expected, false)} appelés`} />
        <KpiCard label="Reste à recouvrer" value={num(k.outstanding, false)} unit="MAD" hint={`${k.lateCount} en retard`} />
        <KpiCard label="Solde de caisse" value={num(k.balance, false)} unit="MAD" />
      </div>

      {/* ═══════ Row 2: Recouvrement + Résumé ═══════ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recouvrement chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Recouvrement — {currentPeriod()}</h2>
            <Link href="/syndic/recouvrement" className="text-[13px] font-medium text-palier-600 hover:underline">Voir le détail</Link>
          </div>

          {/* Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-sand/50">
            {seg.map((s) => s.n > 0 && (
              <div key={s.key} className="transition-all" style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }} />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {seg.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[12px] text-ink-soft">{s.label}</span>
                <span className="text-[13px] font-semibold text-ink">{s.n}</span>
              </div>
            ))}
          </div>

          {/* Late residents */}
          {lateResidents.length > 0 && (
            <div className="mt-4 border-t border-black/[0.06] pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Résidents en retard</p>
              <div className="space-y-2">
                {lateResidents.map((r) => (
                  <div key={r.unitId} className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-semibold text-ink-soft"
                    >
                      {r.ownerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">{r.ownerName}</p>
                      <p className="text-[11px] text-ink-faint">Lot {r.ref}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-ink">{mad(r.amount - r.paid, { decimals: false })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Résumé */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Résumé</h2>
            <div className="space-y-3">
              {[
                { icon: "Building2", label: "Lots", value: k.lots, hint: `${k.residents} résidents` },
                { icon: "TriangleAlert", label: "Incidents ouverts", value: k.openIncidents, hint: "à traiter" },
                { icon: "FileText", label: "Documents", value: d.documents.length, hint: "coffre-fort numérique" },
                { icon: "Calendar", label: "Assemblées", value: d.assemblies.length, hint: nextAssembly ? `prochaine le ${shortDate(nextAssembly.date)}` : "aucune prévue" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={iconBox}>
                      <Icon name={m.icon} className={iconCls} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-ink">{m.label}</p>
                      <p className="text-[11px] text-ink-faint">{m.hint}</p>
                    </div>
                  </div>
                  <span className="text-[18px] font-bold text-ink">{m.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions rapides */}
          <Card>
            <h2 className="mb-3 text-[14px] font-semibold text-ink">Actions rapides</h2>
            <div className="space-y-1">
              {[
                { href: "/syndic/recouvrement", label: "Émettre un appel de fonds", icon: "ReceiptText" },
                { href: "/syndic/incidents", label: "Traiter les incidents", icon: "Wrench" },
                { href: "/syndic/documents", label: "Ajouter un document", icon: "Upload" },
                { href: "/syndic/ag", label: "Convoquer une assemblée", icon: "Calendar" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
                >
                  <Icon name={a.icon} className="h-4 w-4 text-ink-soft" strokeWidth={1.8} />
                  <span className="flex-1">{a.label}</span>
                  <Icon name="ChevronRight" className="h-3.5 w-3.5 text-ink-faint" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════ Row 3: Incidents + Dépenses ═══════ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Incidents récents */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="TriangleAlert" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Incidents récents</h2>
            </div>
            <Link href="/syndic/incidents" className="text-[13px] font-medium text-palier-600 hover:underline">Tout voir</Link>
          </div>
          {d.incidents.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {d.incidents.slice(0, 5).map((i: any) => (
                <div key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{i.title}</p>
                    <p className="text-[11px] text-ink-faint">{i.reporter_name} · {timeAgo(i.created_at)}</p>
                  </div>
                  {(i.urgency === "urgent" || i.urgency === "high") && (
                    <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Urgent</span>
                  )}
                  <StatusPill status={i.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="CheckCircle" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun incident signalé</p>
            </div>
          )}
        </Card>

        {/* Dernières dépenses */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="BookOpen" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Dernières dépenses</h2>
            </div>
            <Link href="/syndic/transparence" className="text-[13px] font-medium text-palier-600 hover:underline">Journal</Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {recentExpenses.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{e.label}</p>
                    <p className="text-[11px] text-ink-faint">{e.category} · {shortDate(e.date)}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-ink">-{mad(e.amount, { decimals: false })}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="BookOpen" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune dépense enregistrée</p>
            </div>
          )}
        </Card>
      </div>

      {/* ═══════ Row 4: Prochaine AG + Derniers documents ═══════ */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Prochaine assemblée */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="Calendar" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Prochaine assemblée</h2>
            </div>
            <Link href="/syndic/ag" className="text-[13px] font-medium text-palier-600 hover:underline">Toutes les AG</Link>
          </div>
          {nextAssembly ? (
            <div className="rounded-xl bg-black/[0.02] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-palier-600 text-white">
                  <span className="text-[16px] font-bold leading-none">{new Date(nextAssembly.date).getDate()}</span>
                  <span className="text-[10px] font-medium uppercase">{new Date(nextAssembly.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">Assemblée générale</p>
                  <p className="text-[12px] text-ink-soft">{nextAssembly.time} · {nextAssembly.place}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{nextAssembly.agenda.length} point{nextAssembly.agenda.length > 1 ? "s" : ""} à l&apos;ordre du jour</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="Calendar" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune assemblée prévue</p>
            </div>
          )}
        </Card>

        {/* Derniers documents */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={smallIconBox}><Icon name="FileText" className={smallIconCls} /></div>
              <h2 className="text-[14px] font-semibold text-ink">Derniers documents</h2>
            </div>
            <Link href="/syndic/documents" className="text-[13px] font-medium text-palier-600 hover:underline">Tous</Link>
          </div>
          {recentDocs.length > 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]">
                    <Icon name="FileText" className="h-4 w-4 text-ink-soft" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{doc.title}</p>
                    <p className="text-[11px] text-ink-faint">{shortDate(doc.date)} · {doc.size || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Icon name="FileText" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucun document ajouté</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
