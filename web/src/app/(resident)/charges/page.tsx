"use client";
import { useMemo, useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { ScreenHeader } from "@/components/resident/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button } from "@/components/ui/primitives";
import { Sheet, Toast } from "@/components/ui/Sheet";
import { useRouter } from "next/navigation";
import { mad, num, shortDate } from "@/lib/format";
import { useData } from "@/lib/DataProvider";
import { recordPayment } from "@/lib/actions";
import type { Charge } from "@/lib/types";

const statusMap = {
  due: { tone: "warning" as const, label: "À payer" },
  late: { tone: "danger" as const, label: "En retard" },
  partial: { tone: "info" as const, label: "Partiel" },
  paid: { tone: "success" as const, label: "Payé" },
};

const catIcon: Record<string, string> = {
  courantes: "Building2", travaux: "HardHat", provision: "PiggyBank", regularisation: "Droplets",
};

export default function ChargesScreen() {
  const { charges: dueCharges, chargesHistory } = useData();
  const router = useRouter();
  const [paid, setPaid] = useState<Set<string>>(new Set());
  const [payTarget, setPayTarget] = useState<Charge[] | null>(null);
  const [toast, setToast] = useState(false);

  const remaining = useMemo(
    () => dueCharges.filter((c) => !paid.has(c.id)),
    [paid],
  );
  const total = remaining.reduce((s, c) => s + (c.amount - c.paid), 0);

  function confirmPay() {
    if (!payTarget) return;
    const items = payTarget.map((c) => ({ id: c.id, amount: c.amount }));
    recordPayment(items, "card").then(() => router.refresh());
    setPaid((prev) => {
      const next = new Set(prev);
      items.forEach((i) => next.add(i.id));
      return next;
    });
    setPayTarget(null);
    setToast(true);
  }

  const payAmount = payTarget?.reduce((s, c) => s + (c.amount - c.paid), 0) ?? 0;

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <ScreenHeader label="Copropriété" title="Mes charges" />

      <div className="space-y-5 px-4">
        {/* Total à régler */}
        <div className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-hero">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative">
            <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">Total à régler</span>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="text-[42px] font-bold leading-none tracking-tight">{num(total)}</span>
              <span className="mb-1.5 text-sm font-semibold opacity-80">MAD</span>
            </div>
            <p className="mt-1 text-[13px] opacity-80">
              {remaining.length > 0 ? `${remaining.length} charge${remaining.length > 1 ? "s" : ""} en attente` : "Tout est réglé 🎉"}
            </p>
            {remaining.length > 0 && (
              <button
                onClick={() => setPayTarget(remaining)}
                className="tap mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-palier-700"
              >
                <Icon name="Zap" className="h-4 w-4 fill-gold-500 text-gold-500" /> Tout payer en 1 clic
              </button>
            )}
          </div>
        </div>

        {/* À régler */}
        {remaining.length > 0 && (
          <div>
            <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">À régler</h2>
            <div className="space-y-3">
              {remaining.map((c) => (
                <ChargeCard key={c.id} c={c} onPay={() => setPayTarget([c])} />
              ))}
            </div>
          </div>
        )}

        {/* Historique */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Historique</h2>
          <div className="space-y-3">
            {[...dueCharges.filter((c) => paid.has(c.id)).map((c) => ({ ...c, status: "paid" as const, paid: c.amount })), ...chargesHistory].map((c) => (
              <ChargeCard key={c.id} c={c} paidView />
            ))}
          </div>
        </div>

        {/* Transparence */}
        <div className="flex items-center gap-3 rounded-2xl border border-palier-100 bg-palier-50 p-3.5">
          <Icon name="ShieldCheck" className="h-6 w-6 shrink-0 text-palier-600" />
          <p className="text-[12.5px] font-medium text-palier-800">
            Chaque paiement alimente la caisse de l'immeuble. Suivez l'usage dans <b>Transparence financière</b>.
          </p>
        </div>
      </div>

      {/* Sheet de paiement */}
      <Sheet open={!!payTarget} onClose={() => setPayTarget(null)} title="Régler les charges">
        <div className="rounded-2xl bg-white p-4">
          {payTarget?.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-soft">{c.label} · {c.period}</span>
              <span className="font-semibold text-ink">{mad(c.amount - c.paid)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2.5">
            <span className="font-bold text-ink">Total</span>
            <span className="text-lg font-bold text-palier-700">{mad(payAmount)}</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Moyen de paiement</p>
          {[
            { icon: "CreditCard", label: "Carte bancaire (CMI)", sub: "Visa · Mastercard" },
            { icon: "Smartphone", label: "Virement instantané", sub: "Wafacash · CIH Mobile" },
            { icon: "Banknote", label: "Espèces au syndic", sub: "Marquer comme remis" },
          ].map((m, i) => (
            <label key={m.label} className="tap flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3">
              <input type="radio" name="pay" defaultChecked={i === 0} className="accent-palier-600" />
              <Icon name={m.icon} className="h-5 w-5 text-palier-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{m.label}</p>
                <p className="text-[12px] text-ink-faint">{m.sub}</p>
              </div>
            </label>
          ))}
        </div>
        <Button full className="mt-5" icon="Lock" onClick={confirmPay}>
          Payer {mad(payAmount)}
        </Button>
        <p className="mt-2 text-center text-[11px] text-ink-faint">Paiement sécurisé · reçu PDF envoyé automatiquement</p>
      </Sheet>

      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title="Paiement confirmé"
        body="Votre reçu PDF est disponible dans l'historique. Merci !"
      />
    </div>
  );
}

function ChargeCard({ c, onPay, paidView }: { c: Charge; onPay?: () => void; paidView?: boolean }) {
  const st = statusMap[c.status];
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand">
          <Icon name={catIcon[c.category] ?? "ReceiptText"} className="h-5 w-5 text-palier-600" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink">{c.label}</p>
          <p className="truncate text-[12px] text-ink-soft">{c.detail}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={st.tone}>{st.label}</Badge>
            <span className="truncate text-[11px] text-ink-faint">
              {c.period} · échéance {shortDate(c.dueDate)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[15px] font-bold text-ink">{num(c.amount)}</p>
          <p className="text-[10px] font-semibold text-ink-faint">MAD</p>
        </div>
      </div>
      {paidView ? (
        <button className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-sand py-2 text-[13px] font-semibold text-ink-soft">
          <Icon name="FileText" className="h-4 w-4" /> Télécharger le reçu PDF
        </button>
      ) : (
        <Button full variant="primary" iconRight="ArrowRight" className="mt-3" onClick={onPay}>
          Payer maintenant
        </Button>
      )}
    </div>
  );
}
