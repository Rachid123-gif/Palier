import { BottomNav } from "@/components/resident/BottomNav";
import { OnboardingGuard } from "@/components/resident/OnboardingGuard";
import { DataProvider } from "@/lib/DataProvider";
import { fetchAppData } from "@/lib/queries";

export const dynamic = "force-dynamic";

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
          <OnboardingGuard>
            <div className="no-scrollbar h-full overflow-y-auto pb-24">{children}</div>
            <BottomNav />
          </OnboardingGuard>
        </DataProvider>
      </div>
    </div>
  );
}
