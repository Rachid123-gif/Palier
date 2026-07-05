"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { createLedgerEntry } from "@/lib/actions";

export function AddExpense() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [type, setType] = useState<"out" | "in">("out");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!label || !amount) return;
    setBusy(true);
    await createLedgerEntry({ type, label, amount: Number(amount), category, date: new Date().toISOString().split("T")[0] });
    setBusy(false); setOpen(false); setLabel(""); setAmount("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700">
        <Icon name="Plus" className="h-3.5 w-3.5" /> Enregistrer
      </button>
    );
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button onClick={() => setOpen(false)} className="absolute inset-0 bg-black/30" />
      <div className="relative w-full max-w-md rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-ink">Nouvelle opération</h3>
          <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-faint hover:bg-palier-50 hover:text-ink"><Icon name="X" className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-1 rounded-lg border border-black/[0.08] p-0.5">
          <button onClick={() => setType("out")} className={`flex-1 rounded-md py-2 text-[13px] font-medium ${type === "out" ? "bg-palier-50 text-palier-700" : "text-ink-soft"}`}>Dépense</button>
          <button onClick={() => setType("in")} className={`flex-1 rounded-md py-2 text-[13px] font-medium ${type === "in" ? "bg-palier-50 text-palier-700" : "text-ink-soft"}`}>Encaissement</button>
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé" className={`mt-3 ${inputCls}`} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Montant MAD" inputMode="decimal" className={inputCls} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {["Maintenance", "Personnel", "Fluides", "Fournitures", "Travaux", "Charges", "Assurance"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={save} disabled={busy || !label || !amount}
          className="mt-4 w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-50">
          {busy ? "Enregistrement…" : "Signer et enregistrer"}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-soft">Horodaté et signé dans le journal.</p>
      </div>
    </div>
  );
}
