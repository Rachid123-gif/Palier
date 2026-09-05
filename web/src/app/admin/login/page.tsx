"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, adminVerifyOtp } from "@/lib/admin-auth";
import { LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"secret" | "otp">("secret");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // OTP countdown (3 min)
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("palier_admin_theme");
    if (saved === "light") setIsDark(false);
  }, []);

  useEffect(() => {
    if (!otpSentAt) { setCountdown(null); return; }
    function tick() {
      const remaining = 180 - Math.floor((Date.now() - otpSentAt!) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [otpSentAt]);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("palier_admin_theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim() || loading) return;
    setLoading(true);
    setError("");
    const res = await adminLogin(secret);
    if (res.ok) {
      setOtpSentAt(Date.now());
      setStep("otp");
    } else {
      const msgs: Record<string, string> = {
        not_configured: "Dashboard admin non configuré",
        too_many_attempts: "Trop de tentatives. Réessayez plus tard.",
        sms_failed: "Impossible d'envoyer le SMS. Réessayez.",
      };
      setError(msgs[res.error] ?? "Clé incorrecte");
    }
    setLoading(false);
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || loading) return;
    setLoading(true);
    setError("");
    const res = await adminVerifyOtp(otp);
    if (res.ok) {
      router.push("/admin");
    } else {
      const msgs: Record<string, string> = {
        otp_invalid: "Code incorrect",
        otp_expired: "Code expiré. Recommencez.",
        too_many_attempts: "Trop de tentatives. Recommencez.",
      };
      setError(msgs[res.error] ?? "Erreur de vérification");
      if (res.error === "otp_expired" || res.error === "too_many_attempts") {
        setTimeout(() => { setStep("secret"); setSecret(""); setOtp(""); setError(""); }, 2000);
      }
    }
    setLoading(false);
  }

  const inputCls = `w-full rounded-xl border px-4 py-3 text-[14px] outline-none focus:border-[var(--a-text-3)] ${
    isDark
      ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
      : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
  }`;

  return (
    <div className={`flex min-h-dvh items-center justify-center px-6 ${isDark ? "bg-[#0f1a17]" : "bg-[#f4f5f2]"}`}>
      <button
        onClick={toggleTheme}
        className={`absolute right-4 top-4 rounded-xl p-2 transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}`}
      >
        <Icon name={isDark ? "Sun" : "Moon"} className="h-5 w-5" />
      </button>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <h1 className={`text-[22px] font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Palier Admin</h1>
          <p className={`text-[13px] ${isDark ? "text-white/50" : "text-gray-500"}`}>
            {step === "secret" ? "Dashboard de gestion de la plateforme" : "Code de vérification envoyé par SMS"}
          </p>
        </div>

        {step === "secret" ? (
          <form onSubmit={handleSecret} className="space-y-4">
            <div>
              <input
                type="password"
                value={secret}
                onChange={(e) => { setSecret(e.target.value); setError(""); }}
                placeholder="Clé d'accès admin"
                autoFocus
                className={inputCls}
              />
              {error && <p className="mt-2 text-[13px] font-medium text-red-400">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={!secret.trim() || loading}
              className={`w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-colors disabled:opacity-50 ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-gray-900 hover:bg-gray-800"}`}
            >
              {loading ? "Vérification…" : "Continuer"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="000000"
                autoFocus
                className={`${inputCls} text-center text-[24px] font-bold tracking-[0.3em] placeholder:text-[18px] placeholder:font-normal placeholder:tracking-[0.3em]`}
              />
              {error && <p className="mt-2 text-[13px] font-medium text-red-400">{error}</p>}
              {countdown !== null && countdown > 0 && (
                <p className={`mt-2 text-center text-[12px] ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  Expire dans {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className={`w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-colors disabled:opacity-50 ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-gray-900 hover:bg-gray-800"}`}
            >
              {loading ? "Vérification…" : "Accéder au dashboard"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("secret"); setSecret(""); setOtp(""); setError(""); }}
              className={`w-full py-2 text-[13px] font-medium ${isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}
            >
              Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
