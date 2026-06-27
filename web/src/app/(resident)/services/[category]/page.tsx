"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { CitySheet } from "@/components/resident/CitySheet";
import { ProviderCard } from "@/components/resident/ProviderCard";
import { Icon } from "@/components/ui/Icon";
import { useCity } from "@/lib/useCity";
import { useData } from "@/lib/DataProvider";
import { categoryBySlug } from "@/lib/data";

export default function CategoryScreen() {
  const params = useParams<{ category: string }>();
  const { providersFor } = useData();
  const { slug, city, quartier, setCity } = useCity();
  const [citySheet, setCitySheet] = useState(false);

  const cat = categoryBySlug(params.category);
  const list = providersFor(slug, params.category);

  if (!cat) {
    return (
      <div className="p-6">
        <StatusBar />
        <p className="mt-10 text-center text-ink-soft">Catégorie introuvable.</p>
        <Link href="/services" className="mt-4 block text-center font-semibold text-palier-600">Retour aux services</Link>
      </div>
    );
  }

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/services" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-palier-50">
            <Icon name={cat.icon} className="h-5 w-5 text-palier-600" />
          </span>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">{cat.label}</h1>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Localisation */}
        <button onClick={() => setCitySheet(true)} className="tap flex w-full items-center gap-2 rounded-2xl bg-palier-50 px-4 py-3 text-left">
          <Icon name="MapPin" className="h-4 w-4 text-palier-600" />
          <span className="text-[13px] font-semibold text-palier-800">{city.name}</span>
          <span className="text-[12px] text-ink-soft">· {list.length} prestataire{list.length > 1 ? "s" : ""} disponible{list.length > 1 ? "s" : ""}</span>
          <Icon name="ChevronDown" className="ml-auto h-4 w-4 text-palier-600" />
        </button>

        {list.length > 0 ? (
          <div className="space-y-3">
            {list.map((p) => (
              <ProviderCard key={p.id} p={p} categoryLabel={cat.label} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
              <Icon name="SearchX" className="h-7 w-7 text-palier-600" />
            </div>
            <h2 className="mt-3 text-[16px] font-bold text-ink">Aucun prestataire pour le moment</h2>
            <p className="mx-auto mt-1 max-w-[16rem] text-[13px] text-ink-soft">
              Pas encore de prestataire <b>{cat.label.toLowerCase()}</b> référencé à {city.name}. Essayez une autre ville.
            </p>
            <button
              onClick={() => setCitySheet(true)}
              className="tap mx-auto mt-4 flex items-center gap-1.5 rounded-full border border-palier-100 bg-white px-4 py-2 text-[13px] font-semibold text-palier-700"
            >
              <Icon name="MapPin" className="h-4 w-4" /> Changer de ville
            </button>
          </div>
        )}
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} currentQuartier={quartier} onPick={setCity} />
    </div>
  );
}
