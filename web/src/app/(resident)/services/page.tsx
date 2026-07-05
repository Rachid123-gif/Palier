"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { NotificationsBell } from "@/components/resident/NotificationsBell";
import { CitySheet } from "@/components/resident/CitySheet";
import { ProviderCard } from "@/components/resident/ProviderCard";
import { Icon } from "@/components/ui/Icon";
import { useCity, LOC_DETECTED_KEY, nearestCity } from "@/lib/useCity";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { categories, categoryBySlug } from "@/lib/data";

export default function ServicesScreen() {
  const { providersFor, currentUser } = useData();
  const { i, isAr } = useLang();
  const T = i.services;
  const { slug, city, quartier, setCity } = useCity(currentUser.city);
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

  const q = search.trim().toLowerCase();
  const searchedCats = useMemo(
    () => q ? availableCats.filter((c) => {
      const label = (i.catLabels[c.slug] ?? c.label).toLowerCase();
      const short = (i.catShorts[c.slug] ?? c.short).toLowerCase();
      return label.includes(q) || short.includes(q);
    }) : availableCats,
    [q, availableCats, i],
  );

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      <header className="flex items-end justify-between px-5 pb-2 pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{T.label}</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{T.title}</h1>
        </div>
        <NotificationsBell />
      </header>

      <div className="space-y-4 px-4 pt-1">
        <button onClick={() => setCitySheet(true)} className="tap flex w-full items-center gap-3 rounded-2xl bg-cream-card p-3 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-palier-100">
            <Icon name="MapPin" className="h-5 w-5 text-palier-600" />
          </span>
          <div className="flex-1 text-start">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.votreZone}</p>
            <p className="text-sm font-bold text-ink">{city.name}{quartier ? ` · ${quartier}` : ""}</p>
          </div>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-palier-600">
            {T.modifier} <Icon name="ChevronDown" className="h-4 w-4" />
          </span>
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-cream-card px-4 py-3 shadow-card">
          <Icon name="Search" className="h-5 w-5 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActive(null); }}
            placeholder={T.searchPlaceholder}
            className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="tap text-ink-faint">
              <Icon name="X" className="h-4 w-4" />
            </button>
          )}
        </div>

        {availableCats.length > 0 && (
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
                  className={`tap flex shrink-0 snap-start items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold ${on ? "bg-palier-600 text-white" : "border border-palier-100 bg-white text-ink-soft"}`}
                >
                  <Icon name={c.icon} className="h-4 w-4" /> {i.catShorts[c.slug] ?? c.short}
                </button>
              );
            })}
            <span className="w-2 shrink-0" aria-hidden />
          </div>
        )}

        {q ? null : activeCat ? (
          <div className="animate-[rise_0.3s_ease]">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-ink">
                <Icon name={activeCat.icon} className="h-5 w-5 text-palier-600" />
                {i.catLabels[activeCat.slug] ?? activeCat.label}
              </h2>
              <button onClick={() => setActive(null)} className="text-[13px] font-semibold text-ink-faint">{T.effacer}</button>
            </div>
            <div className="space-y-3">
              {activeProviders.slice(0, 3).map((p) => (
                <ProviderCard key={p.id} p={p} categoryLabel={i.catLabels[activeCat.slug] ?? activeCat.label} />
              ))}
            </div>
            {activeProviders.length > 3 && (
              <Link href={`/services/${activeCat.slug}`} className="tap mt-3 flex items-center justify-center gap-2 rounded-full bg-palier-600 py-3 text-sm font-semibold text-white">
                {T.voirPrestataires(activeProviders.length)} <Icon name={isAr ? "ArrowLeft" : "ArrowRight"} className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : null}

        <div>
          <h2 className="mb-3 px-1 text-[17px] font-bold tracking-tight text-ink">
            {q ? T.resultats(search.trim()) : T.toutesCategories}
          </h2>
          {searchedCats.length === 0 && (
            <div className="card flex items-center gap-3 p-4">
              <Icon name="SearchX" className="h-5 w-5 text-ink-faint" />
              <p className="text-[13px] text-ink-soft">{T.aucuneCategorie(search.trim())}</p>
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
                  className={`tap flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-start shadow-card ${on ? "border-palier-400 ring-1 ring-palier-300" : "border-black/5"}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palier-50">
                    <Icon name={c.icon} className="h-5 w-5 text-palier-600" />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">{i.catLabels[c.slug] ?? c.label}</p>
                    <p className="text-[11px] text-ink-faint">{count} {T.dispo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl bg-palier-50 px-4 py-3">
          <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
          <p className="text-[12px] leading-snug text-palier-800">{T.info}</p>
        </div>
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} currentQuartier={quartier} onPick={setCity} />
    </div>
  );
}
