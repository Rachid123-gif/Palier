export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-cream">
      <div className="no-scrollbar h-full w-full sm:max-w-[480px]">{children}</div>
    </div>
  );
}
