import { BottomNav } from "@/components/resident/BottomNav";
import { DataProvider } from "@/lib/DataProvider";
import { fetchAppData } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Cadre "téléphone" : plein écran sur mobile, fenêtre centrée premium sur desktop.
 * Les données résident sont récupérées server-side depuis Supabase puis fournies via contexte.
 */
export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await fetchAppData();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e7e1d6] sm:p-6">
      <div className="relative h-dvh w-full overflow-hidden bg-cream sm:h-[860px] sm:max-w-[420px] sm:rounded-[44px] sm:border-[10px] sm:border-black sm:shadow-2xl">
        <DataProvider value={data}>
          <div className="no-scrollbar h-full overflow-y-auto pb-24">{children}</div>
          <BottomNav />
        </DataProvider>
      </div>
    </div>
  );
}
