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
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Transparence financière"
        subtitle="Journal de caisse signé — visible par tous les résidents"
        action={<AddExpense />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard icon="ArrowDownLeft" label="Total encaissé" value={num(totalIn, false)} unit="MAD" tint="bg-success-soft" color="text-success" />
        <KpiCard icon="ArrowUpRight" label="Total dépensé" value={num(totalOut, false)} unit="MAD" tint="bg-coral-400/20" color="text-coral-600" />
        <KpiCard icon="Wallet" label="Solde de caisse" value={num(d.kpis.balance, false)} unit="MAD" tint="bg-palier-100" color="text-palier-600" />
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="ShieldCheck" className="h-5 w-5 text-palier-600" />
          <h2 className="text-[16px] font-bold text-ink">Journal des opérations</h2>
        </div>
        <div className="divide-y divide-black/5">
          {ledger.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${l.type === "in" ? "bg-success-soft" : "bg-coral-400/15"}`}>
                <Icon name={l.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"} className={`h-4 w-4 ${l.type === "in" ? "text-success" : "text-coral-600"}`} strokeWidth={2.3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{l.label}</p>
                <p className="text-[11px] text-ink-faint">{shortDate(l.entry_date)} · {l.category}</p>
              </div>
              {l.signed && <span className="inline-flex items-center gap-1 rounded-full bg-palier-50 px-2 py-1 text-[10px] font-semibold text-palier-600"><Icon name="ShieldCheck" className="h-3 w-3" /> signé</span>}
              <p className={`w-28 text-right text-[14px] font-bold ${l.type === "in" ? "text-success" : "text-ink"}`}>
                {l.type === "in" ? "+" : "−"}{mad(Number(l.amount), { decimals: false })}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
