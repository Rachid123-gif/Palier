"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes server data when the user returns to the tab/app. */
export function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    window.addEventListener("focus", () => router.refresh());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", () => router.refresh());
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
