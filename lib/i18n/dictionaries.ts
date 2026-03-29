export type Locale = "en" | "ar";

/** Shown together on-screen (English + Arabic) regardless of UI locale. */
export type Bilingual = { en: string; ar: string };

export type Dictionary = {
  meta: { name: string; footerCredit: string };
  nav: {
    dashboard: string;
    medications: string;
    settings: string;
    signIn: string;
    signOut: string;
    about: string;
  };
  landing: {
    title: string;
    subtitle: string;
    /** Primary hero CTA when signed out */
    cta: string;
    openDashboard: string;
    learnMore: string;
    value1Title: string;
    value1Body: string;
    value2Title: string;
    value2Body: string;
    value3Title: string;
    value3Body: string;
    builtTitle: string;
    /** Two paragraphs, separated by blank line — use \\n\\n in string */
    builtBody: string;
    builtBullet1: string;
    builtBullet2: string;
    builtBullet3: string;
    positioningLine: string;
    trustLine: string;
    finalCtaHeading: string;
    finalCtaButton: string;
  };
  about: {
    heroTitle: string;
    heroSubtitle: string;
    labelProblem: string;
    labelApproach: string;
    labelPrinciples: string;
    labelWhat: string;
    problemBody: string;
    approachIntro: string;
    approachBullet1: string;
    approachBullet2: string;
    approachBullet3: string;
    principle1: string;
    principle2: string;
    principle3: string;
    whatIntro: string;
    whatOutro: string;
    final1: string;
    final2: string;
    final3: string;
    cta: string;
  };
  dashboard: {
    title: string;
    dayLabel: string;
    empty: string;
    stats: {
      taken: string;
      snoozed: string;
      missed: string;
      pending: string;
      total: string;
    };
    actions: {
      taken: string;
      snooze: string;
      dismissMissed: string;
    };
    status: {
      taken_on_time: string;
      taken_after_delay: string;
      snoozed: string;
      missed: string;
      pending: string;
    };
    snoozeUntil: string;
    /** Shown under schedule when user snoozed then took (with times). */
    timelineDelayedPrefix: string;
    timelineTakenPrefix: string;
    /** Second timeline row after a snooze while waiting for `snoozeUntil`. */
    timelineNextAlert: string;
    adherenceHeading: string;
    /** Labels for the top-card daily on time / delayed / skipped counts. */
    adherenceDaily: {
      breakdownTitle: string;
      onTime: string;
      delayed: string;
      skipped: string;
    };
    monthlyChartSection: string;
    monthlyChartEmpty: string;
    chartLegendOnTime: string;
    chartLegendDelayed: string;
    chartLegendSkipped: string;
    /** Short label above the rotating daily wellness tip. */
    dailyTipBadge: string;
    dailyTipDismiss: string;
    scheduleSection: string;
    feedSection: string;
    upcomingSection: string;
    activitySection: string;
    feedEmpty: string;
    feedNoUpcomingDose: string;
    /** Placeholders: {name}, {relative} — minutes / hours / days until dose. */
    feedUpcomingDueIn: string;
    feedTaken: string;
    feedMissed: string;
    feedSnoozed: string;
    feedShowMore: string;
    feedShowLess: string;
    alarm: {
      title: string;
      question: string;
      scheduledPrefix: string;
      yes: string;
      no: string;
      snooze: string;
      pickSnooze: string;
      minutes5: string;
      minutes10: string;
      minutes15: string;
      minutes30: string;
    };
  };
  medications: {
    title: string;
    add: string;
    name: string;
    dosage: string;
    notes: string;
    times: string;
    save: string;
    cancel: string;
    empty: string;
    deactivate: string;
    edit: string;
    delete: string;
    scheduleLabel: string;
    nextDoseLabel: string;
    noNextDose: string;
    modalAddTitle: string;
    modalEditTitle: string;
    confirmDelete: string;
    /** Shown after saving a med when earlier today’s reminder times need confirmation. */
    pastDosesTitle: string;
    pastDosesIntro: string;
    pastDosesStep: string;
    pastDosesTook: string;
    pastDosesSkipped: string;
    pastDosesLater: string;
  };
  settings: {
    title: string;
    profile: string;
    profileHint: string;
    age: string;
    sex: string;
    male: string;
    female: string;
    preferNot: string;
    saveProfile: string;
    preferences: string;
    language: string;
    directionLabel: string;
    directionAuto: string;
    timezone: string;
    hint: string;
    english: string;
    arabic: string;
    medicalRecord: string;
    medicalRecordHint: string;
    conditionsField: string;
    allergiesField: string;
    saveMedicalRecord: string;
  };
  common: {
    loading: string;
    error: string;
    /** Clerk signed in but Convex has no JWT (misconfigured Clerk ↔ Convex). */
    authBackendError: string;
  };
  onboarding: {
    pageTitle: Bilingual;
    pageSubtitle: Bilingual;
    stepWord: Bilingual;
    ofWord: Bilingual;
    step1Title: Bilingual;
    step1Subtitle: Bilingual;
    step2Title: Bilingual;
    step2Subtitle: Bilingual;
    step3Title: Bilingual;
    step3Subtitle: Bilingual;
    age: Bilingual;
    sex: Bilingual;
    male: Bilingual;
    female: Bilingual;
    preferNot: Bilingual;
    conditions: Bilingual;
    allergies: Bilingual;
    optionalStepHint: Bilingual;
    medName: Bilingual;
    medDosage: Bilingual;
    schedule: Bilingual;
    scheduleDaily: Bilingual;
    scheduleEveryNDays: Bilingual;
    scheduleWeekly: Bilingual;
    scheduleMonthly: Bilingual;
    intervalDays: Bilingual;
    anchorDay: Bilingual;
    dayOfMonth: Bilingual;
    weekdaysShort: Bilingual[];
    reminderTimes: Bilingual;
    timeHour: Bilingual;
    timeMinute: Bilingual;
    timeAm: Bilingual;
    timePm: Bilingual;
    /** Grey input hints (12h clock). */
    timePlaceholderHour: Bilingual;
    timePlaceholderMinute: Bilingual;
    addTime: Bilingual;
    removeTime: Bilingual;
    duration: Bilingual;
    durationOngoing: Bilingual;
    durationTemporary: Bilingual;
    dateFrom: Bilingual;
    dateTo: Bilingual;
    limitedCourseHint: Bilingual;
    addMedication: Bilingual;
    removeMedication: Bilingual;
    back: Bilingual;
    next: Bilingual;
    finish: Bilingual;
    saving: Bilingual;
    validationAge: Bilingual;
    validationSex: Bilingual;
    validationMedName: Bilingual;
    validationTimes: Bilingual;
    validationReminderTime: Bilingual;
    validationWeekly: Bilingual;
    validationMonthly: Bilingual;
    validationInterval: Bilingual;
    validationDates: Bilingual;
    validationAtLeastOneMed: Bilingual;
  };
};

const ONBOARDING: Dictionary["onboarding"] = {
  pageTitle: { en: "Welcome to Capsule", ar: "مرحبًا بك في كابسول" },
  pageSubtitle: {
    en: "A few quick steps to personalize reminders and safety.",
    ar: "خطوات سريعة لتخصيص التذكيرات والسلامة.",
  },
  stepWord: { en: "Step", ar: "الخطوة" },
  ofWord: { en: "of", ar: "من" },
  step1Title: { en: "Basic info", ar: "المعلومات الأساسية" },
  step1Subtitle: {
    en: "Helps us tailor your experience.",
    ar: "تساعدنا على تخصيص تجربتك.",
  },
  step2Title: { en: "Medical context", ar: "السياق الطبي" },
  step2Subtitle: {
    en: "Optional — add conditions or allergies you want on record.",
    ar: "اختياري — أضف الحالات أو الحساسيات التي تود حفظها.",
  },
  step3Title: { en: "Medications", ar: "الأدوية" },
  step3Subtitle: {
    en: "Add what you take — you can edit this anytime.",
    ar: "أضف ما تتناوله — يمكنك التعديل لاحقًا في أي وقت.",
  },
  age: { en: "Age", ar: "العمر" },
  sex: { en: "Sex", ar: "الجنس" },
  male: { en: "Male", ar: "ذكر" },
  female: { en: "Female", ar: "أنثى" },
  preferNot: { en: "Prefer not to say", ar: "أفضل عدم الإفصاح" },
  conditions: { en: "Conditions", ar: "الحالات" },
  allergies: { en: "Allergies", ar: "الحساسية" },
  optionalStepHint: {
    en: "You can skip details you are not comfortable sharing.",
    ar: "يمكنك تخطي التفاصيل التي لا ترغب بمشاركتها.",
  },
  medName: { en: "Medication name", ar: "اسم الدواء" },
  medDosage: { en: "Dosage", ar: "الجرعة" },
  schedule: { en: "Schedule", ar: "الجدول" },
  scheduleDaily: { en: "Daily", ar: "يوميًا" },
  scheduleEveryNDays: { en: "Every X days", ar: "كل X أيام" },
  scheduleWeekly: { en: "Weekly", ar: "أسبوعيًا" },
  scheduleMonthly: { en: "Monthly", ar: "شهريًا" },
  intervalDays: { en: "Every how many days?", ar: "كل كم يومًا؟" },
  anchorDay: {
    en: "Cycle start (first dose day)",
    ar: "بداية الدورة (أول يوم جرعة)",
  },
  dayOfMonth: { en: "Day of month (1–31)", ar: "يوم الشهر (١–٣١)" },
  weekdaysShort: [
    { en: "Sun", ar: "أحد" },
    { en: "Mon", ar: "إثنين" },
    { en: "Tue", ar: "ثلاثاء" },
    { en: "Wed", ar: "أربعاء" },
    { en: "Thu", ar: "خميس" },
    { en: "Fri", ar: "جمعة" },
    { en: "Sat", ar: "سبت" },
  ],
  reminderTimes: { en: "Reminder times", ar: "أوقات التذكير" },
  timeHour: { en: "Hour", ar: "الساعة" },
  timeMinute: { en: "Minute", ar: "الدقيقة" },
  timeAm: { en: "AM", ar: "ص" },
  timePm: { en: "PM", ar: "م" },
  timePlaceholderHour: { en: "8", ar: "8" },
  timePlaceholderMinute: { en: "30", ar: "30" },
  addTime: { en: "Add time", ar: "إضافة وقت" },
  removeTime: { en: "Remove", ar: "إزالة" },
  duration: { en: "Treatment period", ar: "مدة العلاج" },
  durationOngoing: { en: "Ongoing / fixed", ar: "مستمر / غير محدد المدة" },
  durationTemporary: { en: "Temporary course", ar: "علاج مؤقت" },
  dateFrom: { en: "From", ar: "من" },
  dateTo: { en: "To", ar: "إلى" },
  limitedCourseHint: {
    en: "Pick the start and end dates for this course.",
    ar: "اختر تاريخ البداية والنهاية لهذا العلاج.",
  },
  addMedication: { en: "Add another medication", ar: "إضافة دواء آخر" },
  removeMedication: { en: "Remove medication", ar: "حذف الدواء" },
  back: { en: "Back", ar: "رجوع" },
  next: { en: "Continue", ar: "متابعة" },
  finish: { en: "Finish & go to dashboard", ar: "إنهاء والانتقال للوحة التحكم" },
  saving: { en: "Saving…", ar: "جاري الحفظ…" },
  validationAge: {
    en: "Enter a valid age between 1 and 120.",
    ar: "أدخل عمرًا صالحًا بين ١ و١٢٠.",
  },
  validationSex: {
    en: "Please select an option.",
    ar: "يرجى اختيار أحد الخيارات.",
  },
  validationMedName: {
    en: "Each medication needs a name.",
    ar: "كل دواء يحتاج اسمًا.",
  },
  validationTimes: {
    en: "Add at least one reminder time per medication.",
    ar: "أضف وقت تذكير واحدًا على الأقل لكل دواء.",
  },
  validationReminderTime: {
    en: "Please complete the rest of the information for this medication, including reminder times.",
    ar: "يُرجى إكمال بقية المعلومات لهذا الدواء، بما فيها أوقات التذكير.",
  },
  validationWeekly: {
    en: "Select at least one weekday.",
    ar: "اختر يومًا واحدًا على الأقل في الأسبوع.",
  },
  validationMonthly: {
    en: "Enter a valid day of month (1–31).",
    ar: "أدخل يومًا صالحًا من الشهر (١–٣١).",
  },
  validationInterval: {
    en: "Interval must be between 1 and 365 days.",
    ar: "يجب أن يكون الفاصل بين ١ و٣٦٥ يومًا.",
  },
  validationDates: {
    en: "Choose both start and end dates for temporary courses.",
    ar: "اختر تاريخي البداية والنهاية للعلاج المؤقت.",
  },
  validationAtLeastOneMed: {
    en: "Add at least one medication to continue.",
    ar: "أضف دواءً واحدًا على الأقل للمتابعة.",
  },
};

const en: Dictionary = {
  meta: {
    name: "Capsule",
    footerCredit: "Made by Rahaf Alhamoud",
  },
  nav: {
    dashboard: "Dashboard",
    medications: "Medications",
    settings: "Settings",
    signIn: "Sign in",
    signOut: "Sign out",
    about: "About",
  },
  landing: {
    title: "Stay consistent with your medication — without the noise",
    subtitle:
      "Capsule gives you a clear schedule, precise alerts, and a calm view of your daily adherence.",
    cta: "Get started",
    openDashboard: "Open dashboard",
    learnMore: "Learn more",
    value1Title: "A single, reliable schedule",
    value1Body:
      "All your medications organized into one clear daily timeline.",
    value2Title: "Alerts that demand attention",
    value2Body: "Full-screen reminders so nothing gets missed.",
    value3Title: "Clarity over clutter",
    value3Body: "See what you took, snoozed, or missed instantly.",
    builtTitle: "Built for real adherence",
    builtBody:
      "Capsule is not just a tracker.\n\nIt helps you stay consistent through structured alerts, clear feedback, and simple daily interaction.",
    builtBullet1: "Interruptive reminders when it matters",
    builtBullet2: "Clear feedback on your behavior",
    builtBullet3: "A system you can rely on daily",
    positioningLine:
      "Built for focus, consistency, and trust — not distractions.",
    trustLine:
      "Your data stays private and securely synced across your account.",
    finalCtaHeading: "Start managing your medication clearly",
    finalCtaButton: "Create your Capsule account",
  },
  about: {
    heroTitle: "What Capsule is built for",
    heroSubtitle:
      "A system designed to help people stay consistent with their medication.",
    labelProblem: "The problem",
    labelApproach: "The approach",
    labelPrinciples: "Principles",
    labelWhat: "What Capsule is",
    problemBody:
      "Medication adherence is often inconsistent.\n\nPeople forget, delay, or lose track — not because they don’t care, but because systems around them are unclear or overwhelming.",
    approachIntro:
      "Capsule focuses on clarity and structure.\n\nIt replaces complexity with a simple system:",
    approachBullet1: "Clear schedules",
    approachBullet2: "Direct alerts",
    approachBullet3: "Immediate feedback",
    principle1: "Clarity over clutter",
    principle2: "Consistency over intensity",
    principle3: "Trust over complexity",
    whatIntro: "Capsule is not just a tracker.",
    whatOutro:
      "It is a system that helps you stay aware, respond on time, and understand your habits.",
    final1: "Built to be simple.",
    final2: "Built to be reliable.",
    final3: "Built to be used every day.",
    cta: "Create your account",
  },
  dashboard: {
    title: "Today",
    dayLabel: "Schedule",
    empty: "No doses scheduled for this day. Add medications to see reminders.",
    stats: {
      taken: "On time",
      snoozed: "Delayed",
      missed: "Skipped",
      pending: "Upcoming / due",
      total: "Total doses",
    },
    actions: {
      taken: "Mark taken",
      snooze: "Snooze 15 min",
      dismissMissed: "Mark as missed",
    },
    status: {
      taken_on_time: "Taken on time",
      taken_after_delay: "Taken after delay",
      snoozed: "Snoozed",
      missed: "Missed",
      pending: "Due",
    },
    snoozeUntil: "Alert again at",
    timelineDelayedPrefix: "Delayed at",
    timelineTakenPrefix: "Taken at",
    timelineNextAlert: "Next alert",
    adherenceHeading: "Today’s adherence",
    adherenceDaily: {
      breakdownTitle: "Today’s doses",
      onTime: "On time",
      delayed: "Delayed",
      skipped: "Skipped",
    },
    monthlyChartSection: "Monthly adherence",
    monthlyChartEmpty: "No monthly history yet. Data appears after your first full month on Capsule.",
    chartLegendOnTime: "On time",
    chartLegendDelayed: "Delayed",
    chartLegendSkipped: "Skipped",
    dailyTipBadge: "Today’s tip",
    dailyTipDismiss: "Dismiss tip",
    scheduleSection: "Today’s schedule",
    feedSection: "Alerts & activity",
    upcomingSection: "Upcoming",
    activitySection: "Recent activity",
    feedEmpty: "No alerts yet. Your medication actions will appear here.",
    feedNoUpcomingDose: "No upcoming doses scheduled.",
    feedUpcomingDueIn: "{name} · due in {relative}",
    feedTaken: "You took {name}",
    feedMissed: "Missed dose · {name}",
    feedSnoozed: "Snoozed {minutes} min · {name}",
    feedShowMore: "More",
    feedShowLess: "Less",
    alarm: {
      title: "Medication reminder",
      question: "Did you take this medication?",
      scheduledPrefix: "Scheduled for",
      yes: "Yes, I took it",
      no: "No, I missed it",
      snooze: "Snooze",
      pickSnooze: "Remind me in…",
      minutes5: "5 minutes",
      minutes10: "10 minutes",
      minutes15: "15 minutes",
      minutes30: "30 minutes",
    },
  },
  medications: {
    title: "Medications",
    add: "Add medication",
    name: "Name",
    dosage: "Dosage (optional)",
    notes: "Notes (optional)",
    times: "Reminder times",
    save: "Save",
    cancel: "Cancel",
    empty: "No medications yet.",
    deactivate: "Archive",
    edit: "Edit",
    delete: "Delete",
    scheduleLabel: "Schedule",
    nextDoseLabel: "Next dose",
    noNextDose: "None scheduled",
    modalAddTitle: "Add medication",
    modalEditTitle: "Edit medication",
    confirmDelete: "Remove this medication from your active list?",
    pastDosesTitle: "Earlier doses today",
    pastDosesIntro:
      "You added or updated this medication after some of today’s reminder times. Did you already take those doses?",
    pastDosesStep: "{current} of {total}",
    pastDosesTook: "Yes, I took it",
    pastDosesSkipped: "No, I skipped it",
    pastDosesLater: "Ask me later",
  },
  settings: {
    title: "Settings",
    profile: "Profile",
    profileHint: "Basic information used to personalize Capsule.",
    age: "Age",
    sex: "Sex",
    male: "Male",
    female: "Female",
    preferNot: "Prefer not to say",
    saveProfile: "Save profile",
    preferences: "Preferences",
    language: "Language",
    directionLabel: "Layout direction",
    directionAuto: "Follows language — English LTR, Arabic RTL.",
    timezone: "Timezone",
    hint: "Reminder times use this timezone.",
    english: "English",
    arabic: "Arabic",
    medicalRecord: "Medical record",
    medicalRecordHint:
      "Optional — conditions and allergies for your reference. Not shared automatically.",
    conditionsField: "Medical conditions / issues",
    allergiesField: "Allergies",
    saveMedicalRecord: "Save medical record",
  },
  common: {
    loading: "Loading…",
    error: "Something went wrong.",
    authBackendError:
      "Could not sync your account with the app. In the Clerk dashboard, add the Convex integration or a JWT template named “convex”, then reload. See Convex docs: Clerk + Convex authentication.",
  },
  onboarding: ONBOARDING,
};

const ar: Dictionary = {
  meta: {
    name: "كابسول",
    footerCredit: "من إعداد رهف الحمود",
  },
  nav: {
    dashboard: "لوحة التحكم",
    medications: "الأدوية",
    settings: "الإعدادات",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    about: "من نحن",
  },
  landing: {
    title: "التزم بأدويتك… بدون تعقيد أو تشتيت",
    subtitle:
      "كابسول يمنحك جدولًا واضحًا، تنبيهات دقيقة، ورؤية هادئة لالتزامك اليومي.",
    cta: "ابدأ الآن",
    openDashboard: "فتح لوحة التحكم",
    learnMore: "اعرف المزيد",
    value1Title: "جدول واحد يمكنك الاعتماد عليه",
    value1Body: "جميع أدويتك منظمة في مخطط يومي واضح.",
    value2Title: "تنبيهات لا يمكن تجاهلها",
    value2Body: "تذكيرات بملء الشاشة حتى لا تفوّت أي جرعة.",
    value3Title: "وضوح بدون فوضى",
    value3Body: "اطّلع فورًا على ما تم أخذه أو تأجيله أو تفويته.",
    builtTitle: "مصمم لالتزام حقيقي",
    builtBody:
      "كابسول ليس مجرد أداة تتبع.\n\nبل يساعدك على الالتزام من خلال تنبيهات منظمة، وردود واضحة، وتجربة يومية بسيطة.",
    builtBullet1: "تنبيهات تتدخل في الوقت المناسب",
    builtBullet2: "تغذية راجعة واضحة لسلوكك",
    builtBullet3: "نظام يمكنك الاعتماد عليه يوميًا",
    positioningLine: "مصمم للتركيز والانضباط والثقة — لا للتشتيت.",
    trustLine:
      "بياناتك تبقى خاصة ويتم مزامنتها بأمان عبر حسابك.",
    finalCtaHeading: "ابدأ إدارة أدويتك بوضوح",
    finalCtaButton: "أنشئ حسابك في كابسول",
  },
  about: {
    heroTitle: "لماذا تم بناء كابسول",
    heroSubtitle: "نظام مصمم لمساعدة الأشخاص على الالتزام بأدويتهم.",
    labelProblem: "المشكلة",
    labelApproach: "النهج",
    labelPrinciples: "المبادئ",
    labelWhat: "ما هو كابسول",
    problemBody:
      "الالتزام بالأدوية غالبًا ما يكون غير منتظم.\n\nينسى الناس أو يؤجلون أو يفقدون المتابعة — ليس لعدم الاهتمام، بل لأن الأنظمة من حولهم غير واضحة أو معقدة.",
    approachIntro:
      "يركّز كابسول على الوضوح والتنظيم.\n\nيستبدل التعقيد بنظام بسيط:",
    approachBullet1: "جداول واضحة",
    approachBullet2: "تنبيهات مباشرة",
    approachBullet3: "تغذية راجعة فورية",
    principle1: "الوضوح بدل الفوضى",
    principle2: "الاستمرارية بدل المبالغة",
    principle3: "الثقة بدل التعقيد",
    whatIntro: "كابسول ليس مجرد أداة تتبع.",
    whatOutro:
      "بل نظام يساعدك على الوعي، والاستجابة في الوقت المناسب، وفهم عاداتك.",
    final1: "مصمم ليكون بسيطًا",
    final2: "مصمم ليكون موثوقًا",
    final3: "مصمم ليُستخدم يوميًا",
    cta: "أنشئ حسابك",
  },
  dashboard: {
    title: "اليوم",
    dayLabel: "الجدول",
    empty: "لا توجد جرعات مجدولة لهذا اليوم. أضف أدوية لعرض التذكيرات.",
    stats: {
      taken: "في الوقت",
      snoozed: "مؤجّل",
      missed: "فائت",
      pending: "قادم / مستحق",
      total: "إجمالي الجرعات",
    },
    actions: {
      taken: "تسجيل أخذ الدواء",
      snooze: "تأجيل ١٥ دقيقة",
      dismissMissed: "تسجيل كفائت",
    },
    status: {
      taken_on_time: "أُخذ في الوقت",
      taken_after_delay: "أُخذ بعد التأجيل",
      snoozed: "مؤجّل",
      missed: "فائت",
      pending: "مستحق",
    },
    snoozeUntil: "تنبيه مرة أخرى في",
    timelineDelayedPrefix: "أُجّل في",
    timelineTakenPrefix: "أُخذ في",
    timelineNextAlert: "التنبيه التالي",
    adherenceHeading: "التزام اليوم",
    adherenceDaily: {
      breakdownTitle: "جرعات اليوم",
      onTime: "في الوقت",
      delayed: "مؤجّل",
      skipped: "متخطّاة",
    },
    monthlyChartSection: "الالتزام الشهري",
    monthlyChartEmpty: "لا يوجد تاريخ شهري بعد. يظهر البيان بعد أول شهر كامل في كابسول.",
    chartLegendOnTime: "في الوقت",
    chartLegendDelayed: "مؤجّل",
    chartLegendSkipped: "متخطّاة",
    dailyTipBadge: "نصيحة اليوم",
    dailyTipDismiss: "إغلاق النصيحة",
    scheduleSection: "جدول اليوم",
    feedSection: "التنبيهات والنشاط",
    upcomingSection: "قادم",
    activitySection: "النشاط الأخير",
    feedEmpty: "لا توجد تنبيهات بعد. ستظهر هنا إجراءات الأدوية.",
    feedNoUpcomingDose: "لا توجد جرعات قادمة مجدولة.",
    feedUpcomingDueIn: "{name} · بعد {relative}",
    feedTaken: "لقد أخذت {name}",
    feedMissed: "جرعة فائتة · {name}",
    feedSnoozed: "مؤجّل {minutes} د · {name}",
    feedShowMore: "المزيد",
    feedShowLess: "إظهار أقل",
    alarm: {
      title: "تذكير دواء",
      question: "هل تناولت هذا الدواء؟",
      scheduledPrefix: "مجدول في",
      yes: "نعم، تناولته",
      no: "لا، فاتني",
      snooze: "تأجيل",
      pickSnooze: "ذكّرني بعد…",
      minutes5: "٥ دقائق",
      minutes10: "١٠ دقائق",
      minutes15: "١٥ دقيقة",
      minutes30: "٣٠ دقيقة",
    },
  },
  medications: {
    title: "الأدوية",
    add: "إضافة دواء",
    name: "الاسم",
    dosage: "الجرعة (اختياري)",
    notes: "ملاحظات (اختياري)",
    times: "أوقات التذكير",
    save: "حفظ",
    cancel: "إلغاء",
    empty: "لا توجد أدوية بعد.",
    deactivate: "أرشفة",
    edit: "تعديل",
    delete: "حذف",
    scheduleLabel: "الجدول",
    nextDoseLabel: "الجرعة القادمة",
    noNextDose: "لا يوجد موعد",
    modalAddTitle: "إضافة دواء",
    modalEditTitle: "تعديل الدواء",
    confirmDelete: "إزالة هذا الدواء من القائمة النشطة؟",
    pastDosesTitle: "جرعات اليوم السابقة",
    pastDosesIntro:
      "أضفت أو حدّثت هذا الدواء بعد بعض أوقات التذكير اليوم. هل أخذت تلك الجرعات؟",
    pastDosesStep: "{current} من {total}",
    pastDosesTook: "نعم، أخذتها",
    pastDosesSkipped: "لا، لم آخذها",
    pastDosesLater: "ذكّرني لاحقاً",
  },
  settings: {
    title: "الإعدادات",
    profile: "الملف الشخصي",
    profileHint: "معلومات أساسية لتخصيص كابسول.",
    age: "العمر",
    sex: "الجنس",
    male: "ذكر",
    female: "أنثى",
    preferNot: "أفضل عدم الإفصاح",
    saveProfile: "حفظ الملف",
    preferences: "التفضيلات",
    language: "اللغة",
    directionLabel: "اتجاه العرض",
    directionAuto: "يتبع اللغة — الإنجليزية من اليسار لليمين، العربية من اليمين لليسار.",
    timezone: "المنطقة الزمنية",
    hint: "تُستخدم هذه المنطقة لأوقات التذكير.",
    english: "الإنجليزية",
    arabic: "العربية",
    medicalRecord: "السجل الطبي",
    medicalRecordHint:
      "اختياري — الحالات والحساسية لمرجعيتك الشخصية. لا تُشارك تلقائياً.",
    conditionsField: "الحالات الصحية / المشكلات",
    allergiesField: "الحساسية",
    saveMedicalRecord: "حفظ السجل الطبي",
  },
  common: {
    loading: "جاري التحميل…",
    error: "حدث خطأ ما.",
    authBackendError:
      "تعذّر مزامنة حسابك مع التطبيق. في لوحة Clerk، أضف تكامل Convex أو قالب JWT باسم «convex» ثم أعد التحميل. راجع وثائق Convex: مصادقة Clerk مع Convex.",
  },
  onboarding: ONBOARDING,
};

export const dictionaries: Record<Locale, Dictionary> = { en, ar };
