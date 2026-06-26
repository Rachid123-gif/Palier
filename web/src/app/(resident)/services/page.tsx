"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { CitySheet } from "@/components/resident/CitySheet";
import { ProviderCard } from "@/components/resident/ProviderCard";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { OrbField } from "@/components/ui/OrbField";
import { mad } from "@/lib/format";
import { useCity, LOC_DETECTED_KEY, nearestCity } from "@/lib/useCity";
import { useData } from "@/lib/DataProvider";
import { categories, popular, offers, categoryBySlug } from "@/lib/data";

const timing = [
  { key: "now", label: "Maintenant", icon: "Zap" },
  { key: "today", label: "Aujourd'hui", icon: "Sun" },
  { key: "scheduled", label: "Planifier", icon: "CalendarDays" },
];

export default function ServicesScreen() {
  const { providersFor } = useData();
  const { slug, city, quartier, setCity } = useCity();
  const [citySheet, setCitySheet] = useState(false);
  const [when, setWhen] = useState("today");
  const [active, setActive] = useState<string | null>(null);

  // 8. Géolocalisation intelligente — détection auto à la première visite.
  useEffect(() => {
    if (typeof window === "undefined" || localStorage.getItem(LOC_DETECTED_KEY)) return;
    localStorage.setItem(LOC_DETECTED_KEY, "1");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCity(nearestCity(pos.coords.latitude, pos.coords.longitude), null),
        () => {},
        { timeout: 5000 },
      );
    }
  }, [setCity]);

  // 10. Aucune catégorie vide — on n'affiche que celles qui ont des prestataires ici.
  const availableCats = categories.filter((c) => providersFor(slug, c.slug).length > 0);
  const activeCat = active ? categoryBySlug(active) : null;
  const activeProviders = active ? providersFor(slug, active) : [];
  const filteredPopular = active ? popular.filter((p) => p.categorySlug === active) : popular;

  return (
    <div className="animate-[fade_0.4s_ease]">
      {/* HERO — conservé mais vivant & interactif */}
      <div className="bg-hero shimmer grain relative overflow-hidden rounded-b-[34px] pb-6 text-white shadow-hero">
        <OrbField tone="cool" />
        <div className="relative z-10">
          <StatusBar dark />
          <div className="flex items-center justify-between px-5 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">
              <Icon name="House" className="h-3.5 w-3.5" /> Services à domicile
            </span>
            <NotificationsBell dark />
          </div>

          <div className="px-5 pt-4">
            <h1 className="glow-text text-[34px] font-bold leading-[1.05] tracking-tight">Tout pour la maison.</h1>
            <p className="mt-2 max-w-[16rem] text-[14px] leading-snug text-white/80">
              {activeCat ? `${availableCats.length} catégories · ${activeProviders.length} pros ${activeCat.label.toLowerCase()}` : "Réservez en moins d'une minute. Prestataires vérifiés."}
            </p>

            {/* 4. Carousel horizontal de catégories — swipeable, snap, peek dégradé */}
            <div
              className="no-scrollbar -mx-5 mt-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1"
              style={{
                maskImage: "linear-gradient(to right, #000 90%, transparent 99%)",
                WebkitMaskImage: "linear-gradient(to right, #000 90%, transparent 99%)",
              }}
            >
              {availableCats.map((c) => {
                const on = active === c.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => setActive(on ? null : c.slug)}
                    className={`cat-chip flex w-[58px] shrink-0 snap-start flex-col items-center gap-1.5 ${on ? "cat-active" : ""}`}
                  >
                    <span className={`cat-icon flex h-14 w-14 items-center justify-center rounded-full backdrop-blur transition-colors ${on ? "bg-white text-palier-700" : "bg-white/15 text-white"}`}>
                      <Icon name={c.icon} className="h-6 w-6" strokeWidth={2.2} />
                    </span>
                    <span className={`text-center text-[11px] font-semibold leading-tight ${on ? "text-white" : "text-white/85"}`}>{c.short}</span>
                  </button>
                );
              })}
              {/* Espace final pour que la dernière catégorie sorte du dégradé */}
              <span className="w-2 shrink-0" aria-hidden />
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
      </div>

      <div className="space-y-5 px-4 pt-4">
        {/* Localisation (ville + quartier) */}
        <button onClick={() => setCitySheet(true)} className="press flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-cream-card p-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400/20">
            <Icon name="MapPin" className="h-5 w-5 text-coral-500" />
          </span>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Votre zone</p>
            <p className="text-sm font-bold text-ink">{city.name}{quartier ? ` · ${quartier}` : ""}</p>
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
              className={`press flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold ${when === t.key ? "bg-palier-600 text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
            >
              <Icon name={t.icon} className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* 3 & 6. Résultats filtrés par la catégorie active */}
        {activeCat ? (
          <div className="animate-[rise_0.3s_ease]">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${activeCat.tint}`}><Icon name={activeCat.icon} className={`h-4 w-4 ${activeCat.accent}`} /></span>
                {activeCat.label}
              </h2>
              <button onClick={() => setActive(null)} className="text-[13px] font-semibold text-ink-faint">Effacer</button>
            </div>
            <div className="space-y-3">
              {activeProviders.slice(0, 3).map((p) => (
                <ProviderCard key={p.id} p={p} categoryLabel={activeCat.label} />
              ))}
            </div>
            <Link href={`/services/${activeCat.slug}`} className="press mt-3 flex items-center justify-center gap-2 rounded-full bg-palier-600 py-3 text-sm font-semibold text-white">
              Voir les {activeProviders.length} prestataires <Icon name="ArrowRight" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Populaire cette semaine */}
            <div>
              <div className="mb-3 flex items-center gap-2 px-1">
                <span>🔥</span>
                <h2 className="text-[17px] font-bold tracking-tight text-ink">Populaire cette semaine</h2>
              </div>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {filteredPopular.map((p) => {
                  const cat = categoryBySlug(p.categorySlug);
                  return (
                    <Link key={p.id} href={`/services/${p.categorySlug}`} className={`press w-56 shrink-0 rounded-3xl border border-black/5 p-4 ${p.tint}`}>
                      <div className="flex items-center justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
                          <Icon name={cat?.icon ?? "Sparkles"} className={`h-6 w-6 ${p.accent}`} strokeWidth={2.2} />
                        </span>
                        {p.tag && <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-white">{p.tag}</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-2"><Rating value={p.rating} reviews={p.reviews} /></div>
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
                  <div key={o.id} className={`w-52 shrink-0 rounded-3xl border border-black/5 p-4 ${o.tint}`}>
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
          </>
        )}

        {/* Toutes les catégories (uniquement celles avec prestataires) */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Toutes les catégories</h2>
          <div className="grid grid-cols-2 gap-3">
            {availableCats.map((c) => {
              const count = providersFor(slug, c.slug).length;
              const on = active === c.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => setActive(on ? null : c.slug)}
                  className={`press flex items-center gap-3 rounded-2xl border p-3.5 text-left ${on ? "border-palier-400 ring-1 ring-palier-300" : "border-black/5"} ${c.tint}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
                    <Icon name={c.icon} className={`h-5.5 w-5.5 ${c.accent}`} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">{c.label}</p>
                    <p className="text-[11px] text-ink-faint">{count} dispo</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} currentQuartier={quartier} onPick={setCity} />
    </div>
  );
}
