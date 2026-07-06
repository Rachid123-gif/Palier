"use client";

/**
 * OnboardingGuard is now a passthrough — route protection is handled by middleware.ts.
 * Kept as a wrapper for backwards compatibility.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
