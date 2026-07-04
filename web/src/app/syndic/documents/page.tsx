import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { fetchSyndicData } from "@/lib/syndic";
import { shortDate } from "@/lib/format";

export default async function SyndicDocuments() {
  const d = await fetchSyndicData();

  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Documents"
        subtitle="Coffre-fort partagé avec les résidents"
        action={
          <button className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="Upload" className="h-4 w-4" /> Téléverser
          </button>
        }
      />
      <Card>
        {d.documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {d.documents.map((doc) => (
              <button key={doc.id} className="tap flex items-center gap-3 rounded-xl border border-black/5 bg-[#faf8f3] p-3 text-left">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${doc.tint}`}><Icon name="FileText" className={`h-5 w-5 ${doc.color}`} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink">{doc.title}</p>
                  <p className="text-[12px] text-ink-faint">{doc.type} · {shortDate(doc.date)}{doc.size ? ` · ${doc.size}` : ""}</p>
                </div>
                <Icon name="Download" className="h-5 w-5 text-palier-600" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <Icon name="FolderOpen" className="h-5 w-5 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">Aucun document pour le moment. Téléversez vos premiers documents.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
