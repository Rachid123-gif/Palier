"use client";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Badge, Rating } from "@/components/ui/primitives";
import { mad } from "@/lib/format";
import { telLink, whatsappLink, contactMessage } from "@/lib/whatsapp";
import { useData } from "@/lib/DataProvider";
import type { Provider } from "@/lib/types";

export function ProviderCard({
  p, categoryLabel,
}: {
  p: Provider;
  categoryLabel: string;
}) {
  const { currentUser } = useData();
  const wa = whatsappLink(
    p.whatsapp,
    contactMessage({
      providerName: p.name, serviceLabel: categoryLabel,
      city: currentUser.cityName, building: currentUser.building, userName: currentUser.name,
    }),
  );

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar {...p.avatar} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[15px] font-bold text-ink">{p.name}</h3>
            {p.topNeighbor && <Badge tone="gold" icon="Crown">Top voisins</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Rating value={p.rating} reviews={p.reviews} />
            <span className="text-ink-faint">·</span>
            <span className="text-[12px] text-ink-soft">{p.district}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{p.bio}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[13px] text-ink-soft">
          À partir de <b className="text-[15px] text-ink">{mad(p.basePrice, { decimals: false })}</b>
        </p>
        {p.availableToday && <Badge tone="brand" icon="Clock">Dispo</Badge>}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={telLink(p.phone)} className="tap flex items-center justify-center gap-1.5 rounded-full bg-sand py-2.5 text-[13px] font-semibold text-ink">
          <Icon name="Phone" className="h-4 w-4" /> Appeler
        </a>
        <a href={wa} target="_blank" rel="noopener" className="tap flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2.5 text-[13px] font-semibold text-white">
          <Icon name="MessageCircle" className="h-4 w-4" /> WhatsApp
        </a>
        <Link
          href={`/services/prestataire/${p.id}`}
          className="tap flex items-center justify-center gap-1.5 rounded-full bg-palier-600 py-2.5 text-[13px] font-semibold text-white"
        >
          Voir
        </Link>
      </div>
    </div>
  );
}
