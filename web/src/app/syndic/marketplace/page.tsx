import { supabase, DEMO_BUILDING_ID } from "@/lib/supabase";
import { PageHeader, KpiCard, Card } from "@/components/syndic/ui";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/primitives";
import { mad, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SyndicMarketplace() {
  const [provRes, bookRes, reqRes] = await Promise.all([
    supabase.from("providers").select("*").eq("active", true).order("rating", { ascending: false }),
    supabase.from("bookings").select("*").eq("building_id", DEMO_BUILDING_ID).order("created_at", { ascending: false }).limit(8),
    supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(8),
  ]);
  const providers = provRes.data ?? [];
  const bookings = bookRes.data ?? [];
  const requests = reqRes.data ?? [];

  return (
    <div>
      <PageHeader title="Marketplace" subtitle="Prestataires, réservations et demandes" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Prestataires actifs" value={`${providers.length}`} />
        <KpiCard label="Réservations" value={`${bookings.length}`} />
        <KpiCard label="Demandes de devis" value={`${requests.length}`} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Prestataires</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {providers.slice(0, 8).map((p: { id: string; name: string; district: string; rating: number; base_price: number; avatar_from: string; avatar_to: string; avatar_initials: string }) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-black/[0.06] p-3">
                <Avatar from={p.avatar_from} to={p.avatar_to} initials={p.avatar_initials} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-soft"><Rating value={Number(p.rating)} /> · {p.district}</div>
                </div>
                <p className="text-[12px] font-medium text-ink">{mad(Number(p.base_price), { decimals: false })}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Activité récente</h2>
          {bookings.length === 0 && requests.length === 0 && (
            <p className="py-6 text-center text-[12px] text-ink-soft">Aucune activité</p>
          )}
          <div className="space-y-2.5">
            {bookings.map((b: { id: string; category_slug: string; when_type: string; created_at: string }) => (
              <div key={b.id} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50"><Icon name="Calendar" className="h-3.5 w-3.5 text-blue-600" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">Réservation · {b.category_slug}</p>
                  <p className="text-[11px] text-ink-soft">{b.when_type} · {timeAgo(b.created_at)}</p>
                </div>
              </div>
            ))}
            {requests.map((r: { id: string; category_slug: string; city_slug: string; created_at: string }) => (
              <div key={r.id} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50"><Icon name="FileText" className="h-3.5 w-3.5 text-amber-600" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">Devis · {r.category_slug}</p>
                  <p className="text-[11px] text-ink-soft">{r.city_slug} · {timeAgo(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
