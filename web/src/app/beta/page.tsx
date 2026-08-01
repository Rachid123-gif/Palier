"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { validateBetaCode } from "@/lib/auth";

export default function BetaGatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const res = await validateBetaCode(trimmed);
      if (res.ok) {
        router.push("/site");
        router.refresh();
      } else {
        setError("Code invalide. Vérifiez et réessayez.");
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f7f5f0] px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <LogoMark className="h-14 w-14" />
          <Wordmark className="mt-3 h-6" />
        </div>

        {/* Badge */}
        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[12px] font-bold text-amber-800">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            Accès anticipé
          </span>
        </div>

        {/* Description */}
        <p className="mt-5 text-center text-[14px] leading-relaxed text-[#888]">
          La plateforme tout-en-un pour les copropriétés marocaines. Charges, voisinage, services, incidents, transparence financière.
        </p>
        <p className="mt-4 text-center text-[15px] leading-relaxed text-[#3d3d3d]">
          Palier est actuellement en <span className="font-semibold">accès anticipé</span>.
          Entrez votre code d&apos;invitation pour découvrir l&apos;application.
        </p>

        {/* Form */}
        <form onSubmit={submit} className="mt-8 space-y-3">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="CODE D'INVITATION"
              autoFocus
              autoComplete="off"
              className="h-13 w-full rounded-2xl border border-black/[0.08] bg-white px-5 py-4 text-center text-[16px] font-bold tracking-[0.2em] text-[#1a1a1a] outline-none placeholder:text-[13px] placeholder:font-medium placeholder:tracking-[0.15em] placeholder:text-black/25 focus:border-[#1e5b50]/40 focus:ring-2 focus:ring-[#1e5b50]/10"
            />
            {error && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-red-600">
                <Icon name="AlertCircle" className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#1e5b50] text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Accéder à Palier"
            )}
          </button>
        </form>

        {/* Contact */}
        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-5">
          <p className="text-center text-[13px] font-semibold text-[#3d3d3d]">
            Pas encore de code ?
          </p>
          <p className="mt-1.5 text-center text-[12px] leading-relaxed text-[#888]">
            Contactez-nous pour rejoindre le programme d&apos;accès anticipé et être parmi les premiers à utiliser Palier.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="https://wa.me/212600000000?text=Bonjour%2C%20je%20souhaite%20un%20code%20d%27acc%C3%A8s%20%C3%A0%20Palier."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 py-3 text-[13px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            >
              <Icon name="MessageCircle" className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href="mailto:contact@palier.ma?subject=Demande%20de%20code%20d'acc%C3%A8s%20Palier"
              className="flex items-center justify-center gap-2 rounded-xl bg-black/[0.04] py-3 text-[13px] font-semibold text-[#3d3d3d] transition-colors hover:bg-black/[0.08]"
            >
              <Icon name="Mail" className="h-4 w-4" />
              contact@palier.ma
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 pb-6 text-center text-[11px] text-black/25">
          © {new Date().getFullYear()} Palier · Accès anticipé
        </p>
      </div>
    </div>
  );
}
