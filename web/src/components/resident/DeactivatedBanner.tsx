"use client";
import { Icon } from "@/components/ui/Icon";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { whatsappLink } from "@/lib/whatsapp";
import { useState } from "react";

export function DeactivatedBanner() {
  const { currentUser, building } = useData();
  const { i } = useLang();
  const d = i.desactive;
  const [expanded, setExpanded] = useState(false);

  if (currentUser.membershipStatus !== "inactive") return null;

  const waUrl = whatsappLink(
    building.syndicPhone,
    d.messageWhatsapp(currentUser.name, building.name),
  );

  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
      {/* Main bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Icon name="AlertTriangle" className="h-4 w-4 text-amber-700" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-amber-900">{d.titre}</p>
          <p className="mt-0.5 text-[12px] text-amber-800">{d.desc}</p>
        </div>
        <Icon
          name={expanded ? "ChevronUp" : "ChevronDown"}
          className="h-4 w-4 shrink-0 text-amber-600"
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-amber-200 px-4 pb-4 pt-3">
          <ul className="space-y-2">
            {d.actions.map((action, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <Icon name="X" className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <span className="text-[12px] text-amber-900">{action}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[12px] text-amber-800">
            {d.erreur}{" "}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              className="font-semibold text-amber-900 underline"
            >
              {d.contacter}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
