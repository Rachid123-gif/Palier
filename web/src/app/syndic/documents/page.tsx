import { fetchSyndicData } from "@/lib/syndic";
import { DocumentsView } from "./DocumentsView";

export default async function SyndicDocuments() {
  const d = await fetchSyndicData();
  return <DocumentsView documents={d.documents} buildingId={d.building.id} />;
}
