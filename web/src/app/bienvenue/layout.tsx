export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-cream">
      <div className="no-scrollbar min-h-dvh w-full sm:max-w-[480px] sm:py-10">{children}</div>
    </div>
  );
}
