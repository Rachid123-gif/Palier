import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, KpiCard, Card } from "@/components/syndic/ui";
import { AddExpense } from "@/components/syndic/AddExpense";
import { Icon } from "@/components/ui/Icon";
import { mad, num, shortDate } from "@/lib/format";

type Entry = { id: string; type: "in" | "out"; label: string; amount: number; entry_date: string; category: string; signed: boolean };

export default async function SyndicTransparence() {
  const d = await fetchSyndicData();
  const ledger = d.ledger as Entry[];
  const totalIn = ledger.filter((l) => l.type === "in").reduce((s, l) => s + Number(l.amount), 0);
  const totalOut = ledger.filter((l) => l.type === "out").reduce((s, l) => s + Number(l.amount), 0);

  return (
    <div>
      <PageHeader title="Transparence" subtitle="Journal de caisse — visible par les résidents" action={<AddExpense />} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Encaissé" value={num(totalIn, false)} unit="MAD" />
        <KpiCard label="Dépensé" value={num(totalOut, false)} unit="MAD" />
        <KpiCard label="Solde" value={num(d.kpis.balance, false)} unit="MAD" />
      </div>

      <Card className="mt-5">
        <h2 className="mb-3 text-[14px] font-semibold text-ink">Journal des opérations</h2>
        <div className="divide-y divide-black/[0.04]">
          {ledger.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${l.type === "in" ? "bg-emerald-50" : "bg-red-50"}`}>
                <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-3.5 w-3.5 ${l.type === "in" ? "text-emerald-600" : "text-red-500"}`} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{l.label}</p>
                <p className="text-[11px] text-ink-soft">{shortDate(l.entry_date)} · {l.category}</p>
              </div>
              {l.signed && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">signé</span>}
              <p className={`w-24 text-right text-[13px] font-medium ${l.type === "in" ? "text-emerald-600" : "text-ink"}`}>
                {l.type === "in" ? "+" : "−"}{mad(Number(l.amount), { decimals: false })}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
