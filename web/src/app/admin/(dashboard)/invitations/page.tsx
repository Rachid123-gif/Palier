"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { listBetaInvites } from "@/lib/auth";

interface Invite {
  id: string;
  code: string;
  buildingName: string;
  city: string;
  usedAt: string | null;
  createdAt: string;
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

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

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  const used = invites.filter((i) => i.usedAt).length;
  const unused = invites.filter((i) => !i.usedAt).length;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-[900px] space-y-8">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Invitations</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">Codes beta générés automatiquement lors de l&apos;approbation des demandes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{invites.length}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Total</p>
        </div>
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{unused}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Disponibles</p>
        </div>
        <div className="rounded-2xl border border-[var(--a-border)] p-4 text-center" style={{ background: "var(--a-card)" }}>
          <p className="text-[24px] font-bold text-[var(--a-text)]">{used}</p>
          <p className="text-[12px] text-[var(--a-text-4)]">Utilisés</p>
        </div>
      </div>

      {/* Invites list */}
      <div className="rounded-2xl border border-[var(--a-border)]" style={{ background: "var(--a-card)" }}>
        <div className="border-b border-[var(--a-border)] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[var(--a-text)]">Tous les codes</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--a-border)] border-t-[var(--a-text-3)]" />
          </div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[var(--a-text-5)]">Aucun code généré</div>
        ) : (
          <div className="divide-y divide-[var(--a-border-2)]">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--a-tag)]">
                  <Icon
                    name={inv.usedAt ? "UserCheck" : "Ticket"}
                    className={`h-4 w-4 ${inv.usedAt ? "text-[var(--a-text-5)]" : "text-[var(--a-text-3)]"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[14px] font-bold tracking-wide text-[var(--a-text)]">
                    {inv.code}
                  </p>
                  <p className="text-[11px] text-[var(--a-text-5)]">
                    {inv.buildingName && inv.city
                      ? `${inv.buildingName}, ${inv.city}`
                      : inv.buildingName || inv.city || "—"}
                    <span className="ml-2">· {fmtDate(inv.createdAt)}</span>
                    {inv.usedAt && <span className="ml-2">· Utilisé le {fmtDate(inv.usedAt)}</span>}
                  </p>
                </div>
                {!inv.usedAt ? (
                  <button
                    onClick={() => copyCode(inv.code)}
                    className="flex items-center gap-1 rounded-lg bg-[var(--a-input-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--a-text-3)] hover:text-[var(--a-text)]"
                  >
                    <Icon name={copied === inv.code ? "Check" : "Copy"} className="h-3.5 w-3.5" />
                    {copied === inv.code ? "Copié" : "Copier"}
                  </button>
                ) : (
                  <span className="rounded-full bg-[var(--a-tag)] px-2.5 py-1 text-[11px] font-medium text-[var(--a-text-5)]">
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
