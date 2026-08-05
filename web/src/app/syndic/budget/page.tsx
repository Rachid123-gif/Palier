import { requireSyndicSession } from "@/lib/auth";
import { fetchSyndicData } from "@/lib/syndic";
import { BudgetView } from "./BudgetView";

export default async function BudgetPage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <BudgetView budgets={d.budgets} buildingId={session.buildingId} units={d.units} kpis={d.kpis} building={d.building} />;
}
