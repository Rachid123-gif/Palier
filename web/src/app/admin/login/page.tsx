"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/admin-auth";
import { LogoMark } from "@/components/brand/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim() || loading) return;
    setLoading(true);
    setError("");
    const res = await adminLogin(secret);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError(res.error === "not_configured" ? "Dashboard admin non configuré" : "Clé incorrecte");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0f1a17] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <h1 className="text-[22px] font-bold text-white">Palier Admin</h1>
          <p className="text-[13px] text-white/50">Dashboard de gestion de la plateforme</p>
        </div>

        <div>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Clé d'accès admin"
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />
          {error && <p className="mt-2 text-[13px] font-medium text-red-400">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!secret.trim() || loading}
          className="w-full rounded-xl bg-emerald-600 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Accéder au dashboard"}
        </button>
      </form>
    </div>
  );
}
