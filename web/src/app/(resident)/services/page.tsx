"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { CitySheet } from "@/components/resident/CitySheet";
import { ProviderCard } from "@/components/resident/ProviderCard";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { mad } from "@/lib/format";
import { useCity, LOC_DETECTED_KEY, nearestCity } from "@/lib/useCity";
import { useData } from "@/lib/DataProvider";
import { categories, popular, offers, categoryBySlug } from "@/lib/data";

export default function ServicesScreen() {
  const { providersFor } = useData();
  const { slug, city, quartier, setCity } = useCity();
  const [citySheet, setCitySheet] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const availableCats = categories.filter((c) => providersFor(slug, c.slug).length > 0);
  const activeCat = active ? categoryBySlug(active) : null;
  const activeProviders = active ? providersFor(slug, active) : [];
  const filteredPopular = active ? popular.filter((p) => p.categorySlug === active) : popular;

  const q = search.trim().toLowerCase();
  const searchedCats = useMemo(
    () => q ? availableCats.filter((c) => c.label.toLowerCase().includes(q) || c.short.toLowerCase().includes(q)) : availableCats,
    [q, availableCats],
  );

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header compact */}
      <header className="flex items-end justify-between px-5 pb-2 pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Services</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">À domicile</h1>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Localisation */}
        <button onClick={() => setCitySheet(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-100">
            <Icon name="MapPin" className="h-5 w-5 text-palier-600" />
          </span>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Votre zone</p>
            <p className="text-sm font-bold text-ink">{city.name}{quartier ? ` · ${quartier}` : ""}</p>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-palier-600">
            Modifier <Icon name="ChevronDown" className="h-4 w-4" />
          </span>
        </button>

        {/* Recherche */}
        <div className="flex items-center gap-2 rounded-2xl bg-cream-card px-4 py-3 shadow-card">
          <Icon name="Search" className="h-5 w-5 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActive(null); }}
            placeholder="Plombier, ménage, climatisation…"
            className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="tap text-ink-faint">
              <Icon name="X" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Catégories carousel */}
        <div
          className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1"
          style={{ maskImage: "linear-gradient(to right, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 92%, transparent)" }}
        >
          {availableCats.map((c) => {
            const on = active === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setActive(on ? null : c.slug)}
                className={`tap flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold ${on ? "bg-palier-600 text-white" : "bg-cream-card text-ink-soft shadow-card"}`}
              >
                <Icon name={c.icon} className="h-4 w-4" /> {c.short}
              </button>
            );
          })}
          <span className="w-2 shrink-0" aria-hidden />
        </div>

        {/* Résultats filtrés par catégorie */}
        {q ? null : activeCat ? (
          <div className="animate-[rise_0.3s_ease]">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
                <Icon name={activeCat.icon} className="h-5 w-5 text-palier-600" />
                {activeCat.label}
              </h2>
              <button onClick={() => setActive(null)} className="text-[13px] font-semibold text-ink-faint">Effacer</button>
            </div>
            <div className="space-y-3">
              {activeProviders.slice(0, 3).map((p) => (
                <ProviderCard key={p.id} p={p} categoryLabel={activeCat.label} />
              ))}
            </div>
            {activeProviders.length > 3 && (
              <Link href={`/services/${activeCat.slug}`} className="tap mt-3 flex items-center justify-center gap-2 rounded-full bg-palier-600 py-3 text-sm font-semibold text-white">
                Voir les {activeProviders.length} prestataires <Icon name="ArrowRight" className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Populaire cette semaine */}
            <div>
              <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Populaire cette semaine</h2>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {filteredPopular.map((p) => {
                  const cat = categoryBySlug(p.categorySlug);
                  return (
                    <Link key={p.id} href={`/services/${p.categorySlug}`} className="tap w-56 shrink-0 rounded-2xl border border-black/5 bg-white p-4 shadow-card">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-50">
                          <Icon name={cat?.icon ?? "Sparkles"} className="h-5 w-5 text-palier-600" />
                        </span>
                        {p.tag && <span className="rounded-full bg-palier-600 px-2 py-0.5 text-[10px] font-bold text-white">{p.tag}</span>}
                      </div>
                      <p className="mt-3 text-[15px] font-bold text-ink">{p.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{p.desc}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Rating value={p.rating} reviews={p.reviews} />
                        <p className="text-[13px] font-semibold text-palier-700">{mad(p.price, { decimals: false })}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Offres spéciales */}
            <div>
              <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">Offres spéciales</h2>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {offers.map((o) => (
                  <div key={o.id} className="w-52 shrink-0 rounded-2xl border border-black/5 bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-50">
                        <Icon name={o.icon} className="h-5 w-5 text-palier-600" />
                      </span>
                      {o.off && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold text-white">{o.off}</span>}
                    </div>
                    <p className="mt-3 text-[14px] font-bold leading-tight text-ink">{o.title}</p>
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

        {/* Toutes les catégories */}
        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">
            {q ? `Résultats pour "${search.trim()}"` : "Toutes les catégories"}
          </h2>
          {searchedCats.length === 0 && (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="SearchX" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">Aucune catégorie trouvée pour &quot;{search.trim()}&quot;</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {searchedCats.map((c) => {
              const count = providersFor(slug, c.slug).length;
              const on = active === c.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => setActive(on ? null : c.slug)}
                  className={`tap flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-card ${on ? "border-palier-400 ring-1 ring-palier-300" : "border-black/5"}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-50">
                    <Icon name={c.icon} className="h-5 w-5 text-palier-600" />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">{c.label}</p>
                    <p className="text-[11px] text-ink-faint">{count} dispo</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-palier-50 px-4 py-3">
          <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
          <p className="text-[12px] leading-snug text-palier-800">
            Annuaire de prestataires pour faciliter votre quotidien. Contactez-les directement pour convenir des modalités.
          </p>
        </div>
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} currentQuartier={quartier} onPick={setCity} />
    </div>
  );
}
