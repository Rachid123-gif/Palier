export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e7e1d6] sm:p-6">
      <div className="relative h-dvh w-full overflow-hidden bg-cream sm:h-[860px] sm:max-w-[420px] sm:rounded-[44px] sm:border-[10px] sm:border-black sm:shadow-2xl">
        <div className="no-scrollbar h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
