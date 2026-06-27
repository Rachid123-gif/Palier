"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("palier_onboarded");
    if (!onboarded && pathname !== "/bienvenue") {
      router.replace("/bienvenue");
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
