import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isRtl: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Platform & Header
    'brand.name': 'WESAL',
    'brand.arabic': 'وصل',
    'brand.subtitle': 'Smart Visitor Management & Access Control',
    'hospital.name': 'Sultan Qaboos Hospital',
    'hospital.location': 'Salalah, Sultanate of Oman',
    'hospital.ministry': 'Ministry of Health, Oman',
    'vision.badge': 'Prototype for Vision 2040',
    'sync.active': 'Gate Sync Active',
    'sync.connecting': 'Connecting...',
    'role.admin': 'Admin',
    'role.reception': 'Reception',
    'role.security': 'Security',
    'role.management': 'Management',
    'role.label': 'Role',
    'btn.signout': 'Sign Out',
    'btn.smart_gate': 'Smart Gate',
    'btn.demo_simulator': 'Demo Simulator',

    // Navigation
    'nav.operations': 'Operations & Gates',
    'nav.management': 'Management & Oversight',
    'nav.dashboard': 'Dashboard',
    'nav.reception': 'Reception Desk',
    'nav.gate': 'Smart Gate Scanner',
    'nav.live': 'Live Control Room',
    'nav.passes': 'Visitor Passes',
    'nav.visitors': 'Visitors Directory',
    'nav.patients': 'Patients & Bedside',
    'nav.checkpoints': 'Gate Checkpoints',
    'nav.alerts': 'Alerts & SMS',
    'nav.reports': 'Operational Reports',
    'nav.settings': 'Hospital Policies',
    'nav.demo': 'Demo Controller',

    // Dashboard
    'dash.title': 'Visitor Control Center',
    'dash.subtitle': 'Real-time checkpoint monitoring, smart gate access enforcement & duration management',
    'dash.kpi.inside': 'Visitors Inside',
    'dash.kpi.today': 'Visitors Today',
    'dash.kpi.checked_out': 'Checked Out',
    'dash.kpi.overdue': 'Overdue',
    'dash.kpi.denied': 'Denied Entries',
    'dash.kpi.passes': 'Active Passes',
    'dash.kpi.active_pulse': 'Active',
    'dash.kpi.alert_sent': 'Alert Sent',
    'dash.traffic.title': 'Hospital Traffic (Entries vs Exits)',
    'dash.traffic.subtitle': 'Checkpoint gate flow volume over time',
    'dash.traffic.entries': 'Entries',
    'dash.traffic.exits': 'Exits',
    'dash.ward_occupancy.title': 'Ward Occupancy',
    'dash.ward_occupancy.subtitle': 'Live visitors vs ward capacity',
    'dash.table.title': 'Live Visitor Activity & Tracking',
    'dash.table.subtitle': 'Showing active, ending-soon, and overdue visits inside Sultan Qaboos Hospital',
    'dash.filter.all': 'All',
    'dash.filter.inside': 'Inside',
    'dash.filter.overdue': 'Overdue',
    'dash.filter.checked_out': 'Checked Out',
    'dash.search_placeholder': 'Search visitor, patient, pass...',

    // Table Headers
    'th.visitor': 'Visitor',
    'th.pass_id': 'Pass ID',
    'th.patient_room': 'Patient & Room',
    'th.ward': 'Ward',
    'th.last_location': 'Last Known Location',
    'th.entry_time': 'Entry Time',
    'th.allowed_until': 'Allowed Until',
    'th.remaining_time': 'Remaining Time',
    'th.status': 'Status',
    'th.actions': 'Actions',

    // Statuses
    'status.active': 'ACTIVE',
    'status.ending_soon': 'ENDING SOON',
    'status.overdue': 'OVERDUE',
    'status.checked_out': 'CHECKED OUT',
    'status.denied': 'DENIED',
    'status.registered': 'REGISTERED',

    // Gate Scanner
    'gate.title': 'Sultan Qaboos Hospital Access Control',
    'gate.subtitle': 'Automated optical gate verification, bedside capacity lock & checkpoint zone logging',
    'gate.current_cp': 'Current Checkpoint',
    'gate.camera_title': 'Optical Camera Scanner',
    'gate.camera_start': 'Start Camera Scanner',
    'gate.camera_stop': 'Stop Camera',
    'gate.scan_prompt': 'SCAN VISITOR QR CODE',
    'gate.scan_hint': "Position the visitor's printed or mobile QR code in front of the lens.",
    'gate.manual_placeholder': 'Enter QR token or Pass Code (e.g. WES-000101)...',
    'gate.verify_btn': 'Verify',
    'gate.granted': '✓ ACCESS GRANTED',
    'gate.checkout_granted': '✓ CHECKOUT SUCCESSFUL',
    'gate.denied': '✕ ACCESS DENIED',
    'gate.quick_keypad': 'Live Testing Keypad',
    'gate.quick_keypad_desc': 'Click any pass below to simulate a gate scan',
    'gate.test_invalid': 'Test Invalid QR',

    // Reception
    'rec.title': 'Visitor Registration Desk',
    'rec.subtitle': 'Reception Desk • Sultan Qaboos Hospital Smart Pass Issuance',
    'rec.step1': 'Find Patient',
    'rec.step2': 'Visitor Info',
    'rec.step3': 'Visit Permission',
    'rec.step4': 'QR Pass',
    'rec.search_patient_title': 'Step 1 — Search Hospital Patient',
    'rec.search_patient_subtitle': 'Lookup patient by name, hospital number (e.g. P00021), or room number to verify bedside capacity.',
    'rec.search_patient_placeholder': 'Search by patient name (e.g. Ahmed, Salim), hospital #, or room...',
    'rec.bedside_capacity': 'Bedside',
    'rec.visitor_info_title': 'Step 2 — Visitor Personal Information',
    'rec.visitor_info_subtitle': 'Register visitor identity for smart gate access control and SMS notifications.',
    'rec.full_name': 'Full Name *',
    'rec.civil_id': 'Civil ID / National Identification *',
    'rec.mobile': 'Mobile Number (for SMS & Alerts) *',
    'rec.type': 'Visitor Type *',
    'rec.type_visitor': 'Standard Visitor (زائر)',
    'rec.type_companion': 'Patient Companion (مرافق مريض)',
    'rec.relationship': 'Relationship to Patient (Optional)',
    'rec.notes': 'Notes / Purpose of Visit (Optional)',
    'rec.btn_continue': 'Continue to Visit Permission',
    'rec.permission_title': 'Step 3 — Visit Permission & Timing Parameters',
    'rec.duration_title': 'Visit Duration Limit',
    'rec.demo_mode_badge': 'Official Demo Mode',
    'rec.generate_pass_btn': 'Generate Scannable QR Pass',
    'rec.pass_ready_title': 'QR Visitor Pass Generated Successfully!',
    'rec.print_badge_btn': 'Print Visitor Badge (A6/A4)',
    'rec.another_visitor': 'Register Another Visitor',

    // Pass
    'pass.header_title': 'WESAL VISITOR PASS',
    'pass.ministry_header': 'SULTANATE OF OMAN • MINISTRY OF HEALTH',
    'pass.visitor': 'Visitor Name:',
    'pass.patient': 'Patient:',
    'pass.destination': 'Destination:',
    'pass.duration': 'Allowed Duration:',
    'pass.code': 'Pass Code:',
    'pass.status': 'Pass Status:',
    'pass.footer_note': 'Scan this pass at Main Entrance (CP-01) and Exit Gate (CP-07). Pass is permanently invalidated upon exit.',

    // Live Monitor
    'live.title': 'WESAL LIVE',
    'live.badge': 'REAL-TIME CONTROL',
    'live.subtitle': 'Sultan Qaboos Hospital • Central Operations Security Monitor',
    'live.inside': 'Currently Inside',
    'live.ending_soon': 'Ending Soon',
    'live.overdue': 'Overdue',
    'live.fullscreen': 'Fullscreen Display',
    'live.stream_title': 'Real-time Active Visits Stream',

    // Alerts
    'alerts.title': 'Notification Center & SMS Simulator',
    'alerts.subtitle': 'Automated visitor SMS duration warnings, security alerts & simulated delivery preview',
    'alerts.dispatch_title': 'Dispatch SMS Alert',
    'alerts.dispatch_btn': 'Dispatch Simulated SMS',

    // Common Buttons
    'btn.back': 'Back',
    'btn.print': 'Print',
    'btn.export_csv': 'Export CSV',
    'btn.refresh': 'Refresh',
    'btn.checkout': 'Checkout',
  },
  ar: {
    // Platform & Header
    'brand.name': 'وصل',
    'brand.arabic': 'WESAL',
    'brand.subtitle': 'المنظومة الذكية لإدارة الزوار والتحكم في الدخول',
    'hospital.name': 'مستشفى السلطان قابوس',
    'hospital.location': 'صلالة، سلطنة عُمان',
    'hospital.ministry': 'وزارة الصحة — سلطنة عُمان',
    'vision.badge': 'نموذج تطبيقي لرؤية عُمان 2040',
    'sync.active': 'مزامنة البوابات متصلة',
    'sync.connecting': 'جارٍ الاتصال...',
    'role.admin': 'مسؤول النظام (Admin)',
    'role.reception': 'موظف الاستقبال',
    'role.security': 'الأمن والسلامة',
    'role.management': 'الإدارة والإشراف',
    'role.label': 'الدور',
    'btn.signout': 'تسجيل الخروج',
    'btn.smart_gate': 'البوابة الذكية',
    'btn.demo_simulator': 'جهاز المحاكاة',

    // Navigation
    'nav.operations': 'العمليات والبوابات',
    'nav.management': 'الإدارة والرقابة',
    'nav.dashboard': 'لوحة التحكم المركزية',
    'nav.reception': 'مكتب الاستقبال والتسجيل',
    'nav.gate': 'ماسح البوابة الذكية',
    'nav.live': 'غرفة المراقبة المباشرة',
    'nav.passes': 'تصاريح الزوار والمرافقين',
    'nav.visitors': 'دليل الزوار',
    'nav.patients': 'المرضى وسعة الأسرة',
    'nav.checkpoints': 'نقاط التفتيش والبوابات',
    'nav.alerts': 'مركز التنبيهات والرسائل',
    'nav.reports': 'التقارير التشغيلية والتدقيق',
    'nav.settings': 'سياسات الزيارة والإعدادات',
    'nav.demo': 'لوحة المحاكاة التفاعلية',

    // Dashboard
    'dash.title': 'مركز التحكم في الزوار',
    'dash.subtitle': 'المراقبة الميدانية المباشرة لنقاط التفتيش، تطبيق حدود الزيارة والتحكم في السعة السريرية',
    'dash.kpi.inside': 'الزوار بالداخل',
    'dash.kpi.today': 'إجمالي زوار اليوم',
    'dash.kpi.checked_out': 'تم تسجيل الخروج',
    'dash.kpi.overdue': 'تجاوزوا وقت الزيارة',
    'dash.kpi.denied': 'محاولات الدخول المرفوضة',
    'dash.kpi.passes': 'التصاريح النشطة',
    'dash.kpi.active_pulse': 'نشط الآن',
    'dash.kpi.alert_sent': 'تم إرسال إنذار',
    'dash.traffic.title': 'حركة الدخول والخروج في المستشفى',
    'dash.traffic.subtitle': 'حجم تدفق الزوار عبر بوابات المستشفى على مدار اليوم',
    'dash.traffic.entries': 'الدخول',
    'dash.traffic.exits': 'الخروج',
    'dash.ward_occupancy.title': 'نسبة إشغال الأجنحة الطبية',
    'dash.ward_occupancy.subtitle': 'عدد الزوار الفعلي مقابل الطاقة الاستيعابية للجناح',
    'dash.table.title': 'سجل حركة الزوار والتتبع المباشر',
    'dash.table.subtitle': 'عرض حي للزوار المتواجدين حالياً في أجنحة مستشفى السلطان قابوس',
    'dash.filter.all': 'الكل',
    'dash.filter.inside': 'المتواجدون بالداخل',
    'dash.filter.overdue': 'المتأخرون (Overdue)',
    'dash.filter.checked_out': 'من تم خروجهم',
    'dash.search_placeholder': 'بحث باسم الزائر، المريض، أو التصريح...',

    // Table Headers
    'th.visitor': 'الزائر / المرافق',
    'th.pass_id': 'رمز التصريح',
    'th.patient_room': 'المريض والغرفة',
    'th.ward': 'الجناح الطبي',
    'th.last_location': 'آخر موقع مسجل',
    'th.entry_time': 'وقت الدخول',
    'th.allowed_until': 'مصرح حتى',
    'th.remaining_time': 'الوقت المتبقي',
    'th.status': 'الحالة',
    'th.actions': 'الإجراءات',

    // Statuses
    'status.active': 'نشط (ACTIVE)',
    'status.ending_soon': 'أوشك على الانتهاء',
    'status.overdue': 'متأخر (OVERDUE)',
    'status.checked_out': 'غادر المستشفى',
    'status.denied': 'مرفوض',
    'status.registered': 'تم التسجيل',

    // Gate Scanner
    'gate.title': 'نظام التحكم الذكي في بوابات مستشفى السلطان قابوس',
    'gate.subtitle': 'التحقق البصري الآلي من الباركود، قفل سعة الأسرة، وتوثيق نقاط العبور',
    'gate.current_cp': 'نقطة التفتيش الحالية',
    'gate.camera_title': 'القارئ البصري الذكي للكاميرا',
    'gate.camera_start': 'تشغيل كاميرا المسح',
    'gate.camera_stop': 'إيقاف الكاميرا',
    'gate.scan_prompt': 'امسح رمز الاستجابة السريعة (QR) للزائر',
    'gate.scan_hint': 'قم بتوجيه رمز QR المطبوع أو من الهاتف أمام عدسة القارئ البصري.',
    'gate.manual_placeholder': 'أدخل رمز التصريح أو التوكن يدوياً (مثال: WES-000101)...',
    'gate.verify_btn': 'تحقق وافتح البوابة',
    'gate.granted': '✓ تم السماح بالدخول (ACCESS GRANTED)',
    'gate.checkout_granted': '✓ تم تسجيل الخروج بنجاح (CHECKOUT)',
    'gate.denied': '✕ تم رفض الدخول (ACCESS DENIED)',
    'gate.quick_keypad': 'لوحة الاختبار السريع التفاعلية',
    'gate.quick_keypad_desc': 'انقر على أي تصريح أدناه لمحاكاة قراءة البوابة فورياً',
    'gate.test_invalid': 'تجربة رمز QR غير صالح',

    // Reception
    'rec.title': 'مكتب تسجيل واستقبال الزوار والمرافقين',
    'rec.subtitle': 'مكتب الاستقبال • إصدار تصاريح الدخول الذكية بمستشفى السلطان قابوس',
    'rec.step1': 'اختيار المريض',
    'rec.step2': 'بيانات الزائر',
    'rec.step3': 'صلاحية الزيارة',
    'rec.step4': 'إصدار تصريح QR',
    'rec.search_patient_title': 'الخطوة 1 — البحث عن مريض منوم',
    'rec.search_patient_subtitle': 'البحث بالاسم، الرقم الصحي للمريض، أو رقم الغرفة للتأكد من سعة السرير المتاحة.',
    'rec.search_patient_placeholder': 'ابحث باسم المريض (مثال: أحمد، سالم)، الرقم الصحي، أو الغرفة...',
    'rec.bedside_capacity': 'عند السرير',
    'rec.visitor_info_title': 'الخطوة 2 — البيانات الشخصية للزائر أو المرافق',
    'rec.visitor_info_subtitle': 'تسجيل هوية الزائر للتحكم في بوابات الدخول وإرسال رسائل التنبيه النصية.',
    'rec.full_name': 'الاسم الثلاثي والقبيلة *',
    'rec.civil_id': 'الرقم المدني / بطاقة الهوية *',
    'rec.mobile': 'رقم الهاتف المتنقل (لإرسال الرسائل النصية) *',
    'rec.type': 'نوع المصرح له *',
    'rec.type_visitor': 'زائر اعتيادي (Visitor)',
    'rec.type_companion': 'مرافق مريض (Companion)',
    'rec.relationship': 'صلة القرابة بالمريض (اختياري)',
    'rec.notes': 'ملاحظات / سبب الزيارة (اختياري)',
    'rec.btn_continue': 'متابعة إلى تحديد صلاحية الزيارة',
    'rec.permission_title': 'الخطوة 3 — شروط وصلاحية الزيارة',
    'rec.duration_title': 'المدة المصرح بها للزيارة',
    'rec.demo_mode_badge': 'وضع المحاكاة الرسمي (Demo Mode)',
    'rec.generate_pass_btn': 'إصدار التصريح المشفر ورمز QR',
    'rec.pass_ready_title': 'تم إصدار تصريح الدخول الذكي بنجاح!',
    'rec.print_badge_btn': 'طباعة بطاقة الزائر (A6 / A4)',
    'rec.another_visitor': 'تسجيل زائر آخر',

    // Pass
    'pass.header_title': 'تصريح دخول مستشفى السلطان قابوس',
    'pass.ministry_header': 'سلطنة عُمان • وزارة الصحة',
    'pass.visitor': 'اسم الزائر:',
    'pass.patient': 'المريض المنوم:',
    'pass.destination': 'وجهة الزيارة:',
    'pass.duration': 'المدة المصرح بها:',
    'pass.code': 'رقم التصريح:',
    'pass.status': 'حالة التصريح:',
    'pass.footer_note': 'يرجى مسح هذا الرمز عند البوابة الرئيسية (CP-01) وبوابة الخروج (CP-07). يلغى التصريح نهائياً عند الخروج.',

    // Live Monitor
    'live.title': 'منصة وصل للمراقبة الحية',
    'live.badge': 'غرفة العمليات المركزية',
    'live.subtitle': 'مستشفى السلطان قابوس • شاشة الرقابة الأمنية وإدارة تدفق الزوار',
    'live.inside': 'المتواجدون حالياً بالداخل',
    'live.ending_soon': 'أوشك وقتهم على النفاد',
    'live.overdue': 'تجاوزوا المدة المسموحة',
    'live.fullscreen': 'عرض ملء الشاشة',
    'live.stream_title': 'البث الحي المباشر لحركة الزوار في الأجنحة',

    // Alerts
    'alerts.title': 'مركز التنبيهات ونظام محاكاة الرسائل القصيرة (SMS)',
    'alerts.subtitle': 'الإرسال التلقائي للرسائل التحذيرية عند اقتراب انتهاء الزيارة وعند التجاوز',
    'alerts.dispatch_title': 'إرسال رسالة تنبيه تجريبية',
    'alerts.dispatch_btn': 'إرسال الرسالة القصيرة (SMS)',

    // Common Buttons
    'btn.back': 'رجوع',
    'btn.print': 'طباعة',
    'btn.export_csv': 'تصدير ملف CSV',
    'btn.refresh': 'تحديث',
    'btn.checkout': 'تسجيل خروج',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('wesal_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar'; // Default Arabic for Sultan Qaboos Hospital
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('wesal_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
