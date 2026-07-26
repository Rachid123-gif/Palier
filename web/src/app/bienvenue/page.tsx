"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { StatusBar } from "@/components/resident/StatusBar";
import { loginWithCode, registerSyndic, requestRecoveryOtp, verifyRecoveryOtp } from "@/lib/auth";


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
        title: "Des services\nrecommandés.",
        desc: "Plombier, femme de ménage, électricien… Trouvez les pros que vos voisins recommandent.",
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
    codeInfoResident: "Chaque résident reçoit un code personnel de la part du syndic. En cas d'oubli, contactez votre syndic.",
    codeInfoSyndic: "Utilisez le code reçu lors de la création de votre espace. Vous pouvez le réutiliser à chaque connexion.",
    syndicWebNote: "Pour plus de confort, vous pouvez aussi accéder à votre espace syndic depuis un ordinateur sur ",
    codeBtn: "Valider le code",
    roleTitle: "Vous êtes…",
    roleDesc: "Sélectionnez votre profil pour accéder à l'espace adapté.",
    roleResident: "Résident",
    roleResidentDesc: "Suivez vos charges, la vie de l'immeuble et trouvez des services.",
    roleSyndic: "Syndic",
    roleSyndicDesc: "Gérez la copropriété, le recouvrement et les incidents.",
    // Syndic choice step
    syndicChoiceTitle: "Espace syndic",
    syndicChoiceDesc: "Déjà inscrit ou première visite ?",
    syndicHasCode: "J'ai déjà un compte",
    syndicHasCodeDesc: "Je me connecte avec mon code d'accès.",
    syndicRegister: "C'est ma première fois",
    syndicRegisterDesc: "Je m'inscris pour gérer mon immeuble sur Palier.",
    // Register step
    registerTitle: "Créer votre espace",
    registerDesc: "Remplissez ces informations pour commencer à gérer votre immeuble.",
    registerName: "Votre nom complet",
    registerPhone: "Numéro de téléphone",
    registerBuilding: "Nom de la résidence",
    registerCity: "Ville",
    registerLots: "Nombre d'appartements",
    registerBtn: "Créer mon espace",
    registerError: "Une erreur est survenue. Veuillez réessayer.",
    registerErrorPhone: "Numéro invalide. Format attendu : 06/07/05 suivi de 8 chiffres.",
    registerErrorLots: "Minimum 2 appartements.",
    registerErrorPhoneExists: "Ce numéro est déjà associé à un compte syndic. Utilisez « Code oublié » pour récupérer votre accès.",
    registerLoading: "Création en cours…",
    // Register success step
    successTitle: "Votre espace est prêt !",
    successDesc: "Votre résidence a été créée avec succès. Voici votre code d'accès personnel :",
    successKeep: "Conservez ce code précieusement. Il vous permettra de vous reconnecter.",
    successCopied: "Code copié !",
    successCopy: "Copier le code",
    successContinue: "Accéder à mon espace",
    // Recover step
    recoverLink: "Code oublié ?",
    recoverTitle: "Récupérer mon accès",
    recoverDesc: "Entrez le numéro de téléphone utilisé lors de votre inscription.",
    recoverPhone: "Numéro de téléphone",
    recoverBtn: "Recevoir un code de vérification",
    recoverError: "Aucun compte syndic trouvé avec ce numéro.",
    recoverLoading: "Envoi en cours…",
    // OTP step
    otpTitle: "Code de vérification",
    otpDesc: "Un code à 6 chiffres a été envoyé au ",
    otpPlaceholder: "000000",
    otpBtn: "Vérifier",
    otpError: "Code incorrect. Vérifiez et réessayez.",
    otpExpired: "Code expiré. Veuillez en demander un nouveau.",
    otpLoading: "Vérification…",
    otpResend: "Renvoyer le code",
    // Recover success
    recoverSuccessTitle: "Accès récupéré !",
    recoverSuccessDesc: "Votre nouveau code d'accès :",
    recoverSuccessKeep: "Notez ce code. C'est votre nouveau code de connexion.",
    recoverSuccessContinue: "Accéder à mon espace",
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
        desc: "إعلانات، تعاون، أحداث. ابقَ على اطلاع بحياة عمارتك.",
      },
      {
        icon: "Wrench",
        title: "خدمات\nموصى بها.",
        desc: "سباك، عاملة نظافة، كهربائي… اكتشف المهنيين الذين يوصي بهم جيرانك.",
      },
    ],
    next: "التالي",
    start: "ابدأ",
    skip: "تخطي المقدمة",
    codeTitle: "رمز الدخول",
    codeDescResident: "أدخل الرمز الذي منحك إياه السنديك للوصول إلى إقامتك.",
    codeDescSyndic: "أدخل رمز التفعيل الذي تلقيته عند تسجيلك في بالييه.",
    codePlaceholder: "",
    codeErrorResident: "رمز غير صحيح. تحقق لدى السنديك.",
    codeErrorSyndic: "رمز غير صحيح. تحقق من بريدك الإلكتروني.",
    codeInfoResident: "كل ساكن يتلقى رمزاً خاصاً به من السنديك. في حالة نسيانه، تواصل مع السنديك.",
    codeInfoSyndic: "استخدم الرمز الذي تلقيته عند إنشاء مساحتك. يمكنك إعادة استخدامه في كل مرة.",
    syndicWebNote: "لمزيد من الراحة، يمكنك أيضاً الوصول إلى مساحة السنديك من الحاسوب على ",
    codeBtn: "تأكيد الرمز",
    roleTitle: "أنت…",
    roleDesc: "اختر ملفك الشخصي للوصول إلى المساحة المناسبة.",
    roleResident: "ساكن",
    roleResidentDesc: "تابع مصاريفك، حياة العمارة، واعثر على خدمات.",
    roleSyndic: "سنديك",
    roleSyndicDesc: "أدِر الملكية المشتركة، التحصيل والحوادث.",
    // Syndic choice step
    syndicChoiceTitle: "مساحة السنديك",
    syndicChoiceDesc: "مسجّل أم أول مرة؟",
    syndicHasCode: "لديّ حساب",
    syndicHasCodeDesc: "أدخل برمز الوصول الخاص بي.",
    syndicRegister: "هذه أول مرة",
    syndicRegisterDesc: "أسجّل لإدارة عمارتي على بالييه.",
    // Register step
    registerTitle: "أنشئ مساحتك",
    registerDesc: "املأ هذه المعلومات لبدء إدارة عمارتك.",
    registerName: "الاسم الكامل",
    registerPhone: "رقم الهاتف",
    registerBuilding: "اسم الإقامة",
    registerCity: "المدينة",
    registerLots: "عدد الشقق",
    registerBtn: "إنشاء مساحتي",
    registerError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    registerErrorPhone: "رقم غير صالح. الصيغة المطلوبة: 06/07/05 متبوعاً بـ 8 أرقام.",
    registerErrorLots: "الحد الأدنى شقتان.",
    registerErrorPhoneExists: "هذا الرقم مرتبط بحساب سنديك. استخدم «نسيت الرمز» لاسترجاع وصولك.",
    registerLoading: "جارٍ الإنشاء…",
    // Register success step
    successTitle: "مساحتك جاهزة!",
    successDesc: "تم إنشاء إقامتك بنجاح. إليك رمز الدخول الخاص بك:",
    successKeep: "احتفظ بهذا الرمز. سيسمح لك بإعادة الاتصال.",
    successCopied: "تم النسخ!",
    successCopy: "نسخ الرمز",
    successContinue: "الدخول إلى مساحتي",
    // Recover step
    recoverLink: "نسيت الرمز؟",
    recoverTitle: "استرجاع الوصول",
    recoverDesc: "أدخل رقم الهاتف الذي استخدمته عند التسجيل.",
    recoverPhone: "رقم الهاتف",
    recoverBtn: "إرسال رمز التحقق",
    recoverError: "لم يُعثر على حساب سنديك بهذا الرقم.",
    recoverLoading: "جارٍ الإرسال…",
    // OTP step
    otpTitle: "رمز التحقق",
    otpDesc: "تم إرسال رمز مكون من 6 أرقام إلى ",
    otpPlaceholder: "000000",
    otpBtn: "تأكيد",
    otpError: "رمز غير صحيح. تحقق وأعد المحاولة.",
    otpExpired: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
    otpLoading: "جارٍ التحقق…",
    otpResend: "إعادة إرسال الرمز",
    // Recover success
    recoverSuccessTitle: "تم استرجاع الوصول!",
    recoverSuccessDesc: "رمز الدخول الجديد:",
    recoverSuccessKeep: "سجّل هذا الرمز. إنه رمز الاتصال الجديد الخاص بك.",
    recoverSuccessContinue: "الدخول إلى مساحتي",
  },
};

const slideColors = ["bg-palier-600", "bg-[#c5604f]", "bg-[#d9961f]"];

const cities = [
  "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir", "Meknès",
  "Oujda", "Kénitra", "Tétouan", "Salé", "Mohammedia", "El Jadida",
  "Béni Mellal", "Nador", "Taza", "Settat", "Khémisset", "Berrechid", "Autre",
];

type Step = "lang" | "welcome" | "role" | "syndic-choice" | "code" | "register" | "register-success" | "recover" | "recover-otp" | "recover-success";

export default function BienvenuePage() {
  return (
    <Suspense>
      <BienvenueContent />
    </Suspense>
  );
}

function BienvenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("fr");
  const [step, setStep] = useState<Step>("lang");
  const [slide, setSlide] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const i = t[lang];
  const isAr = lang === "ar";

  const [role, setRole] = useState<"resident" | "syndic" | null>(null);

  // Deep-link: ?role=syndic skips role selection, keeps lang + welcome
  const [roleFromUrl] = useState(() => searchParams.get("role"));
  useEffect(() => {
    if (roleFromUrl === "syndic") {
      setRole("syndic");
    }
  }, [roleFromUrl]);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBuilding, setRegBuilding] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regCityCustom, setRegCityCustom] = useState("");
  const [regLots, setRegLots] = useState("");
  const [regError, setRegError] = useState("");
  const [registering, setRegistering] = useState(false);

  // Registration success state
  const [accessCode, setAccessCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // Recovery state
  const [recoverPhone, setRecoverPhone] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recovering, setRecovering] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  function nextSlide() {
    if (slide < i.slides.length - 1) setSlide(slide + 1);
    else if (roleFromUrl === "syndic") setStep("syndic-choice");
    else setStep("role");
  }

  function pickRole(r: "resident" | "syndic") {
    setRole(r);
    if (r === "syndic") {
      setStep("syndic-choice");
    } else {
      setStep("code");
    }
  }

  const [validating, setValidating] = useState(false);

  async function validateCode() {
    if (!code.trim()) return;
    setValidating(true);
    setCodeError("");

    try {
      const selectedRole = role ?? "resident";
      const result = await loginWithCode(code.trim().toUpperCase(), selectedRole);

      if (result.ok) {
        localStorage.setItem("palier_lang", lang);
        router.push(selectedRole === "syndic" ? "/syndic" : "/");
      } else {
        const errorMessages: Record<string, string> = lang === "fr" ? {
          code_not_found: "Code introuvable. Vérifiez le code et réessayez.",
          code_not_linked: "Ce code n'est pas encore associé à un compte. Contactez votre syndic.",
          too_many_attempts: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
          wrong_role: role === "syndic"
            ? "Ce code est réservé aux résidents. Utilisez votre code syndic."
            : "Ce code est réservé au syndic. Demandez un code résident à votre syndic.",
        } : {
          code_not_found: "الرمز غير موجود. تحقق من الرمز وأعد المحاولة.",
          code_not_linked: "هذا الرمز غير مرتبط بحساب بعد. تواصل مع السنديك.",
          too_many_attempts: "محاولات كثيرة. يرجى إعادة المحاولة بعد بضع دقائق.",
          wrong_role: role === "syndic"
            ? "هذا الرمز مخصص للسكان. استخدم رمز السنديك الخاص بك."
            : "هذا الرمز مخصص للسنديك. اطلب رمز ساكن من السنديك.",
        };
        setCodeError(errorMessages[result.error] ?? (role === "syndic" ? i.codeErrorSyndic : i.codeErrorResident));
      }
    } catch {
      setCodeError(role === "syndic" ? i.codeErrorSyndic : i.codeErrorResident);
    } finally {
      setValidating(false);
    }
  }

  const isPhoneValid = (p: string) => /^0[5-7]\d{8}$/.test(p.replace(/\s+/g, ""));
  const isLotsValid = (l: string) => { const n = parseInt(l); return !isNaN(n) && n >= 2; };

  async function handleRegister() {
    if (!regName.trim() || !regPhone.trim() || !regBuilding.trim() || !regCity || !regLots) return;
    setRegError("");

    // Client-side validation
    if (!isPhoneValid(regPhone)) {
      setRegError(i.registerErrorPhone);
      return;
    }
    if (!isLotsValid(regLots)) {
      setRegError(i.registerErrorLots);
      return;
    }

    setRegistering(true);

    try {
      const result = await registerSyndic({
        fullName: regName.trim(),
        phone: regPhone.trim(),
        buildingName: regBuilding.trim(),
        city: resolvedCity,
        lotsCount: parseInt(regLots) || 2,
      });

      if (result.ok) {
        localStorage.setItem("palier_lang", lang);
        setAccessCode(result.accessCode);
        setStep("register-success");
      } else {
        const errorMap: Record<string, string> = {
          invalid_phone: i.registerErrorPhone,
          invalid_lots: i.registerErrorLots,
          phone_already_registered: i.registerErrorPhoneExists,
        };
        setRegError(errorMap[result.error] ?? i.registerError);
      }
    } catch {
      setRegError(i.registerError);
    } finally {
      setRegistering(false);
    }
  }

  async function handleRecover() {
    if (!recoverPhone.trim()) return;
    setRecovering(true);
    setRecoverError("");
    try {
      const result = await requestRecoveryOtp(recoverPhone.trim());
      if (result.ok) {
        setOtp("");
        setOtpError("");
        setStep("recover-otp");
      } else {
        const errorMap: Record<string, string> = {
          too_many_attempts: lang === "fr"
            ? "Trop de tentatives. Réessayez dans quelques minutes."
            : "محاولات كثيرة. أعد المحاولة بعد بضع دقائق.",
        };
        setRecoverError(errorMap[result.error] ?? i.recoverError);
      }
    } catch {
      setRecoverError(i.recoverError);
    } finally {
      setRecovering(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await verifyRecoveryOtp(recoverPhone.trim(), otp.trim());
      if (result.ok) {
        localStorage.setItem("palier_lang", lang);
        setAccessCode(result.accessCode);
        setStep("recover-success");
      } else {
        const errorMap: Record<string, string> = {
          otp_invalid: i.otpError,
          otp_expired: i.otpExpired,
          too_many_attempts: lang === "fr"
            ? "Trop de tentatives. Veuillez recommencer."
            : "محاولات كثيرة. يرجى البدء من جديد.",
        };
        setOtpError(errorMap[result.error] ?? i.otpError);
      }
    } catch {
      setOtpError(i.otpError);
    } finally {
      setVerifying(false);
    }
  }

  const resolvedCity = regCity === "__other__" ? regCityCustom.trim() : regCity;
  const regFormValid = regName.trim() && regPhone.trim() && regBuilding.trim() && resolvedCity && regLots;

  // Bouton de langue (coin haut droit)
  const langBtn = (
    <button
      onClick={() => { setLang(i.langSwitch); setCodeError(""); setRegError(""); }}
      className="tap flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-soft shadow-sm"
    >
      <Icon name="Globe" className="h-3.5 w-3.5" />
      {lang === "fr" ? <span style={{ fontFamily: "var(--font-cairo), sans-serif" }}>{i.langLabel}</span> : i.langLabel}
    </button>
  );

  const backBtn = (onBack: () => void) => (
    <button onClick={onBack} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
      <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-5 w-5" />
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
              onClick={() => roleFromUrl === "syndic" ? setStep("syndic-choice") : setStep("role")}
              className="tap mt-3 w-full py-2 text-center text-[13px] font-semibold text-ink-faint"
            >
              {i.skip}
            </button>
          )}
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
          {backBtn(() => { setStep("welcome"); setSlide(i.slides.length - 1); })}
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Users" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.roleTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{i.roleDesc}</p>

          <div className="mt-8 space-y-3">
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

  // ─── CHOIX SYNDIC : code existant ou inscription ──────────
  if (step === "syndic-choice") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          {backBtn(() => setStep(roleFromUrl === "syndic" ? "welcome" : "role"))}
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbf0d8]">
            <Icon name="ShieldCheck" className="h-8 w-8 text-[#d9961f]" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.syndicChoiceTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{i.syndicChoiceDesc}</p>

          <div className="mt-8 space-y-3">
            {/* Option 1 : J'ai un code */}
            <button
              onClick={() => setStep("code")}
              className="tap flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 text-start shadow-card"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-palier-100">
                <Icon name="KeyRound" className="h-7 w-7 text-palier-600" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-ink">{i.syndicHasCode}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{i.syndicHasCodeDesc}</p>
              </div>
              <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-5 w-5 text-ink-faint" />
            </button>

            {/* Option 2 : Inscrire mon immeuble */}
            <button
              onClick={() => setStep("register")}
              className="tap flex w-full items-center gap-4 rounded-2xl border-2 border-palier-200 bg-palier-50/50 p-4 text-start shadow-card"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-palier-600">
                <Icon name="CirclePlus" className="h-7 w-7 text-white" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-ink">{i.syndicRegister}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{i.syndicRegisterDesc}</p>
              </div>
              <Icon name={isAr ? "ChevronLeft" : "ChevronRight"} className="h-5 w-5 text-ink-faint" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── INSCRIPTION SYNDIC ────────────────────────────────────
  if (step === "register") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          {backBtn(() => setStep("syndic-choice"))}
          {langBtn}
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-4 pt-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Building2" className="h-7 w-7 text-palier-600" />
          </div>

          <h1 className="mt-4 text-[22px] font-bold tracking-tight text-ink">{i.registerTitle}</h1>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">{i.registerDesc}</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{i.registerName}</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{i.registerPhone}</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="06XXXXXXXX"
                dir="ltr"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{i.registerBuilding}</label>
              <input
                type="text"
                value={regBuilding}
                onChange={(e) => setRegBuilding(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{i.registerCity}</label>
              {regCity !== "__other__" ? (
                <select
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
                >
                  <option value="">—</option>
                  {cities.filter((c) => c !== "Autre").map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__other__">{lang === "fr" ? "Autre…" : "أخرى…"}</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regCityCustom}
                    onChange={(e) => setRegCityCustom(e.target.value)}
                    placeholder={lang === "fr" ? "Nom de la ville" : "اسم المدينة"}
                    autoFocus
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
                  />
                  <button
                    onClick={() => { setRegCity(""); setRegCityCustom(""); }}
                    className="shrink-0 rounded-xl border border-black/10 px-3 text-ink-soft hover:bg-sand/50"
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{i.registerLots}</label>
              <input
                type="number"
                value={regLots}
                onChange={(e) => setRegLots(e.target.value)}
                min="2"
                max="500"
                dir="ltr"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-palier-400"
              />
            </div>
          </div>

          {regError && (
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-red-500">
              <Icon name="CircleAlert" className="h-4 w-4" /> {regError}
            </p>
          )}
        </div>

        <div className="px-6 pb-10 pt-2">
          <button
            onClick={handleRegister}
            disabled={!regFormValid || registering}
            className={`tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white ${!regFormValid || registering ? "opacity-50" : ""}`}
          >
            {registering ? <Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" /> : null}
            {registering ? i.registerLoading : i.registerBtn}
          </button>
        </div>
      </div>
    );
  }

  // ─── SUCCÈS INSCRIPTION SYNDIC ─────────────────────────────
  if (step === "register-success") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Icon name="Check" className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
          </div>

          <h1 className="mt-6 text-[24px] font-bold tracking-tight text-ink">{i.successTitle}</h1>
          <p className="mt-2 max-w-[18rem] text-[14px] leading-snug text-ink-soft">{i.successDesc}</p>

          <div className="mt-6 w-full max-w-[18rem]">
            <div className="rounded-2xl border-2 border-palier-200 bg-palier-50/50 px-6 py-5">
              <p className="font-mono text-[28px] font-bold tracking-[0.2em] text-palier-700">{accessCode}</p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(accessCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-2.5 text-[13px] font-semibold text-ink-soft"
            >
              <Icon name={codeCopied ? "Check" : "Copy"} className="h-4 w-4" />
              {codeCopied ? i.successCopied : i.successCopy}
            </button>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-start" dir={isAr ? "rtl" : "ltr"}>
            <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] leading-snug text-amber-800">{i.successKeep}</p>
          </div>
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={() => router.push("/syndic")}
            className="tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white"
          >
            {i.successContinue}
            <Icon name={isAr ? "ArrowLeft" : "ArrowRight"} className="h-4.5 w-4.5" />
          </button>
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
          {backBtn(() => setStep(role === "syndic" ? "syndic-choice" : "role"))}
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

          {role === "syndic" && roleFromUrl !== "syndic" && (
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
          {role === "syndic" && (
            <button
              onClick={() => { setRecoverPhone(""); setRecoverError(""); setStep("recover"); }}
              className="tap mt-3 w-full py-2 text-center text-[13px] font-semibold text-palier-600"
            >
              {i.recoverLink}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── SUCCÈS RÉCUPÉRATION SYNDIC ──────────────────────────────
  if (step === "recover-success") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Icon name="KeyRound" className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
          </div>

          <h1 className="mt-6 text-[24px] font-bold tracking-tight text-ink">{i.recoverSuccessTitle}</h1>
          <p className="mt-2 max-w-[18rem] text-[14px] leading-snug text-ink-soft">{i.recoverSuccessDesc}</p>

          <div className="mt-6 w-full max-w-[18rem]">
            <div className="rounded-2xl border-2 border-palier-200 bg-palier-50/50 px-6 py-5">
              <p className="font-mono text-[28px] font-bold tracking-[0.2em] text-palier-700">{accessCode}</p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(accessCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
              }}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-2.5 text-[13px] font-semibold text-ink-soft"
            >
              <Icon name={codeCopied ? "Check" : "Copy"} className="h-4 w-4" />
              {codeCopied ? i.successCopied : i.successCopy}
            </button>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-start" dir={isAr ? "rtl" : "ltr"}>
            <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] leading-snug text-amber-800">{i.recoverSuccessKeep}</p>
          </div>
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={() => router.push("/syndic")}
            className="tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white"
          >
            {i.recoverSuccessContinue}
            <Icon name={isAr ? "ArrowLeft" : "ArrowRight"} className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── RÉCUPÉRATION SYNDIC ───────────────────────────────────
  if (step === "recover") {
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          {backBtn(() => setStep("code"))}
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="Phone" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.recoverTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">{i.recoverDesc}</p>

          <div className="mt-6">
            <input
              type="tel"
              value={recoverPhone}
              onChange={(e) => { setRecoverPhone(e.target.value); setRecoverError(""); }}
              placeholder="06XXXXXXXX"
              autoFocus
              dir="ltr"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-center text-[18px] font-bold tracking-[0.1em] text-ink outline-none placeholder:text-[14px] placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-faint focus:border-palier-400"
            />
            {recoverError && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-red-500">
                <Icon name="CircleAlert" className="h-4 w-4" /> {recoverError}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={handleRecover}
            disabled={!recoverPhone.trim() || recovering}
            className={`tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white ${!recoverPhone.trim() || recovering ? "opacity-50" : ""}`}
          >
            {recovering ? <Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" /> : null}
            {recovering ? i.recoverLoading : i.recoverBtn}
          </button>
        </div>
      </div>
    );
  }

  // ─── VÉRIFICATION OTP ──────────────────────────────────────
  if (step === "recover-otp") {
    const maskedPhone = recoverPhone.trim().replace(/(\d{2})\d{4}(\d{4})/, "$1****$2");
    return (
      <div className="flex h-full flex-col" dir={isAr ? "rtl" : "ltr"}>
        <StatusBar />

        <div className="flex items-center justify-between px-6 pt-6">
          {backBtn(() => { setStep("recover"); setOtp(""); setOtpError(""); })}
          {langBtn}
        </div>

        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-palier-100">
            <Icon name="ShieldCheck" className="h-8 w-8 text-palier-600" />
          </div>

          <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">{i.otpTitle}</h1>
          <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">
            {i.otpDesc}<span className="font-semibold" dir="ltr">{maskedPhone}</span>
          </p>

          <div className="mt-6">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
              placeholder={i.otpPlaceholder}
              autoFocus
              dir="ltr"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-center text-[24px] font-bold tracking-[0.3em] text-ink outline-none placeholder:text-[18px] placeholder:font-normal placeholder:tracking-[0.3em] placeholder:text-ink-faint focus:border-palier-400"
            />
            {otpError && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-red-500">
                <Icon name="CircleAlert" className="h-4 w-4" /> {otpError}
              </p>
            )}
          </div>

          <button
            onClick={() => { setOtp(""); setOtpError(""); handleRecover(); }}
            className="tap mt-4 w-full py-2 text-center text-[13px] font-semibold text-palier-600"
          >
            {i.otpResend}
          </button>
        </div>

        <div className="px-6 pb-10">
          <button
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6 || verifying}
            className={`tap flex w-full items-center justify-center gap-2 rounded-full bg-palier-600 py-3.5 text-[15px] font-semibold text-white ${otp.length !== 6 || verifying ? "opacity-50" : ""}`}
          >
            {verifying ? <Icon name="Loader2" className="h-4.5 w-4.5 animate-spin" /> : null}
            {verifying ? i.otpLoading : i.otpBtn}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
