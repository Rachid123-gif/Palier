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
import { OrbField } from "@/components/ui/OrbField";
import { createServiceRequest } from "@/lib/actions";
import { whatsappLink, quoteRequestMessage } from "@/lib/whatsapp";

// Numéro conciergerie Palier (mise en relation quand aucun prestataire).
const CONCIERGE = "+212600000000";

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

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/services" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.tint}`}>
            <Icon name={cat.icon} className={`h-5 w-5 ${cat.accent}`} strokeWidth={2.3} />
          </span>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">{cat.label}</h1>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Localisation */}
        <button onClick={() => setCitySheet(true)} className="tap flex w-full items-center gap-2 rounded-2xl bg-palier-50 px-4 py-3 text-left">
          <Icon name="MapPin" className="h-4 w-4 text-coral-500" />
          <span className="text-[13px] font-semibold text-palier-800">{city.name}</span>
          <span className="text-[12px] text-ink-soft">· {list.length} prestataire{list.length > 1 ? "s" : ""} à proximité</span>
          <Icon name="ChevronDown" className="ml-auto h-4 w-4 text-palier-600" />
        </button>

        {list.length > 0 ? (
          <div className="space-y-3">
            {list.map((p) => (
              <ProviderCard key={p.id} p={p} categoryLabel={cat.label} />
            ))}
          </div>
        ) : (
          <EmptyState categoryLabel={cat.label} cityName={city.name} categorySlug={params.category} citySlug={slug} />
        )}

        {/* Toujours proposer une demande sur mesure, même quand il y a des résultats */}
        {list.length > 0 && (
          <Link
            href={whatsappLink(CONCIERGE, quoteRequestMessage({ categoryLabel: cat.label, city: city.name }))}
            target="_blank"
            onClick={() => createServiceRequest({ categorySlug: params.category, citySlug: slug })}
            className="tap flex items-center gap-3 rounded-2xl border border-dashed border-palier-300 bg-palier-50/60 p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-100">
              <Icon name="Sparkles" className="h-5 w-5 text-palier-600" />
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">Vous ne trouvez pas ?</p>
              <p className="text-[12px] text-ink-soft">Décrivez votre besoin, on trouve le bon prestataire.</p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-palier-600" />
          </Link>
        )}
      </div>

      <CitySheet open={citySheet} onClose={() => setCitySheet(false)} current={slug} currentQuartier={quartier} onPick={setCity} />
    </div>
  );
}

/** Jamais "Aucun prestataire" : on propose une mise en relation. */
function EmptyState({ categoryLabel, cityName, categorySlug, citySlug }: { categoryLabel: string; cityName: string; categorySlug: string; citySlug: string }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-hero shimmer grain relative overflow-hidden p-6 text-center text-white">
        <OrbField tone="cool" parallax={false} />
        <div className="relative z-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <Icon name="Headset" className="h-8 w-8" />
        </div>
        <h2 className="glow-text mt-4 text-[20px] font-bold">Nous trouvons quelqu'un pour vous</h2>
        <p className="mx-auto mt-2 max-w-[18rem] text-[13px] text-white/80">
          Pas encore de prestataire <b>{categoryLabel.toLowerCase()}</b> référencé à {cityName} ?
          Notre équipe vous met en relation avec un pro vérifié sous 24h.
        </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {[
          { icon: "PencilLine", title: "Faire une demande", sub: "Décrivez votre besoin en 30 secondes" },
          { icon: "FileText", title: "Demander un devis gratuit", sub: "Sans engagement, réponse sous 24h" },
        ].map((a) => (
          <Link
            key={a.title}
            href={whatsappLink(CONCIERGE, quoteRequestMessage({ categoryLabel, city: cityName }))}
            target="_blank"
            onClick={() => createServiceRequest({ categorySlug, citySlug })}
            className="tap flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-palier-100">
              <Icon name={a.icon} className="h-5 w-5 text-palier-600" />
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-ink">{a.title}</p>
              <p className="text-[12px] text-ink-soft">{a.sub}</p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-ink-faint" />
          </Link>
        ))}
      </div>
    </div>
  );
}
