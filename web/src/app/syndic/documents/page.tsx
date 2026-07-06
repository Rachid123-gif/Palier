import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { DocumentsView } from "./DocumentsView";

export default async function SyndicDocuments() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <DocumentsView documents={d.documents} buildingId={d.building.id} />;
}
