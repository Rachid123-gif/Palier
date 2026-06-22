import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";

export default async function SyndicResidents() {
  const d = await fetchSyndicData();
  const rows = [...d.residents].sort((a, b) => a.unit.localeCompare(b.unit));
  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Résidents & lots"
        subtitle={`${d.kpis.lots} lots · ${d.kpis.residents} résidents`}
        action={
          <button className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="UserPlus" className="h-4 w-4" /> Ajouter un résident
          </button>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Lot</th>
              <th className="px-4 py-3 font-semibold">Résident</th>
              <th className="px-4 py-3 font-semibold">Rôle</th>
              <th className="px-4 py-3 font-semibold">Téléphone</th>
              <th className="px-4 py-3 text-right font-semibold">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((r) => (
              <tr key={r.id} className="text-[13.5px] hover:bg-[#faf8f3]">
                <td className="px-4 py-3 font-semibold text-ink">{r.unit}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: r.avatarColor }}>
                      {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="font-medium text-ink">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.role === "tenant" ? "bg-info-soft text-info" : "bg-palier-100 text-palier-700"}`}>
                    {r.role === "tenant" ? "Locataire" : "Propriétaire"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-ink"><Icon name="Phone" className="h-4 w-4" /></a>
                    <a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener" className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white"><Icon name="MessageCircle" className="h-4 w-4" /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
