export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="no-scrollbar h-full">{children}</div>
    </div>
  );
}
