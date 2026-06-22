"use client";
import Link from "next/link";
import { useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { CitySheet } from "@/components/resident/CitySheet";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { mad } from "@/lib/format";
import { useCity } from "@/lib/useCity";
import { useData } from "@/lib/DataProvider";
import { categories, popular, offers, categoryBySlug } from "@/lib/data";

const timing = [
  { key: "now", label: "Maintenant", icon: "Zap" },
  { key: "today", label: "Aujourd'hui", icon: "Sun" },
  { key: "scheduled", label: "Planifier", icon: "CalendarDays" },
];

export default function ServicesScreen() {
  const { providersFor } = useData();
  const { slug, city, setCity } = useCity();
  const [citySheet, setCitySheet] = useState(false);
  const [when, setWhen] = useState("today");

  return (
    <div className="animate-[fade_0.4s_ease]">
      {/* HERO conservé */}
      <div className="bg-hero rounded-b-[34px] pb-6 text-white shadow-hero">
        <StatusBar dark />
        <div className="flex items-center justify-between px-5 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">
            <Icon name="House" className="h-3.5 w-3.5" /> Services à domicile
          </span>
          <NotificationsBell dark />
        </div>

        <div className="px-5 pt-4">
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight">Tout pour la maison.</h1>
          <p className="mt-2 max-w-[16rem] text-[14px] leading-snug text-white/80">
            Réservez en moins d'une minute. Prestataires vérifiés.
          </p>

          {/* Catégories rapides */}
          <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-1">
            {categories.slice(0, 5).map((c) => (
              <Link key={c.slug} href={`/services/${c.slug}`} className="tap flex w-16 shrink-0 flex-col items-center gap-1.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <Icon name={c.icon} className="h-6 w-6 text-white" strokeWidth={2.2} />
                </span>
                <span className="text-[12px] font-semibold">{c.short}</span>
              </Link>
            ))}
          </div>

          {/* Badges confiance */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: "Check", label: "Vérifiés" },
              { icon: "Star", label: "4.8/5" },
              { icon: "ShieldCheck", label: "Assurés" },
              { icon: "Zap", label: "< 1 min" },
            ].map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-semibold backdrop-blur">
                <Icon name={b.icon} className="h-3.5 w-3.5" strokeWidth={2.5} /> {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-4">
        {/* Localisation (géoloc) */}
        <button
          onClick={() => setCitySheet(true)}
          className="tap flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-cream-card p-3 shadow-card"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400/20">
            <Icon name="MapPin" className="h-5 w-5 text-coral-500" />
          </span>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Votre zone</p>
            <p className="text-sm font-bold text-ink">{city.name}</p>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-palier-600">
            Modifier <Icon name="ChevronDown" className="h-4 w-4" />
          </span>
        </button>

        {/* Preuve sociale */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex -space-x-2.5">
            {["#e0a82e", "#1e5b50", "#c5604f", "#7a4ea8"].map((c, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-cream" style={{ backgroundColor: c }}>
                {["K", "M", "S", "F"][i]}
              </span>
            ))}
          </div>
          <p className="text-[13px] text-ink-soft">
            <b className="text-ink">Khadija, Mehdi & 142 voisins</b> l'utilisent ce mois-ci
          </p>
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-2 rounded-2xl bg-cream-card px-4 py-3.5 shadow-card">
          <Icon name="Search" className="h-5 w-5 text-ink-faint" />
          <span className="text-[14px] text-ink-faint">Plombier, ménage, climatisation…</span>
        </div>

        {/* Timing */}
        <div className="grid grid-cols-3 gap-2">
          {timing.map((t) => (
            <button
              key={t.key}
              onClick={() => setWhen(t.key)}
              className={`tap flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold ${when === t.key ? "bg-palier-600 text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
            >
              <Icon name={t.icon} className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Populaire cette semaine */}
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span>🔥</span>
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Populaire cette semaine</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {popular.map((p) => {
              const cat = categoryBySlug(p.categorySlug);
              return (
                <Link key={p.id} href={`/services/${p.categorySlug}`} className={`tap w-56 shrink-0 rounded-3xl border border-black/5 p-4 ${p.tint}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
                      <Icon name={cat?.icon ?? "Sparkles"} className={`h-6 w-6 ${p.accent}`} strokeWidth={2.2} />
                    </span>
                    {p.tag && <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-white">{p.tag}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Rating value={p.rating} reviews={p.reviews} />
                  </div>
                  <p className="mt-1 text-[16px] font-bold text-ink">{p.title}</p>
                  <p className="text-[12px] text-ink-soft">{p.desc}</p>
                  <p className="mt-2 text-[13px] font-semibold text-palier-700">À partir de {mad(p.price, { decimals: false })}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Offres spéciales */}
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <span>🎁</span>
            <h2 className="text-[17px] font-bold tracking-tight text-ink">Offres spéciales</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {offers.map((o) => (
              <div key={o.id} className={`tap w-52 shrink-0 rounded-3xl border border-black/5 p-4 ${o.tint}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
                    <Icon name={o.icon} className={`h-5.5 w-5.5 ${o.accent}`} strokeWidth={2.2} />
                  </span>
                  {o.off && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[11px] font-bold text-white">{o.off}</span>}
                </div>
                <p className="mt-3 text-[15px] font-bold leading-tight text-ink">{o.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">{o.desc}</p>
                <p className="mt-2 text-[13px] font-bold text-ink">
                  {mad(o.price, { decimals: false })}
                  {o.was > 0 && <span className="ml-1.5 text-[12px] font-normal text-ink-faint line-through">{o.was}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Toutes les catégories */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Toutes les catégories</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const count = providersFor(slug, c.slug).length;
              return (
                <Link key={c.slug} href={`/services/${c.slug}`} className={`tap flex items-center gap-3 rounded-2xl border border-black/5 p-3.5 ${c.tint}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
                    <Icon name={c.icon} className={`h-5.5 w-5.5 ${c.accent}`} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">{c.label}</p>
                    <p className="text-[11px] text-ink-faint">{count > 0 ? `${count} dispo` : "Sur demande"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} onPick={setCity} />
    </div>
  );
}
