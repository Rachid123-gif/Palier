"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Badge, Rating, Button } from "@/components/ui/primitives";
import { Toast } from "@/components/ui/Sheet";
import { mad } from "@/lib/format";
import { categoryBySlug } from "@/lib/data";
import { useData } from "@/lib/DataProvider";
import { createBooking } from "@/lib/actions";
import { telLink, whatsappLink, bookingMessage, type WhenType } from "@/lib/whatsapp";

const DATES = [
  { key: "d0", label: "Auj.", date: "29 avr" },
  { key: "d1", label: "Demain", date: "30 avr" },
  { key: "d2", label: "ven", date: "01 mai" },
  { key: "d3", label: "sam", date: "02 mai" },
  { key: "d4", label: "dim", date: "03 mai" },
];
const HOURS = ["08:00", "09:30", "11:00", "14:00", "15:30", "17:00"];

export default function ProviderScreen() {
  const params = useParams<{ id: string }>();
  const { providerById, currentUser } = useData();
  const p = providerById(params.id);
  const [when, setWhen] = useState<WhenType>("today");
  const [date, setDate] = useState("d0");
  const [hour, setHour] = useState("");
  const [toast, setToast] = useState(false);

  if (!p) {
    return (
      <div className="p-6">
        <StatusBar />
        <p className="mt-10 text-center text-ink-soft">Prestataire introuvable.</p>
        <Link href="/services" className="mt-4 block text-center font-semibold text-palier-600">Retour aux services</Link>
      </div>
    );
  }

  const cat = categoryBySlug(p.categorySlug);
  const dObj = DATES.find((d) => d.key === date)!;
  const slotLabel = `${dObj.label} ${dObj.date}${hour ? ` à ${hour}` : ""}`;
  const ready = when !== "scheduled" || !!hour;

  const wa = whatsappLink(
    p.whatsapp,
    bookingMessage({
      providerName: p.name,
      serviceLabel: cat?.label ?? "Service",
      whenType: when,
      slotLabel: when === "scheduled" ? slotLabel : undefined,
      city: currentUser.cityName,
      building: currentUser.building,
      userName: currentUser.name,
    }),
  );

  const whenText = when === "now" ? "Dès que possible" : when === "today" ? "Aujourd'hui" : hour ? slotLabel : "À choisir";

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href={`/services/${p.categorySlug}`} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Réserver</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        {/* Carte prestataire */}
        <div className="card p-4">
          <div className="flex gap-3.5">
            <div className="relative">
              <Avatar {...p.avatar} size={60} />
              {p.verified && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-palier-600 ring-2 ring-cream-card">
                  <Icon name="Check" className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-[17px] font-bold text-ink">{p.name}</h2>
                {p.topNeighbor && <Badge tone="gold" icon="Crown">Top voisins</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Rating value={p.rating} reviews={p.reviews} />
                <span className="text-ink-faint">·</span>
                <span className="text-[12px] text-ink-soft">{p.district}</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-snug text-ink-soft">{p.bio}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {p.verified && <Badge tone="success" icon="BadgeCheck">Vérifié</Badge>}
            {p.insured && <Badge tone="info" icon="ShieldCheck">Assuré</Badge>}
            {p.availableToday && <Badge tone="brand" icon="Clock">Dispo aujourd'hui</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={telLink(p.phone)} className="tap flex items-center justify-center gap-1.5 rounded-full bg-sand py-2.5 text-[13px] font-semibold text-ink">
              <Icon name="Phone" className="h-4 w-4" /> Appeler
            </a>
            <a href={wa} target="_blank" rel="noopener" className="tap flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2.5 text-[13px] font-semibold text-white">
              <Icon name="MessageCircle" className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Quand ? */}
        <div>
          <h3 className="mb-2.5 px-1 text-[15px] font-bold text-ink">Quand souhaitez-vous l'intervention ?</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: "now", label: "Maintenant", icon: "Zap" },
              { key: "today", label: "Aujourd'hui", icon: "Sun" },
              { key: "scheduled", label: "Planifier", icon: "CalendarDays" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setWhen(t.key)}
                className={`tap flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[12.5px] font-semibold ${when === t.key ? "bg-palier-600 text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
              >
                <Icon name={t.icon} className="h-5 w-5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Créneau (si planifier) */}
        {when === "scheduled" && (
          <div className="animate-[rise_0.3s_ease] space-y-3">
            <div>
              <p className="mb-2 px-1 text-[13px] font-semibold text-ink-soft">Choisir une date</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {DATES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDate(d.key)}
                    className={`tap flex w-16 shrink-0 flex-col items-center rounded-2xl py-2.5 ${date === d.key ? "bg-palier-600 text-white" : "bg-cream-card text-ink shadow-card"}`}
                  >
                    <span className="text-[11px] opacity-80">{d.label}</span>
                    <span className="text-[13px] font-bold">{d.date}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 px-1 text-[13px] font-semibold text-ink-soft">Heure</p>
              <div className="grid grid-cols-3 gap-2">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHour(h)}
                    className={`tap rounded-full py-2.5 text-[13px] font-semibold ${hour === h ? "bg-palier-600 text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Récap */}
        <div className="rounded-2xl bg-palier-50 p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-palier-700">Récapitulatif</p>
          {[
            ["Prestataire", p.name],
            ["Service", cat?.label ?? "—"],
            ["Quand", whenText],
            ["Prix", `dès ${mad(p.basePrice, { decimals: false })}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-ink-soft">{k}</span>
              <span className="font-semibold text-ink">{v}</span>
            </div>
          ))}
          <p className="mt-2 flex items-center gap-1.5 border-t border-palier-200/60 pt-2 text-[12px] text-palier-700">
            <Icon name="Lock" className="h-3.5 w-3.5" /> Paiement après la prestation. Aucun débit avant.
          </p>
        </div>
      </div>

      {/* CTA collant */}
      <div className="safe-bottom sticky bottom-0 mt-5 border-t border-black/5 bg-cream/90 px-4 pb-2 pt-3 backdrop-blur">
        <a
          href={ready ? wa : undefined}
          target="_blank"
          rel="noopener"
          onClick={() => {
            if (!ready) return;
            createBooking({ providerId: p.id, categorySlug: p.categorySlug, whenType: when, priceEstimate: p.basePrice });
            setTimeout(() => setToast(true), 400);
          }}
          className={`tap flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white ${ready ? "bg-palier-600" : "pointer-events-none bg-ink-faint/50"}`}
        >
          <Icon name="MessageCircle" className="h-5 w-5" />
          {when === "scheduled" && !hour ? "Choisissez un créneau" : "Confirmer sur WhatsApp"}
        </a>
        <p className="mt-1.5 text-center text-[11px] text-ink-faint">Le prestataire confirme sous 1h · sans engagement</p>
      </div>

      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title="Réservation envoyée"
        body={`${cat?.label} avec ${p.name} — ${whenText}. Le prestataire confirme sous 1h.`}
      />
    </div>
  );
}
