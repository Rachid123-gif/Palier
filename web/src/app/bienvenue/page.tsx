"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { StatusBar } from "@/components/resident/StatusBar";
import { validateAccessCode } from "@/lib/actions";

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
    codeDescResident: "Entrez le code communiqué par votre syndic pour accéder à votre résidence.",
    codeDescSyndic: "Entrez le code d'activation reçu lors de votre inscription sur Palier.",
    codePlaceholder: "",
    codeErrorResident: "Code incorrect. Vérifiez auprès de votre syndic.",
    codeErrorSyndic: "Code incorrect. Vérifiez dans votre email d'inscription.",
    codeInfoResident: "Ce code est unique à votre résidence. Demandez-le à votre syndic.",
    codeInfoSyndic: "Ce code vous a été envoyé par Palier lors de la création de votre espace.",
    syndicWebNote: "Pour plus de confort, vous pouvez aussi accéder à votre espace syndic depuis un ordinateur sur ",
    codeBtn: "Valider le code",
    roleTitle: "Vous êtes…",
    roleDesc: "Sélectionnez votre profil pour accéder à l'espace adapté.",
    roleResident: "Résident",
    roleResidentDesc: "Suivez vos charges, la vie de l'immeuble et trouvez des services.",
    roleSyndic: "Syndic",
    roleSyndicDesc: "Gérez la copropriété, le recouvrement et les incidents.",
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
    codeDescResident: "أدخل الرمز الذي أعطاك إياه السنديك للوصول إلى إقامتك.",
    codeDescSyndic: "أدخل رمز التفعيل الذي توصلت به عند تسجيلك في بالييه.",
    codePlaceholder: "",
    codeErrorResident: "رمز غير صحيح. تحقق من السنديك.",
    codeErrorSyndic: "رمز غير صحيح. تحقق من بريدك الإلكتروني.",
    codeInfoResident: "هذا الرمز خاص بإقامتك. اطلبه من السنديك.",
    codeInfoSyndic: "هذا الرمز أُرسل إليك من بالييه عند إنشاء مساحتك.",
    syndicWebNote: "لمزيد من الراحة، يمكنك أيضاً الوصول إلى مساحة السنديك من الكمبيوتر على ",
    codeBtn: "تأكيد الرمز",
    roleTitle: "أنت…",
    roleDesc: "اختر ملفك الشخصي للوصول إلى المساحة المناسبة.",
    roleResident: "ساكن",
    roleResidentDesc: "تابع مصاريفك، حياة العمارة، واعثر على خدمات.",
    roleSyndic: "سنديك",
    roleSyndicDesc: "سيّر الملكية المشتركة، التحصيل والحوادث.",
  },
};

const slideColors = ["bg-palier-600", "bg-[#c5604f]", "bg-[#d9961f]"];

type Step = "lang" | "welcome" | "role" | "code";

export default function BienvenuePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [step, setStep] = useState<Step>("lang");
  const [slide, setSlide] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const i = t[lang];
  const isAr = lang === "ar";

  const [role, setRole] = useState<"resident" | "syndic" | null>(null);

  function nextSlide() {
    if (slide < i.slides.length - 1) setSlide(slide + 1);
    else setStep("role");
  }

  function pickRole(r: "resident" | "syndic") {
    setRole(r);
    setStep("code");
  }

  const [validating, setValidating] = useState(false);

  async function validateCode() {
    if (!code.trim()) return;
    setValidating(true);
    setCodeError("");

    try {
      const result = await validateAccessCode(code.trim().toUpperCase(), role ?? "resident");

      if (result.valid) {
        localStorage.setItem("palier_onboarded", "1");
        localStorage.setItem("palier_lang", lang);
        localStorage.setItem("palier_role", result.role!);
        if (result.buildingId) localStorage.setItem("palier_building_id", result.buildingId);
        router.push(result.role === "syndic" ? "/syndic" : "/");
      } else {
        const errorMessages: Record<string, string> = lang === "fr" ? {
          code_not_found: "Code introuvable. Vérifiez le code et réessayez.",
          code_already_used: "Ce code a déjà été utilisé.",
          wrong_role: role === "syndic"
            ? "Ce code est réservé aux résidents. Utilisez votre code syndic."
            : "Ce code est réservé au syndic. Demandez un code résident à votre syndic.",
        } : {
          code_not_found: "الرمز غير موجود. تحقق من الرمز وأعد المحاولة.",
          code_already_used: "هذا الرمز تم استخدامه من قبل.",
          wrong_role: role === "syndic"
            ? "هذا الرمز مخصص للسكان. استخدم رمز السنديك الخاص بك."
            : "هذا الرمز مخصص للسنديك. اطلب رمز ساكن من السنديك.",
        };
        setCodeError(errorMessages[result.error!] ?? (role === "syndic" ? i.codeErrorSyndic : i.codeErrorResident));
      }
    } catch {
      setCodeError(role === "syndic" ? i.codeErrorSyndic : i.codeErrorResident);
    } finally {
      setValidating(false);
    }
  }

  // Bouton de langue (coin haut droit)
  const langBtn = (
    <button
      onClick={() => { setLang(i.langSwitch); setCodeError(""); }}
      className="tap flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-soft shadow-sm"
    >
      <Icon name="Globe" className="h-3.5 w-3.5" />
      {lang === "fr" ? <span style={{ fontFamily: "var(--font-cairo), sans-serif" }}>{i.langLabel}</span> : i.langLabel}
    </button>
  );

  // ─── LANGUAGE SELECTION ─────────────────────────────────
  if (step === "lang") {
    return (
      <div className="flex h-full flex-col">
        <StatusBar />

        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <LogoMark size={56} />
          <Wordmark className="mt-3" />

          <p className="mt-8 text-center text-[15px] text-ink-soft">
            Choisissez votre langue · <span style={{ fontFamily: "var(--font-cairo), sans-serif" }}>اختر لغتك</span>
          </p>

          <div className="mt-6 w-full max-w-[20rem] space-y-3">
            <button
              onClick={() => { setLang("fr"); setStep("welcome"); }}
              className="tap flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 text-start shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-palier-50">
                <Icon name="Languages" className="h-6 w-6 text-palier-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-ink">Français</p>
                <p className="text-[12px] text-ink-soft">Continuer en français</p>
              </div>
              <Icon name="ChevronRight" className="h-5 w-5 text-ink-faint" />
            </button>

            <button
              onClick={() => { setLang("ar"); setStep("welcome"); }}
              className="tap flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 text-end shadow-card"
              dir="rtl"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-palier-50">
                <Icon name="Languages" className="h-6 w-6 text-palier-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-cairo), sans-serif" }}>العربية</p>
                <p className="text-[12px] text-ink-soft" style={{ fontFamily: "var(--font-cairo), sans-serif" }}>المتابعة بالعربية</p>
              </div>
              <Icon name="ChevronLeft" className="h-5 w-5 text-ink-faint" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => setStep("role")}
              className="tap mt-3 w-full py-2 text-center text-[13px] font-semibold text-ink-faint"
            >
              {i.skip}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── CODE D'ACCÈS ────────────────────────────────────────
  if (step === "code") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          <button onClick={() => setStep("role")} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
            <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
          </button>
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="KeyRound" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.codeTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{role === "syndic" ? i.codeDescSyndic : i.codeDescResident}</p>

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
                <Icon name="CircleAlert" className="h-4 w-4" /> {codeError}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-palier-50 px-4 py-3">
            <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-palier-600" />
            <p className="text-[12px] leading-snug text-palier-800">{role === "syndic" ? i.codeInfoSyndic : i.codeInfoResident}</p>
          </div>

          {role === "syndic" && (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-sand/60 px-4 py-3">
              <Icon name="Monitor" className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
              <p className="text-[12px] leading-snug text-ink-soft">{i.syndicWebNote}<a href="https://palier.ma" target="_blank" rel="noopener" className="font-semibold text-palier-600 underline">palier.ma</a></p>
            </div>
          )}
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={validateCode}
            disabled={!code.trim() || validating}
            className={`tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white ${!code.trim() || validating ? "opacity-50" : ""}`}
          >
            {validating ? <><Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" /> </> : null}{i.codeBtn}
          </button>
        </div>
      </div>
    );
  }

  // ─── SÉLECTION DU RÔLE ──────────────────────────────────
  if (step === "role") {
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
            <Icon name="Users" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.roleTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{i.roleDesc}</p>

          <div className="mt-8 space-y-3">
            {/* Résident */}
            <button
              onClick={() => pickRole("resident")}
              className="tap flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 text-start shadow-card"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-palier-100">
                <Icon name="Building2" className="h-7 w-7 text-palier-600" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-ink">{i.roleResident}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{i.roleResidentDesc}</p>
              </div>
              <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-5 w-5 text-ink-faint" />
            </button>

            {/* Syndic */}
            <button
              onClick={() => pickRole("syndic")}
              className="tap flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 text-start shadow-card"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fbf0d8]">
                <Icon name="ShieldCheck" className="h-7 w-7 text-[#d9961f]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-ink">{i.roleSyndic}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{i.roleSyndicDesc}</p>
              </div>
              <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-5 w-5 text-ink-faint" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
