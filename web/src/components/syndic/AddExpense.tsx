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
    await createLedgerEntry({ type, label, amount: Number(amount), category, date: "2026-06-19" });
    setBusy(false); setOpen(false); setLabel(""); setAmount("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
        <Icon name="Plus" className="h-4 w-4" /> Enregistrer une opération
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-float">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Nouvelle opération de caisse</h3>
          <button onClick={() => setOpen(false)} className="rounded-full bg-sand p-1.5"><Icon name="X" className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setType("out")} className={`rounded-xl py-2.5 text-sm font-semibold ${type === "out" ? "bg-coral-500 text-white" : "bg-sand text-ink-soft"}`}>Dépense</button>
          <button onClick={() => setType("in")} className={`rounded-xl py-2.5 text-sm font-semibold ${type === "in" ? "bg-success text-white" : "bg-sand text-ink-soft"}`}>Encaissement</button>
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé (ex : Réparation porte garage)"
          className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-palier-300" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Montant MAD" inputMode="decimal"
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-palier-300" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-palier-300">
            {["Maintenance", "Personnel", "Fluides", "Fournitures", "Travaux", "Charges", "Assurance"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={save} disabled={busy || !label || !amount}
          className="tap mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3 text-sm font-semibold text-white disabled:opacity-50">
          <Icon name={busy ? "LoaderCircle" : "ShieldCheck"} className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Signer et enregistrer
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-faint">L'opération est horodatée et signée dans le journal de transparence.</p>
      </div>
    </div>
  );
}
