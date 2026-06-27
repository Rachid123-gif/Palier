"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { StatusBar } from "@/components/resident/StatusBar";

const DEMO_CODE = "PALIER2026";

type Lang = "fr" | "ar";

const t = {
  fr: {
    langLabel: "العربية",
    langSwitch: "ar" as Lang,
    slides: [
      {
        icon: "Building2",
        title: "Votre immeuble,\nsimplifié.",
        desc: "Charges, transparence financière, documents. Tout accessible en un coup d'œil.",
      },
      {
        icon: "Users",
        title: "Vos voisins,\nconnectés.",
        desc: "Annonces, entraide, événements. Restez informé de la vie de votre immeuble.",
      },
      {
        icon: "Wrench",
        title: "Des services,\nà portée de main.",
        desc: "Trouvez un plombier, une femme de ménage ou un électricien près de chez vous.",
      },
    ],
    next: "Suivant",
    start: "Commencer",
    skip: "Passer l'introduction",
    codeTitle: "Code d'accès",
    codeDesc: "Entrez le code communiqué par votre syndic pour accéder à votre résidence.",
    codePlaceholder: "",
    codeError: "Code incorrect. Vérifiez auprès de votre syndic.",
    codeInfo: "Ce code est unique à votre résidence. Demandez-le à votre syndic.",
    codeBtn: "Valider le code",
    doneTitle: "Bienvenue",
    doneDesc: "Votre espace résident est prêt.",
  },
  ar: {
    langLabel: "Français",
    langSwitch: "fr" as Lang,
    slides: [
      {
        icon: "Building2",
        title: "عمارتك،\nببساطة.",
        desc: "المصاريف، الشفافية المالية، الوثائق. كل شيء في متناول يدك.",
      },
      {
        icon: "Users",
        title: "جيرانك،\nمتصلون.",
        desc: "إعلانات، تعاون، أحداث. ابق على اطلاع بحياة عمارتك.",
      },
      {
        icon: "Wrench",
        title: "خدمات\nفي متناولك.",
        desc: "ابحث عن سباك، عاملة نظافة أو كهربائي قريب منك.",
      },
    ],
    next: "التالي",
    start: "ابدأ",
    skip: "تخطي المقدمة",
    codeTitle: "رمز الدخول",
    codeDesc: "أدخل الرمز الذي أعطاك إياه السنديك للوصول إلى إقامتك.",
    codePlaceholder: "",
    codeError: "رمز غير صحيح. تحقق من السنديك.",
    codeInfo: "هذا الرمز خاص بإقامتك. اطلبه من السنديك.",
    codeBtn: "تأكيد الرمز",
    doneTitle: "مرحبا",
    doneDesc: "مساحتك كساكن جاهزة.",
  },
};

const slideColors = ["bg-palier-600", "bg-[#c5604f]", "bg-[#d9961f]"];

type Step = "welcome" | "code" | "done";

export default function BienvenuePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [step, setStep] = useState<Step>("welcome");
  const [slide, setSlide] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const i = t[lang];
  const isAr = lang === "ar";

  function nextSlide() {
    if (slide < i.slides.length - 1) setSlide(slide + 1);
    else setStep("code");
  }

  function validateCode() {
    if (code.trim().toUpperCase() === DEMO_CODE) {
      setCodeError("");
      localStorage.setItem("palier_onboarded", "1");
      localStorage.setItem("palier_lang", lang);
      setStep("done");
      setTimeout(() => router.push("/"), 1500);
    } else {
      setCodeError(i.codeError);
    }
  }

  // Bouton de langue (coin haut droit)
  const langBtn = (
    <button
      onClick={() => { setLang(i.langSwitch); setCodeError(""); }}
      className="tap flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-soft shadow-sm"
    >
      <Icon name="Globe" className="h-3.5 w-3.5" />
      {i.langLabel}
    </button>
  );

  // ─── WELCOME SLIDES ──────────────────────────────────────
  if (step === "welcome") {
    const s = i.slides[slide];
    return (
      <div className={`flex h-full flex-col ${isAr ? "direction-rtl" : ""}`} dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        {/* Top bar : logo + langue */}
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-2">
            <LogoMark size={36} />
            <Wordmark />
          </div>
          {langBtn}
        </div>

        {/* Slide */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${slideColors[slide]} text-white shadow-lg`}>
            <Icon name={s.icon} className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <h1 className="mt-7 whitespace-pre-line text-[26px] font-bold leading-tight tracking-tight text-ink">
            {s.title}
          </h1>
          <p className="mt-3 max-w-[18rem] text-[14px] leading-relaxed text-ink-soft">
            {s.desc}
          </p>
        </div>

        {/* Bottom */}
        <div className="px-6 pb-10">
          <div className="mb-6 flex items-center justify-center gap-2">
            {i.slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`h-2 rounded-full transition-all ${idx === slide ? "w-6 bg-palier-600" : "w-2 bg-ink-faint/30"}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white"
          >
            {slide < i.slides.length - 1 ? i.next : i.start}
            <Icon name={isAr ? "ArrowLeft" : "ArrowRight"} className="h-4.5 w-4.5" />
          </button>

          {slide === 0 && (
            <button
              onClick={() => setStep("code")}
              className="tap mt-3 w-full py-2 text-center text-[13px] font-semibold text-ink-faint"
            >
              {i.skip}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── CODE IMMEUBLE ────────────────────────────────────────
  if (step === "code") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          <button onClick={() => { setStep("welcome"); setSlide(i.slides.length - 1); }} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
            <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
          </button>
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="KeyRound" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.codeTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{i.codeDesc}</p>

          <div className="mt-6">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
              placeholder={i.codePlaceholder}
              autoFocus
              dir="ltr"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-center text-[18px] font-bold tracking-[0.15em] text-ink outline-none placeholder:text-[14px] placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus:border-palier-400"
            />
            {codeError && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-red-500">
                <Icon name="AlertCircle" className="h-4 w-4" /> {codeError}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-palier-50 px-4 py-3">
            <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
            <p className="text-[12px] leading-snug text-palier-800">{i.codeInfo}</p>
          </div>
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={validateCode}
            disabled={!code.trim()}
            className={`tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white ${!code.trim() ? "opacity-50" : ""}`}
          >
            {i.codeBtn}
          </button>
        </div>
      </div>
    );
  }

  // ─── DONE ─────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center" dir={isAr ? "rtl" : "ltr"}>
      <StatusBar />
      <LogoMark size={64} />
      <h1 className="mt-6 text-[24px] font-bold tracking-tight text-ink">
        {i.doneTitle} !
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">{i.doneDesc}</p>
    </div>
  );
}
