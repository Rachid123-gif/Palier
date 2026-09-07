"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      setReady(true);
      return;
    }

    // Detect mobile
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsMobile(mobile);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    setReady(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!ready || isInstalled) return null;

  // Mobile: show install button
  if (isMobile) {
    const handleInstall = async () => {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setIsInstalled(true);
        setDeferredPrompt(null);
      } else if (isIos) {
        setShowIosGuide(true);
      }
    };

    // Mobile but no prompt available and not iOS — hide
    if (!deferredPrompt && !isIos) return null;

    return (
      <>
        <button
          onClick={handleInstall}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#0B7A57] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-[#096b4b] hover:shadow-xl sm:text-[16px]"
        >
          <Icon name="Download" className="h-5 w-5" />
          Installer l&apos;application
        </button>

        {showIosGuide && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setShowIosGuide(false)}>
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-[#111815]">Installer Palier</h3>
                <button onClick={() => setShowIosGuide(false)} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f4f5f2]">
                  <Icon name="X" className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B7A57] text-[13px] font-bold text-white">1</span>
                  <p className="text-[14px] text-[#374151]">
                    Appuyez sur le bouton <strong>Partager</strong>{" "}
                    <Icon name="Share" className="inline h-4 w-4 text-[#0B7A57]" /> en bas de l&apos;écran
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B7A57] text-[13px] font-bold text-white">2</span>
                  <p className="text-[14px] text-[#374151]">
                    Faites défiler et appuyez sur <strong>« Sur l&apos;écran d&apos;accueil »</strong>{" "}
                    <Icon name="Plus" className="inline h-4 w-4 text-[#0B7A57]" />
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B7A57] text-[13px] font-bold text-white">3</span>
                  <p className="text-[14px] text-[#374151]">
                    Appuyez sur <strong>« Ajouter »</strong> en haut à droite
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="mt-6 w-full rounded-full bg-[#0B7A57] py-3 text-[14px] font-semibold text-white"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: clear note to use mobile
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[#0B7A57]/20 bg-[#0B7A57]/[0.07] px-6 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B7A57]/15">
        <Icon name="Smartphone" className="h-5 w-5 text-[#0B7A57]" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#111815]">Disponible sur mobile</p>
        <p className="text-[13px] text-[#374151]">Visitez ce site depuis votre téléphone pour installer l&apos;application</p>
      </div>
    </div>
  );
}
