"use client";
import { useEffect, useRef } from "react";

type Tone = "cool" | "warm";

const palettes: Record<Tone, { a: string; b: string; c: string }> = {
  cool: { a: "rgba(255,255,255,0.16)", b: "rgba(138,154,78,0.30)", c: "rgba(113,179,160,0.22)" },
  warm: { a: "rgba(255,255,255,0.14)", b: "rgba(217,125,111,0.34)", c: "rgba(224,168,46,0.20)" },
};

/**
 * Fond "vivant" des cartes héros — 3 couches de profondeur :
 *   arrière : grandes sphères floues + halos
 *   inter.  : orbs translucides en rotation lente + watermark Palier
 *   avant   : (le contenu de la carte, au-dessus via z-10)
 * Mouvement infini (CSS/GPU), parallax ≤ 8px au scroll.
 */
export function OrbField({
  tone = "cool", parallax = true, watermark = true,
}: {
  tone?: Tone;
  parallax?: boolean;
  watermark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = palettes[tone];

  useEffect(() => {
    if (!parallax) return;
    const el = ref.current;
    if (!el) return;
    let sc: HTMLElement | null = el.parentElement;
    while (sc && sc.scrollHeight <= sc.clientHeight) sc = sc.parentElement;
    const scroller: HTMLElement | Window = sc ?? window;
    let raf = 0;
    const read = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = read();
        el.style.setProperty("--py", String(Math.max(-8, Math.min(8, y * 0.04))));
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll as EventListener);
      cancelAnimationFrame(raf);
    };
  }, [parallax]);

  return (
    <div ref={ref} className="orb-layer" aria-hidden>
      {/* Constellation en rotation lente */}
      <div className="orb-rotor">
        <div className="orb-par" style={{ top: "-30%", right: "-15%", ["--py" as string]: "0" }}>
          <span className="orb orb-blur-lg orb-a" style={{ width: 300, height: 300, background: p.a, transform: "translateY(calc(var(--py,0) * 1.2px))" }} />
        </div>
        <div className="orb-par" style={{ bottom: "-25%", left: "-10%" }}>
          <span className="orb orb-blur-lg orb-b" style={{ width: 200, height: 200, background: p.b, transform: "translateY(calc(var(--py,0) * 0.7px))" }} />
        </div>
        <div className="orb-par" style={{ top: "35%", right: "18%" }}>
          <span className="orb orb-blur-md orb-c" style={{ width: 150, height: 150, background: p.c, transform: "translateY(calc(var(--py,0) * 0.4px))" }} />
        </div>
      </div>

      {/* Watermark logo Palier — couche intermédiaire, très discret */}
      {watermark && (
        <svg className="watermark" style={{ top: "-18px", right: "-10px", width: 150, height: 150 }} viewBox="0 0 48 48" fill="none">
          <path
            d="M16 38V12a1 1 0 0 1 1-1h10a8.5 8.5 0 0 1 0 17H21"
            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
