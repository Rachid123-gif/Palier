"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { generateBetaInvites, listBetaInvites } from "@/lib/auth";

interface Invite {
  id: string;
  code: string;
  usedAt: string | null;
  createdAt: string;
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBetaInvites();
      setInvites(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateBetaInvites(1);
      await load();
      setFlash("Code généré");
      setTimeout(() => setFlash(""), 2000);
    } finally {
      setGenerating(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  const used = invites.filter((i) => i.usedAt).length;
  const unused = invites.filter((i) => !i.usedAt).length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-[900px] space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white">Invitations</h1>
          <p className="mt-1 text-[13px] text-white/40">Codes d&apos;accès anticipé</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {generating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Icon name="Plus" className="h-4 w-4" />
          )}
          Nouveau code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-4 text-center">
          <p className="text-[24px] font-bold text-white">{invites.length}</p>
          <p className="text-[12px] text-white/40">Total</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-4 text-center">
          <p className="text-[24px] font-bold text-emerald-400">{unused}</p>
          <p className="text-[12px] text-white/40">Disponibles</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111c18] p-4 text-center">
          <p className="text-[24px] font-bold text-amber-400">{used}</p>
          <p className="text-[12px] text-white/40">Utilisés</p>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-[13px] font-medium text-emerald-400">
          <Icon name="Check" className="h-4 w-4" />
          {flash}
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111c18]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-white">Tous les codes</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-emerald-400" />
          </div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-white/30">
            Aucun code généré
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${inv.usedAt ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                  <Icon name={inv.usedAt ? "UserCheck" : "Ticket"} className={`h-4 w-4 ${inv.usedAt ? "text-amber-400" : "text-emerald-400"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[14px] font-bold tracking-wide text-white">{inv.code}</p>
                  <p className="text-[11px] text-white/30">
                    {fmtDate(inv.createdAt)}
                    {inv.usedAt && <span className="ml-2 text-amber-400/60">Utilisé le {fmtDate(inv.usedAt)}</span>}
                  </p>
                </div>
                {!inv.usedAt ? (
                  <button
                    onClick={() => copyCode(inv.code)}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/50 hover:text-white"
                  >
                    <Icon name={copied === inv.code ? "Check" : "Copy"} className="h-3.5 w-3.5" />
                    {copied === inv.code ? "Copié" : "Copier"}
                  </button>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
                    Utilisé
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
