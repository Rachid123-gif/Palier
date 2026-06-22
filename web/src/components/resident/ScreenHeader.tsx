import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NotificationsBell } from "./NotificationsBell";

/** En-tête de page standard : petit label + grand titre, cloche notifications. */
export function ScreenHeader({
  label, title, bell = true, back,
}: {
  label?: string;
  title: string;
  bell?: boolean;
  back?: string;
}) {
  return (
    <header className="flex items-end justify-between px-5 pb-2 pt-3">
      <div className="flex items-center gap-2">
        {back && (
          <Link href={back} className="tap -ml-1 mr-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-card">
            <Icon name="ChevronLeft" className="h-5 w-5" />
          </Link>
        )}
        <div>
          {label && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
          )}
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        </div>
      </div>
      {bell && <NotificationsBell />}
    </header>
  );
}
