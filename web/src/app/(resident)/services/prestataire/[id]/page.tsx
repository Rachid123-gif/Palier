"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Badge, Rating } from "@/components/ui/primitives";
import { mad } from "@/lib/format";
import { categoryBySlug } from "@/lib/data";
import { useData } from "@/lib/DataProvider";
import { telLink, whatsappLink, contactMessage } from "@/lib/whatsapp";

export default function ProviderScreen() {
  const params = useParams<{ id: string }>();
  const { providerById, currentUser } = useData();
  const p = providerById(params.id);

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

  const wa = whatsappLink(
    p.whatsapp,
    contactMessage({
      providerName: p.name,
      serviceLabel: cat?.label ?? "Service",
      city: currentUser.cityName,
      building: currentUser.building,
      userName: currentUser.name,
    }),
  );

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href={`/services/${p.categorySlug}`} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Prestataire</h1>
      </header>

      <div className="space-y-5 px-4 pt-1">
        {/* Carte prestataire */}
        <div className="card p-4">
          <div className="flex gap-3.5">
            <Avatar {...p.avatar} size={60} />
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

          {p.availableToday && (
            <div className="mt-3">
              <Badge tone="brand" icon="Clock">Disponible aujourd&apos;hui</Badge>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="card divide-y divide-black/5 p-0">
          {[
            { icon: "Briefcase", label: "Service", value: cat?.label ?? "—" },
            { icon: "MapPin", label: "Zone", value: p.district },
            { icon: "Banknote", label: "Tarif indicatif", value: `dès ${mad(p.basePrice, { decimals: false })}` },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3">
              <Icon name={row.icon} className="h-4 w-4 text-ink-faint" />
              <span className="flex-1 text-[13px] text-ink-soft">{row.label}</span>
              <span className="text-[13px] font-semibold text-ink">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-palier-50 px-4 py-3">
          <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
          <p className="text-[12px] leading-snug text-palier-800">
            Ce prestataire est référencé dans l&apos;annuaire Palier. Contactez-le directement pour convenir des modalités et du tarif.
          </p>
        </div>
      </div>

      {/* CTA : contacter */}
      <div className="safe-bottom sticky bottom-0 mt-5 border-t border-black/5 bg-cream/90 px-4 pb-2 pt-3 backdrop-blur">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telLink(p.phone)}
            className="tap flex items-center justify-center gap-2 rounded-full border border-black/5 bg-white py-3 text-[14px] font-semibold text-ink shadow-card"
          >
            <Icon name="Phone" className="h-4.5 w-4.5" /> Appeler
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            className="tap flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-[14px] font-semibold text-white"
          >
            <Icon name="MessageCircle" className="h-4.5 w-4.5" /> WhatsApp
          </a>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-ink-faint">Contactez directement le prestataire pour votre demande</p>
      </div>
    </div>
  );
}
