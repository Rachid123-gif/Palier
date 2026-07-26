import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-50">
        <svg className="h-8 w-8 text-palier-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <h1 className="mt-4 text-[20px] font-bold text-ink">Page introuvable</h1>
      <p className="mt-2 max-w-xs text-[14px] text-ink-soft">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-palier-600 px-6 py-2.5 text-[14px] font-semibold text-white"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
