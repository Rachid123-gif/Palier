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
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader title="Marketplace" subtitle="Prestataires vérifiés, réservations et demandes des résidents" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard icon="Store" label="Prestataires actifs" value={`${providers.length}`} tint="bg-palier-100" color="text-palier-600" />
        <KpiCard icon="CalendarCheck" label="Réservations" value={`${bookings.length}`} tint="bg-info-soft" color="text-info" />
        <KpiCard icon="FileQuestion" label="Demandes de devis" value={`${requests.length}`} tint="bg-warning-soft" color="text-warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-[16px] font-bold text-ink">Prestataires référencés</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {providers.slice(0, 8).map((p: { id: string; name: string; district: string; city_slug: string; rating: number; reviews: number; base_price: number; avatar_from: string; avatar_to: string; avatar_initials: string; verified: boolean }) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#faf8f3] p-3">
                <Avatar from={p.avatar_from} to={p.avatar_to} initials={p.avatar_initials} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink">{p.name}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-soft"><Rating value={Number(p.rating)} /> · {p.district}</div>
                </div>
                <p className="text-[12px] font-semibold text-palier-700">{mad(Number(p.base_price), { decimals: false })}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[16px] font-bold text-ink">Activité récente</h2>
          {bookings.length === 0 && requests.length === 0 && (
            <p className="py-6 text-center text-[12px] text-ink-faint">Aucune activité pour le moment</p>
          )}
          <div className="space-y-2.5">
            {bookings.map((b: { id: string; category_slug: string; when_type: string; created_at: string }) => (
              <div key={b.id} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-info-soft"><Icon name="CalendarCheck" className="h-4 w-4 text-info" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">Réservation · {b.category_slug}</p>
                  <p className="text-[11px] text-ink-faint">{b.when_type} · {timeAgo(b.created_at)}</p>
                </div>
              </div>
            ))}
            {requests.map((r: { id: string; category_slug: string; city_slug: string; created_at: string }) => (
              <div key={r.id} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-soft"><Icon name="FileQuestion" className="h-4 w-4 text-warning" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">Devis · {r.category_slug}</p>
                  <p className="text-[11px] text-ink-faint">{r.city_slug} · {timeAgo(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
