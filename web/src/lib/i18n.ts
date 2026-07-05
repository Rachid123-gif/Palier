export type Lang = "fr" | "ar";

export const t = {
  fr: {
    // ── Navigation ──
    nav: { accueil: "Accueil", charges: "Charges", immeuble: "Immeuble", voisinage: "Voisinage", services: "Services" },

    // ── Greeting ──
    bonneNuit: "Bonne nuit", bonjour: "Bonjour", bonApresMidi: "Bon après-midi", bonsoir: "Bonsoir",

    // ── Home ──
    home: {
      voisinage: "Voisinage", voisinageSub: "Annonces, entraide",
      services: "Services", servicesSub: "Bouche à oreille",
      signaler: "Signaler", signalerSub: "Incident",
      aPayerMaintenant: "À payer maintenant",
      chargeNonPayee: (n: number) => `${n} charge${n > 1 ? "s" : ""} non payée${n > 1 ? "s" : ""}`,
      payerMaintenant: "Payer maintenant",
      vousEtesAJour: "Vous êtes à jour",
      aucuneCharge: "Aucune charge en attente",
      suivezArgent: "Suivez où va l'argent de votre immeuble",
      vieImmeuble: "Vie de l'immeuble",
      voirDetails: "Voir détails",
      incidentsEnCours: (n: number) => `${n} incident${n > 1 ? "s" : ""} en cours`,
      annonceSyndic: (n: number) => `${n} annonce${n > 1 ? "s" : ""} du syndic`,
      toutEstCalme: "Tout est calme dans l'immeuble",
      votreSyndic: "Votre syndic",
      lots: "lots",
    },

    // ── Profil / Paramètres ──
    profil: {
      title: "Mon profil",
      mesInfos: "Mes informations",
      nom: "Nom complet",
      telephone: "Téléphone",
      lot: "Lot",
      statut: "Statut",
      residence: "Résidence",
      proprietaire: "Propriétaire",
      locataire: "Locataire",
      // Notifications
      notificationsTitle: "Notifications",
      notificationsDesc: "Choisissez les notifications que vous souhaitez recevoir.",
      notifToutActiver: "Tout activer",
      notifToutDesactiver: "Tout désactiver",
      notifCharges: "Charges & paiements",
      notifChargesDesc: "Rappels de paiement, reçus",
      notifIncidents: "Incidents",
      notifIncidentsDesc: "Mises à jour des signalements",
      notifVoisinage: "Voisinage",
      notifVoisinageDesc: "Publications, commentaires",
      notifAG: "Assemblée générale",
      notifAGDesc: "Convocations, votes",
      notifSyndic: "Annonces syndic",
      notifSyndicDesc: "Messages du syndic",
      // Export
      exportTitle: "Mes données",
      exportDesc: "Téléchargez l'historique complet de votre résidence.",
      exportCharges: "Charges",
      exportIncidents: "Incidents",
      exportButton: "Exporter mes données",
      // Erreur
      signalerErreur: "Signaler une erreur",
      signalerDesc: "Une information est incorrecte ? Prévenez votre syndic pour la corriger.",
      prevenir: "Prévenir le syndic",
      messageErreur: (name: string, building: string) =>
        `Bonjour,\n\nJe suis ${name}, résident(e) à ${building}.\n\nJe souhaite signaler une erreur dans mes informations sur Palier :\n\n• Détail de l'erreur : [à compléter]\n\nMerci de corriger. Cordialement.`,
    },

    // ── Désactivé ──
    desactive: {
      titre: "Compte désactivé",
      desc: "Votre accès a été désactivé par le syndic. Certaines actions ne sont plus disponibles :",
      actions: [
        "Publier ou commenter dans le voisinage",
        "Signaler des incidents",
        "Voter aux assemblées générales",
        "Réserver des services",
      ],
      erreur: "Si vous pensez qu'il s'agit d'une erreur, contactez votre syndic.",
      contacter: "Contacter le syndic",
      messageWhatsapp: (name: string, building: string) =>
        `Bonjour,\n\nJe suis ${name}, résident(e) à ${building}.\n\nMon compte Palier a été désactivé et je pense qu'il s'agit d'une erreur.\n\nPouvez-vous vérifier ma situation ?\n\nMerci.`,
    },

    // ── Charges ──
    charges: {
      title: "Mes charges",
      aPayer: "À payer", enRetard: "En retard", partiel: "Partiel", paye: "Payé",
      aPayerMaintenant: "À payer maintenant",
      chargeNonPayee: (n: number) => `${n} charge${n > 1 ? "s" : ""} non payée${n > 1 ? "s" : ""}`,
      vousEtesAJour: "Vous êtes à jour", aucuneCharge: "Aucune charge en attente",
      aRegler: "À régler",
      historique: "Historique",
      tout: "Tout", ceMois: "Ce mois", troisMois: "3 mois", sixMois: "6 mois", periode: "Période",
      voirPlus: (n: number) => `Voir plus (${n} de plus)`,
      aucunePeriode: "Aucune charge sur cette période",
      aucunPaiement: "Aucun paiement pour le moment",
      suivezTransparence: "Suivez où va l'argent dans",
      transparenceFinanciere: "Transparence financière",
      filtrerPeriode: "Filtrer par période",
      mois: "Mois", annee: "Année",
      reinitialiser: "Réinitialiser", appliquer: "Appliquer",
      recuPaiement: "Reçu de paiement",
      paiementConfirme: "Paiement confirmé",
      charge: "Charge", detail: "Détail", montant: "Montant", statut: "Statut",
      recuEnregistre: "Ce reçu est enregistré dans le système Palier",
      voirRecu: "Voir le reçu",
      sur: "sur",
    },

    // ── Notifications ──
    notifications: "Notifications",

    // ── Feedback ──
    feedback: {
      title: "Votre avis",
      subtitle: "Aidez-nous à améliorer Palier",
      cta: "Donner mon avis",
      typeBug: "Problème",
      typeSuggestion: "Suggestion",
      typeAutre: "Autre",
      descBug: "Décrivez le problème rencontré",
      descSuggestion: "Décrivez votre idée",
      descAutre: "Votre message",
      placeholderBug: "Que s'est-il passé ?",
      placeholderSuggestion: "Quelle fonctionnalité aimeriez-vous ?",
      placeholderAutre: "Votre message…",
      contactLabel: "Comment vous recontacter ?",
      phone: "Téléphone",
      email: "Email",
      transparency: "Informations partagées",
      transparencyNote: "Seul le moyen de contact choisi est partagé.",
      send: "Envoyer",
      sending: "Envoi…",
      thankYou: "Merci pour votre retour !",
      thankYouSub: "Notre équipe va l'examiner.",
      sendAnother: "Envoyer un autre avis",
    },

    // ── Immeuble ──
    immeuble: {
      incidents: "Incidents",
      signalementsEnCours: (n: number) => `${n} signalement${n > 1 ? "s" : ""} en cours`,
      aucunProbleme: "Aucun problème signalé",
      documents: "Documents", documentsSub: "PV, contrats, règlement",
      ag: "Assemblée générale", agSub: "Ordre du jour et votes",
      transparenceFinanciere: "Transparence financière",
      soldeCaisse: "Solde de la caisse",
      coproEnDeficit: "La copropriété est en déficit",
      tout: "Tout", ceMois: "Ce mois", troisMois: "3 mois", sixMois: "6 mois",
      encaisse: "Encaissé", depense: "Dépensé",
      chargesPayees: "Charges payées par les résidents",
      mouvements: "Mouvements",
      operations: (n: number) => `${n} opération${n > 1 ? "s" : ""}`,
      voirPlus: (n: number) => `Voir plus (${n} restant${n > 1 ? "s" : ""})`,
      aucunMouvement: "Aucun mouvement sur cette période",
      syndic: "Syndic",
      opsSignees: "Toutes les opérations sont signées et horodatées.",
      filtrerPeriode: "Filtrer par période",
      moisLabel: "Mois", anneeLabel: "Année",
      reinitialiser: "Réinitialiser", appliquer: "Appliquer",
      periode: "Période",
    },

    // ── Documents ──
    docs: {
      title: "Documents",
      info: "Documents officiels de votre copropriété. PV, contrats, règlements.",
      aucun: "Aucun document disponible pour le moment",
    },

    // ── AG ──
    ag: {
      title: "Assemblée générale",
      infoVide: "Les informations de la prochaine AG seront affichées ici dès qu'elles seront disponibles.",
      aucune: "Aucune assemblée générale programmée pour le moment",
      dans: (n: number) => `Dans ${n} jour${n > 1 ? "s" : ""}`,
      terminee: "Terminée",
      agOrdinaire: "AG ordinaire.",
      ordreDuJour: "Ordre du jour",
      votesOuverts: "Votes ouverts",
      votePondere: "Vote pondéré par les tantièmes · clôture le",
      voteEnregistre: "Vote enregistré",
      voteBody: "Votre voix est prise en compte (pondérée par vos tantièmes). Modifiable jusqu'à la clôture.",
    },

    // ── Signaler ──
    signaler: {
      title: "Signaler",
      info: "Ascenseur, fuite, panne…",
      infoSuite: "le syndic est notifié immédiatement",
      infoFin: "et vous suivez la résolution en temps réel.",
      deQuoi: "De quoi s'agit-il ?",
      niveauUrgence: "Niveau d'urgence",
      titreCourt: "Titre court",
      placeholder: "Ex : Ascenseur bloqué au 3e",
      detailsLabel: "Détails",
      optionnel: "optionnel",
      detailsPlaceholder: "Décrivez ce qui se passe en quelques lignes…",
      envoyerSignalement: "Envoyer le signalement",
      signalementsEnCours: "Signalements en cours",
      signalementEnvoye: "Signalement envoyé",
      signalementBody: "Le syndic et les voisins concernés sont notifiés. Vous suivez la résolution en temps réel.",
      cats: {
        ascenseur: "Ascenseur", fuite: "Fuite d'eau", electricite: "Électricité", securite: "Sécurité",
        proprete: "Propreté", nuisibles: "Nuisibles", nuisance: "Nuisance sonore",
        parking: "Parking", communes: "Parties communes", jardinier: "Jardinage", autre: "Autre",
      },
      urgencies: { low: "Pas urgent", normal: "Normal", urgent: "Urgent" },
      statuses: { open: "Ouvert", resolved: "Résolu" },
    },

    // ── Voisinage ──
    voisinage: {
      label: "Voisinage",
      title: "Vie de l'immeuble",
      placeholder: "Quoi de neuf dans l'immeuble ?",
      tout: "Tout", cetteSemaine: "Cette semaine", ceMois: "Ce mois", troisMois: "3 mois",
      tabs: { all: "Tout", announcement: "Annonces", event: "Événements", help: "Entraide", found: "Trouvé" },
      badges: { announcement: "Annonce", event: "Événement", help: "Entraide", found: "Trouvé", general: "Général" },
      postTypes: { help: "Entraide", found: "Objet trouvé", event: "Événement" },
      voirPlus: (n: number) => `Voir plus (${n} restant${n > 1 ? "s" : ""})`,
      aucunePublication: "Aucune publication dans cette catégorie",
      publierDans: "Publier dans le voisinage",
      categorieOptionnelle: "Catégorie",
      optionnel: "optionnel",
      publier: "Publier",
      commentaires: "Commentaires",
      jaime: "J'aime",
      commenter: "Commenter",
      commentaire: (n: number) => `${n} commentaire${n !== 1 ? "s" : ""}`,
      chargement: "Chargement...",
      aucunCommentaire: "Aucun commentaire pour le moment",
      ecrireCommentaire: "Écrire un commentaire...",
      publie: "Publié !",
      publieBody: "Votre message est visible par vos voisins.",
      epingle: "Épinglé par le syndic",
      voirMoins: "Voir moins",
      lireSuite: "Lire la suite",
      ajouterPhoto: "Photo",
      ajouterFichier: "Fichier",
      supprimerMedia: "Supprimer",
    },

    // ── Services (bouche à oreille) ──
    services: {
      label: "Services",
      title: "Bouche à oreille",
      info: "Besoin d'un prestataire ? Pas besoin de chercher ailleurs, demandez à vos voisins. Ils connaissent les meilleurs.",
      // Tabs
      tabRecos: "Recommandations",
      tabDemandes: "Demandes",
      // Recommandations
      toutesCategories: "Tout",
      aucuneReco: "Aucune recommandation pour le moment. Partagez un prestataire que vous avez testé !",
      partagerReco: "Partager une recommandation",
      recoPubliee: "Recommandation publiée !",
      recoPublieeBody: "Vos voisins peuvent maintenant trouver ce prestataire.",
      // Demandes
      placeholder: "Vous cherchez un prestataire ?",
      aucuneDemande: "Aucune demande pour le moment. Posez votre question !",
      posterDemande: "Poster une demande",
      demandePubliee: "Demande publiée !",
      demandePublieeBody: "Vos voisins verront votre demande et pourront recommander un prestataire.",
      // Composer — recommandation
      titreRecoSheet: "Recommander un prestataire",
      nomPrestataire: "Nom du prestataire",
      nomPlaceholder: "Ex : Ahmed Plomberie",
      categorieLabel: "Catégorie",
      categoriePlaceholder: "Ex : Plomberie, Ménage…",
      categorieNouvelle: "Nouvelle catégorie",
      avisLabel: "Pourquoi vous le recommandez ?",
      avisPlaceholder: "Travail soigné, ponctuel, bon prix…",
      telephoneLabel: "Téléphone / WhatsApp",
      telephonePlaceholder: "06 XX XX XX XX",
      optionnel: "optionnel",
      publier: "Publier",
      // Composer — demande
      titreDemandeSheet: "Poster une demande",
      demandePlaceholder: "Ex : Quelqu'un connaît un bon plombier dans le quartier ?",
      // Shared
      voirPlus: (n: number) => `Voir plus (${n} restant${n > 1 ? "s" : ""})`,
      reponses: (n: number) => `${n} réponse${n !== 1 ? "s" : ""}`,
      repondre: "Répondre",
      commentaires: "Réponses",
      aucuneReponse: "Aucune réponse pour le moment",
      ecrireReponse: "Écrire une réponse…",
      jaime: "Utile",
      chargement: "Chargement...",
      voirMoins: "Voir moins",
      lireSuite: "Lire la suite",
      badge: "Service",
      appeler: "Appeler",
      whatsapp: "WhatsApp",
    },

    // ── Services catégorie (legacy) ──
    servicesCat: {
      prestataires: (n: number) => `${n} prestataire${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}`,
      aucun: "Aucun prestataire pour le moment",
      pasEncore: (cat: string, city: string) => `Pas encore de prestataire ${cat} référencé à ${city}. Essayez une autre ville.`,
      changerVille: "Changer de ville",
      introuvable: "Catégorie introuvable.",
      retour: "Retour aux services",
    },

    // ── Provider card (kept for legacy links) ──
    provider: {
      topVoisins: "Recommandé par vos voisins",
      aPartirDe: "À partir de",
      dispoBadge: "Dispo",
      appeler: "Appeler",
      whatsapp: "WhatsApp",
      voir: "Voir",
      titre: "Prestataire",
      introuvable: "Prestataire introuvable.",
      retour: "Retour aux services",
      service: "Service",
      zone: "Zone",
      tarif: "Tarif indicatif",
      des: "dès",
      dispoAujourdhui: "Disponible aujourd'hui",
      note: "Ce prestataire a été recommandé par des résidents de votre quartier. Contactez-le directement pour convenir des modalités.",
      contactDirectement: "Contactez directement le prestataire pour votre demande",
    },

    // ── City sheet ──
    city: {
      title: "Choisir ma zone",
      searchPlaceholder: "Rechercher une ville ou un quartier",
      detecter: "Détecter ma position (GPS)",
      detection: "Détection en cours…",
      prestataires: "prestataires",
    },

    // ── Months ──
    months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    monthsShort: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],

    // ── Time ──
    aLinstant: "à l'instant",
    ilYA: (n: number, unit: string) => `il y a ${n} ${unit}`,
    min: "min", h: "h", j: "j",

    // ── Cats service (labels) ──
    catLabels: {
      menage: "Ménage", plomberie: "Plomberie", electricite: "Électricité", climatisation: "Climatisation",
      bricolage: "Bricolage", peinture: "Peinture", jardinage: "Jardinage", securite: "Sécurité",
      serrurerie: "Serrurerie", demenagement: "Déménagement", "nettoyage-tapis": "Nettoyage tapis", "nettoyage-canape": "Nettoyage canapé",
      piscine: "Piscine", vitres: "Vitres", electromenager: "Réparation électroménager", desinfection: "Désinfection",
    } as Record<string, string>,
    catShorts: {
      menage: "Ménage", plomberie: "Plombier", electricite: "Élec", climatisation: "Clim",
      bricolage: "Bricolage", peinture: "Peinture", jardinage: "Jardin", securite: "Sécurité",
      serrurerie: "Serrure", demenagement: "Démén.", "nettoyage-tapis": "Tapis", "nettoyage-canape": "Canapé",
      piscine: "Piscine", vitres: "Vitres", electromenager: "Électro.", desinfection: "Désinf.",
    } as Record<string, string>,
  },

  ar: {
    // ── Navigation ──
    nav: { accueil: "الرئيسية", charges: "المصاريف", immeuble: "العمارة", voisinage: "الجيران", services: "الخدمات" },

    // ── Greeting ──
    bonneNuit: "تصبح على خير", bonjour: "مرحبا", bonApresMidi: "مساء الخير", bonsoir: "مساء الخير",

    // ── Home ──
    home: {
      voisinage: "الجيران", voisinageSub: "إعلانات، تعاون",
      services: "الخدمات", servicesSub: "توصيات الجيران",
      signaler: "إبلاغ", signalerSub: "حادث",
      aPayerMaintenant: "واجب الدفع الآن",
      chargeNonPayee: (n: number) => `${n} ${n > 1 ? "مصاريف غير مدفوعة" : "مصروف غير مدفوع"}`,
      payerMaintenant: "ادفع الآن",
      vousEtesAJour: "أنت في الموعد",
      aucuneCharge: "لا توجد مصاريف معلقة",
      suivezArgent: "تابع أين تذهب أموال عمارتك",
      vieImmeuble: "حياة العمارة",
      voirDetails: "عرض التفاصيل",
      incidentsEnCours: (n: number) => `${n} ${n > 1 ? "حوادث جارية" : "حادث جاري"}`,
      annonceSyndic: (n: number) => `${n} ${n > 1 ? "إعلانات من السنديك" : "إعلان من السنديك"}`,
      toutEstCalme: "كل شيء هادئ في العمارة",
      votreSyndic: "السنديك الخاص بك",
      lots: "شقق",
    },

    // ── Profil / Paramètres ──
    profil: {
      title: "ملفي الشخصي",
      mesInfos: "معلوماتي",
      nom: "الاسم الكامل",
      telephone: "الهاتف",
      lot: "الشقة",
      statut: "الصفة",
      residence: "الإقامة",
      proprietaire: "مالك",
      locataire: "مستأجر",
      // Notifications
      notificationsTitle: "الإشعارات",
      notificationsDesc: "اختر الإشعارات التي تريد تلقيها.",
      notifToutActiver: "تفعيل الكل",
      notifToutDesactiver: "تعطيل الكل",
      notifCharges: "المصاريف والدفع",
      notifChargesDesc: "تذكيرات الدفع، الوصولات",
      notifIncidents: "الحوادث",
      notifIncidentsDesc: "تحديثات البلاغات",
      notifVoisinage: "الجيران",
      notifVoisinageDesc: "المنشورات، التعليقات",
      notifAG: "الجمع العام",
      notifAGDesc: "الدعوات، التصويتات",
      notifSyndic: "إعلانات السنديك",
      notifSyndicDesc: "رسائل السنديك",
      // Export
      exportTitle: "بياناتي",
      exportDesc: "حمّل سجل إقامتك الكامل.",
      exportCharges: "المصاريف",
      exportIncidents: "الحوادث",
      exportButton: "تصدير بياناتي",
      // Erreur
      signalerErreur: "الإبلاغ عن خطأ",
      signalerDesc: "معلومة خاطئة؟ أبلغ السنديك لتصحيحها.",
      prevenir: "إبلاغ السنديك",
      messageErreur: (name: string, building: string) =>
        `مرحبا،\n\nأنا ${name}، ساكن(ة) في ${building}.\n\nأريد الإبلاغ عن خطأ في معلوماتي على Palier:\n\n• تفاصيل الخطأ: [يرجى التوضيح]\n\nشكراً.`,
    },

    // ── Désactivé ──
    desactive: {
      titre: "حساب معطل",
      desc: "تم تعطيل حسابك من طرف السنديك. بعض الإجراءات لم تعد متاحة:",
      actions: [
        "النشر أو التعليق في الجوار",
        "الإبلاغ عن الحوادث",
        "التصويت في الجمعيات العامة",
        "حجز الخدمات",
      ],
      erreur: "إذا كنت تعتقد أن هذا خطأ، تواصل مع السنديك.",
      contacter: "التواصل مع السنديك",
      messageWhatsapp: (name: string, building: string) =>
        `مرحبا،\n\nأنا ${name}، ساكن(ة) في ${building}.\n\nتم تعطيل حسابي على Palier وأعتقد أن هذا خطأ.\n\nهل يمكنكم التحقق من وضعيتي؟\n\nشكراً.`,
    },

    // ── Charges ──
    charges: {
      title: "مصاريفي",
      aPayer: "واجب الدفع", enRetard: "متأخر", partiel: "جزئي", paye: "مدفوع",
      aPayerMaintenant: "واجب الدفع الآن",
      chargeNonPayee: (n: number) => `${n} ${n > 1 ? "مصاريف غير مدفوعة" : "مصروف غير مدفوع"}`,
      vousEtesAJour: "أنت في الموعد", aucuneCharge: "لا توجد مصاريف معلقة",
      aRegler: "للتسوية",
      historique: "السجل",
      tout: "الكل", ceMois: "هذا الشهر", troisMois: "3 أشهر", sixMois: "6 أشهر", periode: "الفترة",
      voirPlus: (n: number) => `عرض المزيد (${n} إضافية)`,
      aucunePeriode: "لا توجد مصاريف في هذه الفترة",
      aucunPaiement: "لا توجد مدفوعات حتى الآن",
      suivezTransparence: "تابع أين تذهب الأموال في",
      transparenceFinanciere: "الشفافية المالية",
      filtrerPeriode: "تصفية حسب الفترة",
      mois: "الشهر", annee: "السنة",
      reinitialiser: "إعادة تعيين", appliquer: "تطبيق",
      recuPaiement: "وصل الدفع",
      paiementConfirme: "تم تأكيد الدفع",
      charge: "المصروف", detail: "التفاصيل", montant: "المبلغ", statut: "الحالة",
      recuEnregistre: "هذا الوصل مسجل في نظام بالييه",
      voirRecu: "عرض الوصل",
      sur: "من أصل",
    },

    // ── Notifications ──
    notifications: "الإشعارات",

    // ── Feedback ──
    feedback: {
      title: "رأيك",
      subtitle: "ساعدنا في تحسين Palier",
      cta: "أعط رأيي",
      typeBug: "مشكلة",
      typeSuggestion: "اقتراح",
      typeAutre: "أخرى",
      descBug: "صف المشكلة",
      descSuggestion: "صف فكرتك",
      descAutre: "رسالتك",
      placeholderBug: "ماذا حدث؟",
      placeholderSuggestion: "ما الميزة التي تريدها؟",
      placeholderAutre: "رسالتك…",
      contactLabel: "كيف تريد أن نتواصل معك؟",
      phone: "هاتف",
      email: "بريد إلكتروني",
      transparency: "المعلومات المشاركة",
      transparencyNote: "يتم مشاركة وسيلة الاتصال المختارة فقط.",
      send: "إرسال",
      sending: "جاري الإرسال…",
      thankYou: "!شكرا على رأيك",
      thankYouSub: "فريقنا سيراجعه.",
      sendAnother: "إرسال رأي آخر",
    },

    // ── Immeuble ──
    immeuble: {
      incidents: "الحوادث",
      signalementsEnCours: (n: number) => `${n} ${n > 1 ? "بلاغات جارية" : "بلاغ جاري"}`,
      aucunProbleme: "لا توجد مشاكل مبلغ عنها",
      documents: "الوثائق", documentsSub: "محاضر، عقود، نظام",
      ag: "الجمع العام", agSub: "جدول الأعمال والتصويت",
      transparenceFinanciere: "الشفافية المالية",
      soldeCaisse: "رصيد الصندوق",
      coproEnDeficit: "الملكية المشتركة في عجز",
      tout: "الكل", ceMois: "هذا الشهر", troisMois: "3 أشهر", sixMois: "6 أشهر",
      encaisse: "المحصّل", depense: "المصروف",
      chargesPayees: "المصاريف المدفوعة من طرف السكان",
      mouvements: "الحركات",
      operations: (n: number) => `${n} ${n > 1 ? "عمليات" : "عملية"}`,
      voirPlus: (n: number) => `عرض المزيد (${n} ${n > 1 ? "متبقية" : "متبقي"})`,
      aucunMouvement: "لا توجد حركات في هذه الفترة",
      syndic: "السنديك",
      opsSignees: "جميع العمليات موقعة ومؤرخة.",
      filtrerPeriode: "تصفية حسب الفترة",
      moisLabel: "الشهر", anneeLabel: "السنة",
      reinitialiser: "إعادة تعيين", appliquer: "تطبيق",
      periode: "الفترة",
    },

    // ── Documents ──
    docs: {
      title: "الوثائق",
      info: "وثائق رسمية لملكيتكم المشتركة. محاضر، عقود، أنظمة.",
      aucun: "لا توجد وثائق متاحة حالياً",
    },

    // ── AG ──
    ag: {
      title: "الجمع العام",
      infoVide: "ستظهر هنا معلومات الجمع العام القادم حالما تتوفر.",
      aucune: "لا يوجد جمع عام مبرمج حالياً",
      dans: (n: number) => `بعد ${n} ${n > 1 ? "أيام" : "يوم"}`,
      terminee: "منتهي",
      agOrdinaire: "جمع عام عادي.",
      ordreDuJour: "جدول الأعمال",
      votesOuverts: "التصويتات المفتوحة",
      votePondere: "تصويت مرجح بالحصص · الإغلاق في",
      voteEnregistre: "تم تسجيل التصويت",
      voteBody: "تم احتساب صوتك (مرجح بحصصك). يمكن التعديل حتى الإغلاق.",
    },

    // ── Signaler ──
    signaler: {
      title: "إبلاغ",
      info: "مصعد، تسرب، عطل…",
      infoSuite: "يتم إخطار السنديك فوراً",
      infoFin: "وتتابع الحل في الوقت الحقيقي.",
      deQuoi: "ما الموضوع؟",
      niveauUrgence: "مستوى الاستعجال",
      titreCourt: "عنوان قصير",
      placeholder: "مثال: المصعد عالق في الطابق 3",
      detailsLabel: "التفاصيل",
      optionnel: "اختياري",
      detailsPlaceholder: "صف ما يحدث في بضعة أسطر…",
      envoyerSignalement: "إرسال البلاغ",
      signalementsEnCours: "البلاغات الجارية",
      signalementEnvoye: "تم إرسال البلاغ",
      signalementBody: "تم إخطار السنديك والجيران المعنيين. تتابع الحل في الوقت الحقيقي.",
      cats: {
        ascenseur: "المصعد", fuite: "تسرب مائي", electricite: "كهرباء", securite: "أمن",
        proprete: "نظافة", nuisibles: "حشرات", nuisance: "إزعاج صوتي",
        parking: "موقف", communes: "الأجزاء المشتركة", jardinier: "بستنة", autre: "أخرى",
      },
      urgencies: { low: "غير مستعجل", normal: "عادي", urgent: "مستعجل" },
      statuses: { open: "مفتوح", resolved: "تم الحل" },
    },

    // ── Voisinage ──
    voisinage: {
      label: "الجيران",
      title: "حياة العمارة",
      placeholder: "ما الجديد في العمارة؟",
      tout: "الكل", cetteSemaine: "هذا الأسبوع", ceMois: "هذا الشهر", troisMois: "3 أشهر",
      tabs: { all: "الكل", announcement: "إعلانات", event: "أحداث", help: "تعاون", found: "موجود" },
      badges: { announcement: "إعلان", event: "حدث", help: "تعاون", found: "موجود", general: "عام" },
      postTypes: { help: "تعاون", found: "شيء موجود", event: "حدث" },
      voirPlus: (n: number) => `عرض المزيد (${n} ${n > 1 ? "متبقية" : "متبقي"})`,
      aucunePublication: "لا توجد منشورات في هذه الفئة",
      publierDans: "نشر في الحي",
      categorieOptionnelle: "الفئة",
      optionnel: "اختياري",
      publier: "نشر",
      commentaires: "التعليقات",
      jaime: "إعجاب",
      commenter: "تعليق",
      commentaire: (n: number) => `${n} ${n !== 1 ? "تعليقات" : "تعليق"}`,
      chargement: "جاري التحميل...",
      aucunCommentaire: "لا توجد تعليقات حالياً",
      ecrireCommentaire: "اكتب تعليقاً...",
      publie: "تم النشر!",
      publieBody: "رسالتك مرئية لجيرانك.",
      epingle: "مثبت من طرف السنديك",
      voirMoins: "عرض أقل",
      lireSuite: "اقرأ المزيد",
      ajouterPhoto: "صورة",
      ajouterFichier: "ملف",
      supprimerMedia: "حذف",
    },

    // ── Services (bouche à oreille) ──
    services: {
      label: "الخدمات",
      title: "توصيات الجيران",
      info: "محتاج خدمة؟ ما كاين علاش تقلّب بعيد، سوّل جيرانك. هما لي كيعرفو الأحسن.",
      // Tabs
      tabRecos: "التوصيات",
      tabDemandes: "الطلبات",
      // Recommandations
      toutesCategories: "الكل",
      aucuneReco: "لا توجد توصيات حالياً. شارك مقدم خدمة جربته!",
      partagerReco: "مشاركة توصية",
      recoPubliee: "تم نشر التوصية!",
      recoPublieeBody: "جيرانك يمكنهم الآن العثور على مقدم الخدمة هذا.",
      // Demandes
      placeholder: "تبحث عن مقدم خدمة؟",
      aucuneDemande: "لا توجد طلبات حالياً. اطرح سؤالك!",
      posterDemande: "نشر طلب",
      demandePubliee: "تم نشر الطلب!",
      demandePublieeBody: "جيرانك سيرون طلبك ويمكنهم التوصية بمقدم خدمة.",
      // Composer — recommandation
      titreRecoSheet: "التوصية بمقدم خدمة",
      nomPrestataire: "اسم مقدم الخدمة",
      nomPlaceholder: "مثال: أحمد السباك",
      categorieLabel: "الفئة",
      categoriePlaceholder: "مثال: سباكة، تنظيف…",
      categorieNouvelle: "فئة جديدة",
      avisLabel: "لماذا توصي به؟",
      avisPlaceholder: "عمل متقن، دقيق في المواعيد، سعر مناسب…",
      telephoneLabel: "الهاتف / واتساب",
      telephonePlaceholder: "06 XX XX XX XX",
      optionnel: "اختياري",
      publier: "نشر",
      // Composer — demande
      titreDemandeSheet: "نشر طلب",
      demandePlaceholder: "مثال: واش كاين شي سباك مزيان فالحي؟",
      // Shared
      voirPlus: (n: number) => `عرض المزيد (${n} ${n > 1 ? "متبقية" : "متبقي"})`,
      reponses: (n: number) => `${n} ${n !== 1 ? "ردود" : "رد"}`,
      repondre: "رد",
      commentaires: "الردود",
      aucuneReponse: "لا توجد ردود حالياً",
      ecrireReponse: "اكتب رداً…",
      jaime: "مفيد",
      chargement: "جاري التحميل...",
      voirMoins: "عرض أقل",
      lireSuite: "اقرأ المزيد",
      badge: "خدمة",
      appeler: "اتصل",
      whatsapp: "واتساب",
    },

    // ── Services catégorie (legacy) ──
    servicesCat: {
      prestataires: (n: number) => `${n} ${n > 1 ? "مقدمي خدمات متوفرين" : "مقدم خدمة متوفر"}`,
      aucun: "لا يوجد مقدم خدمة حالياً",
      pasEncore: (cat: string, city: string) => `لا يوجد مقدم خدمة ${cat} مسجل في ${city}. جرب مدينة أخرى.`,
      changerVille: "تغيير المدينة",
      introuvable: "الفئة غير موجودة.",
      retour: "العودة للخدمات",
    },

    // ── Provider card (kept for legacy links) ──
    provider: {
      topVoisins: "موصى به من جيرانك",
      aPartirDe: "ابتداءً من",
      dispoBadge: "متوفر",
      appeler: "اتصل",
      whatsapp: "واتساب",
      voir: "عرض",
      titre: "مقدم الخدمة",
      introuvable: "مقدم الخدمة غير موجود.",
      retour: "العودة إلى الخدمات",
      service: "الخدمة",
      zone: "المنطقة",
      tarif: "السعر التقريبي",
      des: "ابتداءً من",
      dispoAujourdhui: "متوفر اليوم",
      note: "مقدم الخدمة هذا موصى به من سكان حيّك. تواصل معه مباشرة للاتفاق على التفاصيل.",
      contactDirectement: "تواصل مباشرة مع مقدم الخدمة لطلبك",
    },

    // ── City sheet ──
    city: {
      title: "اختر منطقتك",
      searchPlaceholder: "البحث عن مدينة أو حي",
      detecter: "اكتشف موقعي (GPS)",
      detection: "جاري الكشف…",
      prestataires: "مقدمي خدمات",
    },

    // ── Months ──
    months: ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"],
    monthsShort: ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"],

    // ── Time ──
    aLinstant: "الآن",
    ilYA: (n: number, unit: string) => `منذ ${n} ${unit}`,
    min: "د", h: "س", j: "ي",

    // ── Cats service (labels) ──
    catLabels: {
      menage: "تنظيف", plomberie: "سباكة", electricite: "كهرباء", climatisation: "تكييف",
      bricolage: "أعمال يدوية", peinture: "دهان", jardinage: "بستنة", securite: "أمن",
      serrurerie: "أقفال", demenagement: "نقل", "nettoyage-tapis": "تنظيف زرابي", "nettoyage-canape": "تنظيف أرائك",
      piscine: "مسبح", vitres: "تنظيف زجاج", electromenager: "أجهزة منزلية", desinfection: "إبادة حشرات",
    } as Record<string, string>,
    catShorts: {
      menage: "تنظيف", plomberie: "سباك", electricite: "كهربائي", climatisation: "تكييف",
      bricolage: "يدوية", peinture: "دهان", jardinage: "بستنة", securite: "أمن",
      serrurerie: "أقفال", demenagement: "نقل", "nettoyage-tapis": "زرابي", "nettoyage-canape": "أرائك",
      piscine: "مسبح", vitres: "زجاج", electromenager: "أجهزة", desinfection: "حشرات",
    } as Record<string, string>,
  },
} as const;

export type Translations = typeof t.fr;
