import React, { useState } from 'react';
import {
  BookOpen, CheckCircle2, AlertTriangle, Users, QrCode, Shield,
  Clock, ArrowRight, ArrowLeft, HeartHandshake, Phone, Printer,
  Sparkles, Info, X, ChevronDown, ChevronUp, BellRing, BedDouble
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface AdminWorkflowGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const AdminWorkflowGuide: React.FC<AdminWorkflowGuideProps> = ({
  isOpen = false,
  onClose,
  isEmbedded = false,
}) => {
  const { lang, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'VISITOR_NEEDS' | 'SECURITY_RULES'>('WORKFLOW');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const steps = [
    {
      step: 1,
      title_ar: 'الخطوة 1: التحقق من المريض المنوم وسعة السرير',
      title_en: 'Step 1: Patient Lookup & Bedside Capacity Check',
      badge_ar: 'قبل تسجيل الزائر',
      badge_en: 'Before Registration',
      icon: BedDouble,
      color: 'from-sky-500 to-blue-600',
      desc_ar: 'ابدأ بالبحث عن المريض المنوم بالاسم الثلاثي، الرقم الصحي للمريض (Hospital #)، أو رقم الجناح والغرفة.',
      desc_en: 'Start by searching for the admitted patient by name, Hospital #, or ward/room.',
      rules_ar: [
        'قاعدة السلامة الطبية: الحد الأقصى للزوار المتزامنين عند السرير الواحد هو شخصين (2) فقط منعاً للعدوى.',
        'فحص السعة الحالية: إذا كانت السعة (2/2 ممتلئة)، يقوم النظام آلياً بمنع إصدار تصريح جديد لحماية راحة المريض.',
        'إذا كان السرير ممتلئاً: اعتذر بلطف للزائر واطلب منه الانتظار في صالة الاستقبال حتى تسجيل خروج أحد الزوار السابقين.',
      ],
      rules_en: [
        'Clinical Safety Rule: Maximum 2 concurrent visitors at bedside to prevent overcrowding and infection risks.',
        'Capacity Check: If bedside is full (2/2), the system automatically prevents new passes to protect patient rest.',
        'If Bedside is Full: Politely ask the visitor to wait in the reception lounge until a current visitor checks out.',
      ],
      actionBtn_ar: 'البحث عن مريض وتسجيل زيارة',
      actionBtn_en: 'Search Patient & Register',
      actionUrl: '/reception',
    },
    {
      step: 2,
      title_ar: 'الخطوة 2: تسجيل بيانات وهوية الزائر ونوع الزيارة',
      title_en: 'Step 2: Visitor Personal Details & Visit Type',
      badge_ar: 'التحقق من الهوية',
      badge_en: 'Identity Verification',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      desc_ar: 'تسجيل الهوية الوطنية لضمان التدقيق الأمني وإرسال إشعارات الرسائل النصية القصيرة (SMS) إلى هاتف الزائر.',
      desc_en: 'Record national identity for security audit and automatic SMS notifications to the visitor.',
      rules_ar: [
        'الاسم الثلاثي والقبيلة: أدخل الاسم كاملاً كما في البطاقة الشخصية.',
        'الرقم المدني العُماني (Civil ID): رقم الهوية المعتمد بسلطنة عمان.',
        'رقم الهاتف المتنقل: تأكد من صحة رقم الهاتف (+968) حيث يستلم الزائر عليه تنبيهات وقت الزيارة وانتهاء المدة.',
        'تحديد نوع المصرح له: اختر بين "زائر اعتيادي" (ساعة واحدة) أو "مرافق مريض" (مرافقة مستمرة للحالات الخاصة).',
      ],
      rules_en: [
        'Full Legal Name: Enter visitor name exactly as on national ID card.',
        'Omani Civil ID: Mandatory national identity reference for audit trails.',
        'Mobile Phone Number: Verify valid mobile phone (+968) to receive automated SMS time alerts.',
        'Visitor Type: Choose between "Standard Visitor" (1 hour) or "Patient Companion" (extended stay).',
      ],
      actionBtn_ar: 'الانتقال إلى شاشة التسجيل',
      actionBtn_en: 'Go to Registration',
      actionUrl: '/reception',
    },
    {
      step: 3,
      title_ar: 'الخطوة 3: تحديد الصلاحيات والمدة الزمنية',
      title_en: 'Step 3: Access Permissions & Duration Assignment',
      badge_ar: 'تحديد الصلاحيات',
      badge_en: 'Access Policies',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      desc_ar: 'تحديد الأجنحة المصرح بزيارتها والمدة المسموحة بناءً على سياسات وزارة الصحة ومستشفى السلطان قابوس.',
      desc_en: 'Specify authorized wards and allowed duration according to Ministry of Health policies.',
      rules_ar: [
        'الأجنحة المصرح بها: يتم قفل التصريح على الجناح المنوم به المريض فقط. محاولة الدخول لأجنحة أخرى ستعطي رفضاً فورياً.',
        'أجنحة العناية المركزة (ICU): تتطلب تصريحاً خاصاً وموافقة الطبيب المعالج.',
        'تحديد المدة: في أوقات الزيارة القياسية (ساعة واحدة). في وضع المحاكاة والعروض (1 إلى 5 دقائق لمشاهدة دورة التنبيهات).',
      ],
      rules_en: [
        'Authorized Ward: Pass is strictly restricted to the patient’s ward. Other wards will trigger instant gate denial.',
        'ICU & Critical Care: Restricted zones require special clinician approval.',
        'Duration Selection: Standard hospital visit (1 hour). Demo mode (1–5 minutes for interactive demonstrations).',
      ],
      actionBtn_ar: 'مراجعة سياسات المستشفى',
      actionBtn_en: 'Review Hospital Policies',
      actionUrl: '/settings',
    },
    {
      step: 4,
      title_ar: 'الخطوة 4: إصدار تصريح QR المشفر وطباعة البطاقة',
      title_en: 'Step 4: Issue Encrypted QR Pass & Print Badge',
      badge_ar: 'إصدار التصريح',
      badge_en: 'Pass Generation',
      icon: QrCode,
      color: 'from-emerald-500 to-teal-600',
      desc_ar: 'يولد النظام تصريحاً مشفراً برمز QR فريد يحتوي على بيانات التشفير الرقمية، وقت الزيارة، وسعة السرير.',
      desc_en: 'System generates an encrypted unique QR pass encoding visit limits, patient room, and security token.',
      rules_ar: [
        'طباعة بطاقة الزائر: اضغط زر "طباعة بطاقة الزائر (A6 / A4)" وسلمها للزائر لتعليقها على الصدر طوال فترة التواجد.',
        'الرمز الرقمي على الهاتف: يمكن للزائر تصوير رمز الـ QR بهاتفه واستخدامه مباشرة عند البوابات الذكية.',
        'إرشاد الزائر: وجّه الزائر نحو البوابة الرئيسية (CP-01) للبدء في مسح الباركود.',
      ],
      rules_en: [
        'Print Badge: Click "Print Badge (A6/A4)" and give to visitor to wear visibly during their stay.',
        'Digital Pass: Visitor can also capture the QR code on their smartphone screen.',
        'Guide Visitor: Direct visitor towards Main Gate CP-01 for optical barcode scan.',
      ],
      actionBtn_ar: 'معاينة دليل التصاريح الصادرة',
      actionBtn_en: 'View Issued Passes Directory',
      actionUrl: '/passes',
    },
    {
      step: 5,
      title_ar: 'الخطوة 5: التحقق الذكي عند البوابات ونقاط التفتيش',
      title_en: 'Step 5: Smart Gate Scanning & Checkpoint Verification',
      badge_ar: 'العبور الذكي',
      badge_en: 'Gate Passage',
      icon: Shield,
      color: 'from-blue-600 to-indigo-700',
      desc_ar: 'عند وصول الزائر للبوابة، يضع رمز الـ QR أمام القارئ البصري الذكي للتحقق التلقائي بدون تدخل بشري.',
      desc_en: 'At the gate, visitor scans QR under the optical reader for instantaneous verification.',
      rules_ar: [
        '🟢 تم السماح (ACCESS GRANTED): إضاءة خضراء ونغمة ترحيبية ناعمة. تفتح البوابة ويبدأ احتساب وقت الزيارة لحظياً.',
        '🔴 تم الرفض (ACCESS DENIED): إضاءة حمراء وصوت تنبيه. يعرض النظام سبب الرفض (مثلاً: التصريح منتهي، السرير ممتلئ، أو منطقة غير مصرح بها).',
        'نقاط التفتيش الداخلية: تسجيل حركة الزائر عند بوابات الأجنحة لتوثيق موقعه في أي لحظة.',
      ],
      rules_en: [
        '🟢 ACCESS GRANTED: Green illumination with pleasant chime. Gate opens and visit timer begins ticking.',
        '🔴 ACCESS DENIED: Red alert with audible buzzer. System explains exact reason (expired, capacity full, or unauthorized ward).',
        'Internal Checkpoints: Records movement across ward corridors to pinpoint visitor’s last known location.',
      ],
      actionBtn_ar: 'فتح القارئ البصري للبوابة الذكية',
      actionBtn_en: 'Open Smart Gate Scanner',
      actionUrl: '/gate',
    },
    {
      step: 6,
      title_ar: 'الخطوة 6: المتابعة اللحظية وتنبيهات الرسائل وتسجيل الخروج',
      title_en: 'Step 6: Live Monitoring, SMS Alerts & Checkout',
      badge_ar: 'المراقبة والخروج',
      badge_en: 'Monitoring & Checkout',
      icon: BellRing,
      color: 'from-rose-500 to-pink-600',
      desc_ar: 'شاشة الرقابة المركزية تتابع حركة جميع الزوار بالثواني، وتطلق رسائل التحذير الآلية عند اقتراب وقت المغادرة.',
      desc_en: 'Central control room tracks all visitors in real-time, triggering automated SMS reminders.',
      rules_ar: [
        'تنبيه قبل 5 دقائق: إرسال رسالة SMS لطيفة للزائر تذكره بأن وقت الزيارة شارف على الانتهاء للاستعداد للمغادرة.',
        'حالة التجاوز (OVERDUE): وميض أحمر وتنبيه لغرفة الأمن في حال عدم تسجيل خروج الزائر بعد انتهاء الوقت.',
        'تسجيل الخروج (Checkout): يمسح الزائر بطاقته عند بوابة الخروج (CP-07)، فيتم فورياً إغلاق التصريح وإفراغ سعة السرير لزائر آخر.',
      ],
      rules_en: [
        '5-Minute Warning: Automated friendly SMS reminder sent to visitor to prepare for departure.',
        'Overdue Alert: Red pulsing badge and security alert if visitor stays past allowed duration.',
        'Gate Checkout: Visitor scans at Exit Gate CP-07 to close visit and instantly free bedside capacity.',
      ],
      actionBtn_ar: 'غرفة المراقبة والتحكم المباشر',
      actionBtn_en: 'Live Control Room',
      actionUrl: '/live',
    },
  ];

  const visitorNeeds = [
    {
      title_ar: '1. ماذا تفعل إذا كانت سعة السرير مكتملة (2/2)؟',
      title_en: '1. What to do if bedside capacity is full (2/2)?',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      guidance_ar: 'أوضح للزائر بكل لطف وكياسة أن سياسة مستشفى السلطان قابوس تهدف لراحة وسلامة مريضه المنوم بمنع تواجد أكثر من زائرين عند السرير في آن واحد. اطلب منه الانتظار في بهو الاستقبال حتى يغادر أحد الزوار، ويمكنك مراقبة شاشة الاستقبال لتسجيل خروج أحدهم وإصدار التصريح فوراً.',
      guidance_en: 'Kindly explain that hospital policy protects their patient’s recovery by capping visitors at 2 per bed. Invite them to relax in the visitor lounge. The moment an active visitor checks out, the bed capacity updates instantly and you can issue their pass.',
    },
    {
      title_ar: '2. كيف تتعامل مع طلب "مرافق مريض" دائم؟',
      title_en: '2. How to handle permanent Patient Companion requests?',
      icon: HeartHandshake,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      guidance_ar: 'إذا كان المريض يحتاج لمرافقة مستمرة (مثل كبار السن، الأطفال المنومين، أو الحالات بعد العمليات الجراحية)، اختر نوع الزائر "مرافق مريض (Companion)". هذا النوع يمنحه صلاحية أطول ومرافقة ليلية معتمدة وفق تعليمات التمريض وإدارة الجناح.',
      guidance_en: 'For patients needing continuous bedside assistance (pediatrics, elderly, post-op), select "Companion" under visitor type. This grants extended stay privileges in coordination with nursing and ward administration.',
    },
    {
      title_ar: '3. ماذا تفعل إذا فقد الزائر بطاقته أو تلف الرمز؟',
      title_en: '3. What to do if visitor lost or damaged their QR badge?',
      icon: Printer,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      guidance_ar: 'لا داعي للقلق؛ افتح شاشة "تصاريح الزوار (Visitor Passes)" أو "دليل الزوار"، ابحث برقم بطاقة الزائر أو اسمه، ثم اضغط زر "طباعة البطاقة" لإعادة طباعتها فورياً دون الحاجة لإعادة إدخال البيانات.',
      guidance_en: 'Simply open "Visitor Passes" or "Visitors Directory", search by name or Civil ID, and click "Print Badge" to re-issue their active pass in one click.',
    },
    {
      title_ar: '4. كيف تتصرف مع الزائر المتأخر (Overdue) داخل الجناح؟',
      title_en: '4. How to handle an overdue visitor in the ward?',
      icon: Phone,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      guidance_ar: 'يعرض النظام تلقائياً الزائر المتأخر باللون الأحمر مع احتساب دقائق التجاوز. يمكنك من خلال شاشة "مركز التنبيهات" إرسال رسالة SMS تذكيرية عاجلة لهاتفه لحثه على التوجه إلى بوابة الخروج CP-07، أو إشعار حارس أمن الجناح بالتحقق بلطف.',
      guidance_en: 'Overdue visitors appear highlighted in glowing red with exact overstay minutes. Use the Alerts Center to dispatch a direct SMS reminder, or notify ward security to guide them towards Exit Gate CP-07.',
    },
    {
      title_ar: '5. الحالات الاستثنائية والزيارات الطارئة للرعاية الحرجة (ICU)',
      title_en: '5. Exceptional and emergency visits to ICU & Critical Care',
      icon: Shield,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      guidance_ar: 'مناطق العناية المركزة وحضانات الأطفال مقيدة بأعلى درجات الأمان. لا يتم إصدار تصريح لها إلا بوجود موافقة إلكترونية أو خطية من الطبيب المناوب، مع توجيه الزائر لارتداء الملابس الوقائية وتحديد مدة لا تتجاوز 15 دقيقة.',
      guidance_en: 'Critical care and ICU zones require explicit clinician sign-off. Ensure visitor puts on sanitary protective gear and keep visit duration strictly limited to 15 minutes.',
    },
  ];

  const content = (
    <div className="space-y-6">
      {/* Top Banner & Introduction */}
      <div className="bg-gradient-to-r from-hospital-700 via-hospital-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'ar' ? 'دليل مشغل النظام والموظف الإداري' : 'System Operator & Administrator Playbook'}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {lang === 'ar'
                ? 'إرشادات إدارة وتسجيل زوار مستشفى السلطان قابوس خطوة بخطوة'
                : 'Step-by-Step Hospital Visitor Management & Registration Guide'}
            </h2>
            <p className="text-xs text-hospital-100 max-w-2xl leading-relaxed">
              {lang === 'ar'
                ? 'هذا الدليل يوضح للمسؤول والموظف الترتيب الدقيق للإجراءات: ماذا تفعل أولاً، كيفية التعامل مع سعة الأسرة، متطلبات الزائرين، مسح البوابات الذكية، وحل الحالات الطارئة بكفاءة وسلاسة.'
                : 'Comprehensive workflow instructions detailing what to do first, how to manage bedside capacities, satisfy visitor requests, verify gates, and handle exceptional cases smoothly.'}
            </p>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                navigate('/reception');
                if (onClose) onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-hospital-700 hover:bg-hospital-50 font-bold text-xs shadow-md transition-transform hover:scale-105 inline-flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-hospital-600" />
              {lang === 'ar' ? 'بدء تسجيل زائر الآن' : 'Start Visitor Registration'}
            </button>
            <button
              onClick={() => {
                navigate('/gate');
                if (onClose) onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs border border-white/30 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              {lang === 'ar' ? 'القارئ البصري للبوابة' : 'Smart Gate Scanner'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('WORKFLOW')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'WORKFLOW'
              ? 'border-hospital-600 text-hospital-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {lang === 'ar' ? '1. خطوات العمل المتسلسلة (ماذا تفعل أولاً ثم ثانياً)' : '1. Sequential Workflow (What to do first & next)'}
        </button>
        <button
          onClick={() => setActiveTab('VISITOR_NEEDS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'VISITOR_NEEDS'
              ? 'border-hospital-600 text-hospital-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          {lang === 'ar' ? '2. التعامل مع احتياجات وحالات الزوار' : '2. Handling Visitor Needs & Requests'}
        </button>
      </div>

      {/* TAB 1: Sequential Workflow */}
      {activeTab === 'WORKFLOW' && (
        <div className="space-y-6">
          {/* Quick Step Navigator Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((s) => {
              const isSelected = currentStep === s.step;
              const Icon = s.icon;
              return (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                    isSelected
                      ? 'bg-hospital-50 border-hospital-500 shadow-sm ring-2 ring-hospital-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-hospital-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {lang === 'ar' ? `خطوة ${s.step}` : `Step ${s.step}`}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-hospital-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-1">
                    {lang === 'ar' ? s.title_ar.split(':')[1] || s.title_ar : s.title_en.split(':')[1] || s.title_en}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Step Detailed Card */}
          {(() => {
            const activeStepData = steps.find((s) => s.step === currentStep) || steps[0];
            const StepIcon = activeStepData.icon;

            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeStepData.color} text-white flex items-center justify-center shadow-md font-bold text-xl`}>
                      <StepIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-hospital-100 text-hospital-800 inline-block mb-1">
                        {lang === 'ar' ? activeStepData.badge_ar : activeStepData.badge_en}
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        {lang === 'ar' ? activeStepData.title_ar : activeStepData.title_en}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {lang === 'ar' ? activeStepData.desc_ar : activeStepData.desc_en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigate(activeStepData.actionUrl);
                        if (onClose) onClose();
                      }}
                      className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{lang === 'ar' ? activeStepData.actionBtn_ar : activeStepData.actionBtn_en}</span>
                      {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Detailed Checklist / Rules */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-hospital-600" />
                    {lang === 'ar' ? 'التعليمات والإجراءات الإدارية لهذه الخطوة:' : 'Administrative Rules & Instructions:'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(lang === 'ar' ? activeStepData.rules_ar : activeStepData.rules_en).map((rule, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-700 leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <button
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    className="btn-secondary px-3 py-1.5 disabled:opacity-40 flex items-center gap-1"
                  >
                    {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{lang === 'ar' ? 'الخطوة السابقة' : 'Previous Step'}</span>
                  </button>

                  <span className="font-bold text-slate-500">
                    {lang === 'ar' ? `الخطوة ${currentStep} من 6` : `Step ${currentStep} of 6`}
                  </span>

                  <button
                    disabled={currentStep === 6}
                    onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                    className="btn-primary px-3 py-1.5 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>{lang === 'ar' ? 'الخطوة التالية' : 'Next Step'}</span>
                    {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: Handling Visitor Needs & Requests */}
      {activeTab === 'VISITOR_NEEDS' && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <HeartHandshake className="w-5 h-5 text-hospital-600 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'دليل التعامل المهني مع استفسارات واحتياجات الزوار والمرافقين في مستشفى السلطان قابوس بما يحفظ رضا المراجعين وسلامة المرضى المنومين.'
                : 'Professional protocol for addressing visitor inquiries, special requests, and capacity situations at Sultan Qaboos Hospital.'}
            </span>
          </div>

          <div className="space-y-3">
            {visitorNeeds.map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${item.color}`}>
                      <ItemIcon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {lang === 'ar' ? item.title_ar : item.title_en}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {lang === 'ar' ? item.guidance_ar : item.guidance_en}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // If used as an embedded card inside Dashboard or Reception
  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <div className="p-4 bg-gradient-to-r from-hospital-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-hospital-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ar' ? 'دليل المشغل وخطوات التعامل مع الزوار' : 'Admin Step-by-Step Operator Guide'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar'
                  ? 'إرشادات فورية: ماذا تفعل أولاً، التحقق من سعة السرير، وإصدار التصريح'
                  : 'Quick playbook: what to do first, bedside check, pass issuance, and gate scans'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs font-semibold text-hospital-700 hover:text-hospital-800 p-1.5 rounded-lg hover:bg-white/80 transition-colors flex items-center gap-1"
            >
              <span>{isCollapsed ? (lang === 'ar' ? 'عرض الدليل' : 'Expand Guide') : (lang === 'ar' ? 'طي الدليل' : 'Collapse')}</span>
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isCollapsed && <div className="p-6">{content}</div>}
      </div>
    );
  }

  // Modal View
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-hospital-100 text-hospital-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'ar' ? 'دليل المشغل الشامل — مستشفى السلطان قابوس' : 'Comprehensive Admin & Operator Playbook'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'خطوات العمل، قواعد سعة الأسرة، والتعامل مع احتياجات الزوار' : 'Standard Operating Procedures & Visitor Needs'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {content}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary text-xs px-5 py-2">
            {lang === 'ar' ? 'إغلاق الدليل' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
