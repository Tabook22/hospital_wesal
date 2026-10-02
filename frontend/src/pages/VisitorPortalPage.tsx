import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Shield, Users, QrCode, Clock, CheckCircle2,
  AlertTriangle, XCircle, Printer, Download, LogOut,
  Sparkles, RefreshCw, UserCheck, HeartHandshake, Eye, AlertCircle,
  Lock, Hourglass, ShieldAlert, Check, UserPlus, Phone, CreditCard,
  User, ChevronRight, Compass, ArrowRight, Share2, Info, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { VisitorPatientSearchItem, VisitorPassDetail, VisitorExpressBookRequest } from '../types';

interface SavedVisitorProfile {
  fullName: string;
  civilId: string;
  mobileNumber: string;
}

const STORAGE_PROFILE_KEY = 'wesal_visitor_profile';

const getStoredProfile = (): SavedVisitorProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse visitor profile from localStorage', err);
  }
  return { fullName: '', civilId: '', mobileNumber: '' };
};

const saveStoredProfile = (profile: SavedVisitorProfile) => {
  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save visitor profile to localStorage', err);
  }
};

const getLocalizedWard = (wardName: string, lang: string) => {
  if (lang !== 'ar') return wardName;
  const map: Record<string, string> = {
    'Medical Ward A': 'جناح الباطنية (أ)',
    'Medical Ward B': 'جناح الباطنية (ب)',
    'Surgical Ward': 'جناح الجراحة',
    'Intensive Care Unit (ICU)': 'العناية المركزة (ICU)',
    'Pediatric Ward': 'جناح الأطفال',
  };
  return map[wardName] || wardName;
};

const getLocalizedRoomBed = (room: string, bed: string, lang: string) => {
  if (lang !== 'ar') return `${room} — ${bed}`;
  const cleanRoom = room.replace(/^Room\s*/i, 'غرفة ').replace(/^ICU-/i, 'سرير عناية ');
  const cleanBed = bed.replace(/^Bed\s*/i, 'سرير ');
  return `${cleanRoom} — ${cleanBed}`;
};

export const VisitorPortalPage: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile state (No username/password required!)
  const [profile, setProfile] = useState<SavedVisitorProfile>(getStoredProfile);
  const [fullName, setFullName] = useState(profile.fullName);
  const [civilId, setCivilId] = useState(profile.civilId);
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber);
  const [isEditingProfile, setIsEditingProfile] = useState(!profile.civilId);

  // Tab & search states
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'PASSES'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<VisitorPatientSearchItem | null>(null);

  // Visit Booking Form state
  const [relationship, setRelationship] = useState<string>('FIRST_DEGREE');
  const [visitorType, setVisitorType] = useState<'VISITOR' | 'COMPANION'>('VISITOR');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [bookingNotes, setBookingNotes] = useState('');

  // Lookup / retrieve pass modal state
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupCivilId, setLookupCivilId] = useState('');

  // Generated Active Pass modal / view state
  const [activePass, setActivePass] = useState<VisitorPassDetail | null>(null);

  // Live seconds ticker for anti-screenshot watermark
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update profile in localStorage whenever valid details change
  const handleSaveProfile = () => {
    const trimmed = {
      fullName: fullName.trim(),
      civilId: civilId.trim(),
      mobileNumber: mobileNumber.trim(),
    };
    setProfile(trimmed);
    saveStoredProfile(trimmed);
    setIsEditingProfile(false);
  };

  // 1. Search Admitted Patients Query (only enabled when searchQuery length >= 2)
  const {
    data: patients = [],
    isLoading: isLoadingPatients,
  } = useQuery<VisitorPatientSearchItem[]>({
    queryKey: ['visitor-patients-search', searchQuery],
    queryFn: () => api.searchVisitorPatients(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  // Effective civil ID to poll passes for
  const effectiveCivilId = profile.civilId || civilId || undefined;

  // 2. Fetch My Passes Query (auto-poll every 4 seconds to catch receptionist approvals live)
  const {
    data: myPasses = [],
    isLoading: isLoadingPasses,
    refetch: refetchPasses
  } = useQuery<VisitorPassDetail[]>({
    queryKey: ['visitor-my-passes', effectiveCivilId],
    queryFn: () => api.getMyVisitorPasses(effectiveCivilId),
    refetchInterval: 4000,
    enabled: true,
  });

  // Update activePass reference when myPasses changes (e.g. from PENDING to ACTIVE)
  useEffect(() => {
    if (myPasses.length > 0) {
      if (!activePass) {
        setActivePass(myPasses[0]);
      } else {
        const updated = myPasses.find((p) => p.visit_id === activePass.visit_id);
        if (updated && (updated.status !== activePass.status || updated.approval_status !== activePass.approval_status)) {
          setActivePass(updated);
        }
      }
    }
  }, [myPasses, activePass]);

  // 3. Frictionless Express Pass Booking Mutation (No password / registration needed!)
  const expressBookMutation = useMutation({
    mutationFn: (data: VisitorExpressBookRequest) => api.expressBookVisitorPass(data),
    onSuccess: (newPass) => {
      // Remember visitor details in browser for next time
      const saved = {
        fullName: fullName.trim(),
        civilId: civilId.trim(),
        mobileNumber: mobileNumber.trim(),
      };
      setProfile(saved);
      saveStoredProfile(saved);
      setIsEditingProfile(false);

      // If backend issued a guest access token, keep it for smooth auth
      if ((newPass as any).access_token) {
        localStorage.setItem('token', (newPass as any).access_token);
      }

      setActivePass(newPass);
      setSelectedPatient(null);
      setActiveTab('PASSES');
      queryClient.invalidateQueries({ queryKey: ['visitor-my-passes'] });
      queryClient.invalidateQueries({ queryKey: ['visitor-patients-search'] });
    },
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!fullName.trim() || !civilId.trim() || !mobileNumber.trim()) {
      alert(lang === 'ar' ? 'يرجى إكمال البيانات الأساسية (الاسم، الرقم المدني، ورقم الهاتف)' : 'Please complete all required fields (Name, Civil ID, and Mobile).');
      return;
    }

    expressBookMutation.mutate({
      full_name: fullName.trim(),
      civil_id: civilId.trim(),
      mobile_number: mobileNumber.trim(),
      patient_id: selectedPatient.id,
      visitor_type: visitorType,
      relationship: relationship,
      duration_minutes: durationMinutes,
      notes: bookingNotes || undefined,
    });
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCivilId.trim()) return;
    setCivilId(lookupCivilId.trim());
    setProfile((prev) => ({ ...prev, civilId: lookupCivilId.trim() }));
    saveStoredProfile({ ...profile, civilId: lookupCivilId.trim() });
    setShowLookupModal(false);
    setActiveTab('PASSES');
    queryClient.invalidateQueries({ queryKey: ['visitor-my-passes'] });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!activePass?.qr_image_base64) return;
    const link = document.createElement('a');
    link.href = activePass.qr_image_base64;
    link.download = `wesal-pass-${activePass.pass_code || activePass.visit_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Go Back & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dedicated Go Back Button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all shadow-xs flex items-center gap-1 group"
              title={lang === 'ar' ? 'رجوع للصفحة السابقة' : 'Go Back'}
              aria-label={lang === 'ar' ? 'رجوع للصفحة السابقة' : 'Go Back'}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-slate-600 group-hover:text-slate-900 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
              <span className="hidden sm:inline text-xs font-bold">{lang === 'ar' ? 'رجوع' : 'Back'}</span>
            </button>

            {/* Clickable Brand Logo & Label -> Goes to Homepage */}
            <button
              type="button"
              onClick={() => navigate('/gateway')}
              className="flex items-center gap-2.5 sm:gap-3 hover:opacity-85 transition-opacity text-left rtl:text-right group"
              title={lang === 'ar' ? 'الصفحة الرئيسية — بوابة الأدوار' : 'Homepage — Gate'}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="group-hover:text-emerald-700 transition-colors">WESAL | وصل</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {lang === 'ar' ? 'تصريح الزائر السريع' : 'Express Pass'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">
                  {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Find Pass by Civil ID button */}
            <button
              onClick={() => {
                setLookupCivilId(profile.civilId || '');
                setShowLookupModal(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'استرجاع تصريح سابق' : 'Find My Pass'}
              </span>
              <span className="sm:hidden">
                {lang === 'ar' ? 'تصاريحي' : 'My Pass'}
              </span>
            </button>

            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Return to Gate / Switch Role */}
            <button
              onClick={() => navigate('/gateway')}
              title={lang === 'ar' ? 'العودة للبوابة الرئيسية' : 'Return to main gateway'}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Welcome & Frictionless Value Proposition Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20 no-print">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>{lang === 'ar' ? 'خدمة الزوار المباشرة — بدون كلمة مرور أو تسجيل معقد' : 'Frictionless Express Service — No Password Required'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {lang === 'ar' ? 'أهلاً بكم في بوابة زيارة المرضى المنومين' : 'Welcome to the Inpatient Visitor Pass Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {lang === 'ar'
                ? 'احصل على تصريح الدخول الرقمي (QR) في 30 ثانية. ابحث عن المريض المنوم، أدخل بياناتك الأساسية وصلة القرابة، واحصل على تصريحك فورياً للدخول عبر بوابات المستشفى الذكية.'
                : 'Issue your digital QR pass in 30 seconds. Search for an admitted patient, fill essential details and relationship, and receive your smart gate pass immediately.'}
            </p>

            {/* Returning Visitor Auto-Recognition Pill */}
            {profile.civilId && profile.fullName && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {lang === 'ar' ? `مرحباً بك مجدداً: ${profile.fullName}` : `Welcome back: ${profile.fullName}`}
                  </span>
                  <span className="font-mono text-emerald-300 text-[11px] font-bold">({profile.civilId})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:text-white underline underline-offset-4"
                >
                  {lang === 'ar' ? 'تعديل بياناتي' : 'Edit details'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-md mx-auto sm:mx-0 text-xs font-bold no-print">
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'SEARCH'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ar' ? 'طلب تصريح جديد' : 'New Visit Pass'}</span>
          </button>
          <button
            onClick={() => setActiveTab('PASSES')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PASSES'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {lang === 'ar' ? `تصاريحي النشطة (${myPasses.length})` : `My Passes (${myPasses.length})`}
            </span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: PATIENT SEARCH & EXPRESS PASS BOOKING */}
        {/* ==================================================================== */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-6 no-print">
            {/* Search Input Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Shield className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'الخطوة 1: البحث المحمي بالخصوصية الطبية' : 'Step 1: Privacy-Protected Inpatient Search'}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar' ? 'البحث عن مريض منوم للتأكد من إمكانية الزيارة' : 'Search Inpatient to Verify Visit Status'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {lang === 'ar'
                    ? 'لحماية خصوصية المرضى وسرية بياناتهم، لا تُعرض قائمة المرضى بالكامل. يرجى إدخال اسم المريض أو رقم الملف الطبي (MRN).'
                    : 'To uphold patient confidentiality, full lists are masked. Search by patient name or Medical Record Number (MRN) to view bedside eligibility.'}
                </p>
              </div>

              <div className="relative max-w-2xl">
                <Search className="w-5 h-5 absolute left-4 rtl:left-auto rtl:right-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب اسم المريض أو رقم الملف (مثال: P00022 أو سالم أو فاطمة)...'
                      : 'Type patient name or MRN (e.g. P00022, Salim, Fatima)...'
                  }
                  className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 text-sm shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Patients Results Grid or Privacy Initial Shield */}
            {searchQuery.trim().length < 2 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 max-w-2xl mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-100 shadow-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'بيانات المرضى المنومين محمية ومحجوبة' : 'Inpatient Data Strictly Protected'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {lang === 'ar'
                      ? 'وفقاً لسياسة وزارة الصحة لحماية خصوصية المرضى، اكتب حرفين على الأقل من اسم المريض أو رقم ملفه للوصول إلى بيانات الزيارة وتحديد صلة القرابة.'
                      : 'In accordance with MOH patient privacy standards, enter at least 2 characters of the patient name or file number to view visitation status.'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-600">
                  <span className="font-semibold">{lang === 'ar' ? 'أمثلة سريعة للتجربة:' : 'Quick search demos:'}</span>
                  <button
                    onClick={() => setSearchQuery('P00022')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-emerald-800 font-bold"
                  >
                    P00022 ({lang === 'ar' ? 'مسموح فوري' : 'Instant Allowed'})
                  </button>
                  <button
                    onClick={() => setSearchQuery('P00021')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-amber-800 font-bold"
                  >
                    P00021 ({lang === 'ar' ? 'مشروط بموافقة' : 'Requires Approval'})
                  </button>
                  <button
                    onClick={() => setSearchQuery('P00051')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-rose-800 font-bold"
                  >
                    P00051 ({lang === 'ar' ? 'ممنوع طبياً' : 'Prohibited'})
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700">
                    {lang === 'ar' ? `نتائج البحث المتطابقة (${patients.length})` : `Matching Results (${patients.length})`}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'الأسماء معماة لحماية الخصوصية' : 'Names masked for privacy'}
                  </span>
                </div>

                {isLoadingPatients ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span className="text-xs">{lang === 'ar' ? 'جاري التحقق من السجلات والخصوصية...' : 'Verifying medical records...'}</span>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                    {lang === 'ar'
                      ? 'لم يتم العثور على مريض منوم يطابق هذا البحث. يرجى التأكد من رقم الملف أو الاسم، أو مراجعة كاونتر الاستقبال'
                      : 'No admitted patient found matching this query. Please check MRN/name or visit the hospital reception desk.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patients.map((p) => {
                      const isFull = !p.can_admit_visitor || p.current_concurrent_visitors >= p.max_concurrent_visitors;
                      const isProhibited = p.visitation_category === 'PROHIBITED';
                      const isLimited = p.visitation_category === 'LIMITED';
                      const displayName = lang === 'ar' && p.masked_arabic_name ? p.masked_arabic_name : p.masked_name;

                      return (
                        <div
                          key={p.id}
                          className={`bg-white rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                            isProhibited
                              ? 'border-rose-200 bg-rose-50/20'
                              : isFull
                              ? 'border-slate-200 bg-slate-50/50 opacity-95'
                              : selectedPatient?.id === p.id
                              ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header: Masked Name & Privacy Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <h3 className="font-bold text-slate-900 text-sm leading-snug tracking-wide">
                                    {displayName}
                                  </h3>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-100">
                                  MRN: <span dir="ltr">{p.hospital_number}</span>
                                </span>
                              </div>

                              {/* Category Status Pill */}
                              {isProhibited ? (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shrink-0">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  <span>{lang === 'ar' ? 'ممنوع الزيارة' : 'Prohibited'}</span>
                                </span>
                              ) : isLimited ? (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                                  <Hourglass className="w-3 h-3 text-amber-600 animate-spin" />
                                  <span>{lang === 'ar' ? 'مشروط بموافقة' : 'Requires Approval'}</span>
                                </span>
                              ) : isFull ? (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                  <span>{lang === 'ar' ? 'سعة مكتملة' : 'Full'}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>{lang === 'ar' ? 'مسموح فوري' : 'Allowed'}</span>
                                </span>
                              )}
                            </div>

                            {/* Category Notice Alert */}
                            {isProhibited && (
                              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{lang === 'ar' ? 'الزيارة محظورة طبياً حالياً حفاظاً على سلامة المريض' : 'Visits prohibited per doctor orders'}</span>
                              </div>
                            )}

                            {isLimited && (
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium flex items-center gap-2">
                                <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>{lang === 'ar' ? 'يتطلب هذا القسم موافقة موظف الاستقبال بعد تقديم الطلب' : 'Requires reception review and approval'}</span>
                              </div>
                            )}

                            {/* Location Details */}
                            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">{lang === 'ar' ? 'الجناح الطبي:' : 'Ward:'}</span>
                                <span className="font-semibold text-slate-800">{getLocalizedWard(p.ward_name, lang)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">{lang === 'ar' ? 'الغرفة والسرير:' : 'Room & Bed:'}</span>
                                <span className="font-medium text-slate-800">{getLocalizedRoomBed(p.room_number, p.bed, lang)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">{lang === 'ar' ? 'الزوار عند السرير حالياً:' : 'Current Visitors:'}</span>
                                <span
                                  dir="ltr"
                                  className={`font-bold font-mono px-2 py-0.5 rounded-md text-xs ${
                                    isFull ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/70 text-slate-800'
                                  }`}
                                >
                                  {p.current_concurrent_visitors} / {p.max_concurrent_visitors}
                                </span>
                              </div>
                            </div>

                            {/* Visiting Hours */}
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{lang === 'ar' ? 'أوقات الزيارة:' : 'Hours:'}</span>
                              <span dir="ltr" className="font-mono font-semibold text-slate-700 inline-block">{p.visiting_hours}</span>
                            </div>
                          </div>

                          {/* Select Action Button */}
                          <div className="pt-4">
                            <button
                              type="button"
                              disabled={isProhibited || isFull}
                              onClick={() => {
                                if (!isProhibited && !isFull) {
                                  setSelectedPatient(p);
                                  // Scroll to form smoothly
                                  setTimeout(() => {
                                    document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                }
                              }}
                              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                isProhibited
                                  ? 'bg-rose-50 text-rose-400 cursor-not-allowed border border-rose-200'
                                  : isFull
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : selectedPatient?.id === p.id
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-emerald-800'
                              }`}
                            >
                              {isProhibited ? (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{lang === 'ar' ? 'الزيارة محظورة طبياً' : 'Visits Prohibited'}</span>
                                </>
                              ) : isFull ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{lang === 'ar' ? 'سعة السرير مكتملة' : 'Bedside Full'}</span>
                                </>
                              ) : selectedPatient?.id === p.id ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'تم اختيار المريض' : 'Patient Selected'}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{lang === 'ar' ? 'طلب تصريح الزيارة' : 'Request Visit Pass'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Frictionless Express Booking Form */}
            {selectedPatient && (
              <div
                id="booking-form-section"
                className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        {lang === 'ar' ? 'الخطوة 2: بيانات الزائر وصلة القرابة' : 'Step 2: Visitor Details & Relationship'}
                      </span>
                      {selectedPatient.visitation_category === 'LIMITED' && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {lang === 'ar' ? 'يتطلب موافقة الاستقبال' : 'Requires Reception Approval'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xl font-bold text-slate-900">
                        {lang === 'ar' && selectedPatient.masked_arabic_name ? selectedPatient.masked_arabic_name : selectedPatient.masked_name}
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        MRN: {selectedPatient.hospital_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getLocalizedWard(selectedPatient.ward_name, lang)} &bull; {getLocalizedRoomBed(selectedPatient.room_number, selectedPatient.bed, lang)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-bold"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                {expressBookMutation.isError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{(expressBookMutation.error as any)?.message || 'Failed to issue pass'}</span>
                  </div>
                )}

                <form onSubmit={handleBookSubmit} className="space-y-6">
                  {/* Category Notice Banner */}
                  {selectedPatient.visitation_category === 'LIMITED' ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                      <Hourglass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">{lang === 'ar' ? 'طلب مشروط بموافقة موظف الاستقبال:' : 'Subject to Receptionist Approval:'}</div>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          {lang === 'ar'
                            ? 'نظراً للطبيعة الطبية لهذا الجناح، سيتم إرسال طلبك فوراً لمكتب الاستقبال للاعتماد. بعد الموافقة، سيظهر رمز الـ QR مباشرة في تصاريحك دون الحاجة لمراجعة مكتب التسجيل يدوياً.'
                            : 'Due to unit clinical policies, your visit request will be submitted to the reception desk for authorization. Once accepted, your QR pass activates automatically.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">{lang === 'ar' ? 'قبول فوري ومباشر:' : 'Instant Auto-Approval:'}</div>
                        <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                          {lang === 'ar'
                            ? 'الجناح الطبي متاح حالياً للزيارة وسعة السرير شاغرة. سيتم توليد رمز الـ QR وتفعيله فورياً بمجرد إرسال هذا الطلب.'
                            : 'This ward is currently open and bedside capacity is available. A digital QR pass will be issued immediately upon confirmation.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section A: Essential Visitor Identification (No username/password needed) */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'بيانات الزائر الأساسية (للتحقق الأمني فقط)' : 'Essential Visitor Information'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                        {lang === 'ar' ? 'بدون كلمة مرور' : 'Passwordless'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {lang === 'ar' ? 'الاسم الكامل الثلاثي *' : 'Full Name *'}
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: ناصر بن سعيد المشيخي' : 'e.g. Salim Al-Shanfari'}
                            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {lang === 'ar' ? 'الرقم المدني أو الإقامة *' : 'Civil ID / Resident ID *'}
                        </label>
                        <div className="relative">
                          <CreditCard className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={civilId}
                            onChange={(e) => setCivilId(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: 102938475' : 'e.g. 102938475'}
                            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {lang === 'ar' ? 'رقم الهاتف للتواصل *' : 'Mobile Phone *'}
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-3 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: 96891234567' : 'e.g. 96891234567'}
                            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {lang === 'ar'
                          ? 'سيتم حفظ بياناتك في هذا المتصفح لتسهيل زياراتك القادمة بنقرة واحدة.'
                          : 'Your details will be remembered locally for fast 1-click visits in the future.'}
                      </span>
                    </div>
                  </div>

                  {/* Section B: Relationship Clarification Selector (Mandatory Requirement) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'صلة القرابة بالمريض (إلزامي للتحقق الأمني والطبي):' : 'Relationship to Patient (Mandatory):'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{lang === 'ar' ? 'مطلوب للموافقة' : 'Required for approval'}</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'FIRST_DEGREE', labelAr: 'درجة أولى (والد/والدة/ابن/زوج)', labelEn: '1st Degree (Parent/Child/Spouse)' },
                        { id: 'SECOND_DEGREE', labelAr: 'درجة ثانية (أخ/أخت/جد/حفيد)', labelEn: '2nd Degree (Sibling/Grandparent)' },
                        { id: 'EXTENDED_FAMILY', labelAr: 'أقارب وعائلة', labelEn: 'Extended Family' },
                        { id: 'FRIEND', labelAr: 'صديق / معارف', labelEn: 'Friend / Acquaintance' },
                        { id: 'COMPANION', labelAr: 'مرافق رسمي للمريض', labelEn: 'Official Caregiver / Companion' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRelationship(item.id)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                            relationship === item.id
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {lang === 'ar' ? item.labelAr : item.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Pass Type & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Visitor Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === 'ar' ? 'نوع التصريح' : 'Pass / Visitor Type'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setVisitorType('VISITOR')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                            visitorType === 'VISITOR'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'زائر اعتيادي' : 'Regular Visitor'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisitorType('COMPANION')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                            visitorType === 'COMPANION'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'مرافق مريض' : 'Companion'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Duration Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === 'ar' ? 'مدة الزيارة المسموحة' : 'Visit Duration'}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 2, label: lang === 'ar' ? '2 د (تجريبي)' : '2m Demo' },
                          { val: 20, label: lang === 'ar' ? '20 دقيقة' : '20 Mins' },
                          { val: 45, label: lang === 'ar' ? '45 دقيقة' : '45 Mins' },
                          { val: 60, label: lang === 'ar' ? '60 دقيقة' : '60 Mins' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setDurationMinutes(item.val)}
                            className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center ${
                              durationMinutes === item.val
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section D: Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ar' ? 'ملاحظات إضافية لمكتب الاستقبال (اختياري)' : 'Additional Notes (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: إحضار مستندات أو مقتنيات شخصية للمريض...' : 'e.g. Delivering personal belongings...'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={expressBookMutation.isPending}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-2 ${
                        selectedPatient.visitation_category === 'LIMITED'
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      }`}
                    >
                      {expressBookMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : selectedPatient.visitation_category === 'LIMITED' ? (
                        <>
                          <Hourglass className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'إرسال الطلب لاعتماد الاستقبال' : 'Submit for Reception Approval'}</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'توليد وتفعيل التصريح فورياً (QR)' : 'Generate & Activate Pass (QR)'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MY PASSES & ACTIVE QR DISPLAY */}
        {/* ==================================================================== */}
        {activeTab === 'PASSES' && (
          <div className="space-y-6">
            {myPasses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 space-y-4 max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base">
                    {lang === 'ar' ? 'لا يوجد لديك تصاريح زيارة مسجلة' : 'No Visit Passes Found'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {lang === 'ar'
                      ? 'يمكنك البحث عن المريض بالاسم أو رقم الملف وإصدار تصريحك فورياً بدون كلمة مرور.'
                      : 'Search for an admitted patient by MRN or name to issue your instant pass.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('SEARCH')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    {lang === 'ar' ? 'طلب تصريح جديد الآن' : 'Request New Pass Now'}
                  </button>
                  <button
                    onClick={() => {
                      setLookupCivilId(profile.civilId || '');
                      setShowLookupModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    {lang === 'ar' ? 'استرجاع بالرقم المدني' : 'Lookup by Civil ID'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Pass Selector Cards */}
                <div className="lg:col-span-4 space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {lang === 'ar' ? 'سجل طلبات وتصاريح الزيارة' : 'Visit Requests & Passes'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                      <span>{lang === 'ar' ? 'تحديث حي' : 'Live Polling'}</span>
                    </span>
                  </div>

                  {myPasses.map((p) => {
                    const isPending = p.status === 'PENDING' || p.approval_status === 'PENDING_APPROVAL';
                    const isRejected = p.status === 'REJECTED' || p.approval_status === 'REJECTED';
                    const isActive = p.status === 'ACTIVE' || p.status === 'REGISTERED';

                    return (
                      <div
                        key={p.visit_id}
                        onClick={() => setActivePass(p)}
                        className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                          activePass?.visit_id === p.visit_id
                            ? isPending
                              ? 'border-amber-500 bg-amber-50/40 shadow-md'
                              : 'border-emerald-600 bg-emerald-50/40 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono text-xs font-bold text-emerald-800">{p.pass_code || p.visit_number}</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>{p.patient_name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{getLocalizedWard(p.ward_name, lang)} &bull; {p.room_number}</div>
                            {p.relationship && (
                              <div className="text-[10px] text-slate-600 mt-1">
                                {lang === 'ar' ? `الصلة: ${p.relationship}` : `Relation: ${p.relationship}`}
                              </div>
                            )}
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Hourglass className="w-2.5 h-2.5 animate-spin" />
                                <span>{lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
                              </>
                            ) : isRejected ? (
                              <>
                                <XCircle className="w-2.5 h-2.5" />
                                <span>{lang === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                              </>
                            ) : (
                              <span>{p.status}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Pass Details or Digital QR Badge */}
                {activePass && (
                  <div className="lg:col-span-8 flex flex-col items-center">
                    {/* CASE 1: PENDING RECEPTION APPROVAL */}
                    {activePass.status === 'PENDING' || activePass.approval_status === 'PENDING_APPROVAL' ? (
                      <div className="bg-white rounded-3xl border-2 border-amber-400 p-6 sm:p-8 shadow-xl text-slate-900 max-w-md w-full space-y-5 animate-in fade-in">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center border border-amber-200">
                          <Hourglass className="w-8 h-8 animate-pulse text-amber-600" />
                        </div>

                        <div className="text-center space-y-1">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider inline-block">
                            {lang === 'ar' ? 'طلب زيارة قيد مراجعة واعتماد الاستقبال' : 'Visit Request Under Review'}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-2">
                            {lang === 'ar' ? 'في انتظار موافقة موظف الاستقبال أو التمريض' : 'Awaiting Reception / Ward Approval'}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                            {lang === 'ar'
                              ? 'تم استلام طلبك وهو معروض حالياً على شاشة الاستقبال للاعتماد. سيتحول هذا الكرت إلى رمز QR فورياً بمجرد الموافقة دون الحاجة لتحديث الصفحة.'
                              : 'Your visit request is in the reception approval queue. Once accepted, this card will automatically activate with a scannable QR pass.'}
                          </p>
                        </div>

                        {/* Request Summary Box */}
                        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
                          <div className="flex justify-between items-center py-1 border-b border-amber-100">
                            <span className="text-amber-900 font-medium">{lang === 'ar' ? 'رقم الطلب:' : 'Request No:'}</span>
                            <span className="font-mono font-bold text-amber-900">{activePass.visit_number}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-amber-100">
                            <span className="text-amber-900 font-medium">{lang === 'ar' ? 'المريض (محمي بالخصوصية):' : 'Patient (Masked):'}</span>
                            <span className="font-bold text-amber-950 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>{activePass.patient_name}</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-amber-100">
                            <span className="text-amber-900 font-medium">{lang === 'ar' ? 'صلة القرابة:' : 'Relationship:'}</span>
                            <span className="font-bold text-amber-900">{activePass.relationship || 'First Degree'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-amber-900 font-medium">{lang === 'ar' ? 'الموقع المطلوب:' : 'Destination:'}</span>
                            <span className="font-semibold text-amber-950">
                              {getLocalizedWard(activePass.ward_name, lang)} &bull; {activePass.room_number}
                            </span>
                          </div>
                        </div>

                        <div className="text-center text-[11px] text-amber-700 flex items-center justify-center gap-2 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          <span>{lang === 'ar' ? 'جاري الفحص التلقائي لاعتماد الطلب كل 4 ثوانٍ...' : 'Auto-checking approval status every 4s...'}</span>
                        </div>
                      </div>
                    ) : activePass.status === 'REJECTED' || activePass.approval_status === 'REJECTED' ? (
                      /* CASE 2: REJECTED */
                      <div className="bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-xl text-slate-900 max-w-md w-full space-y-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
                          <XCircle className="w-8 h-8 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {lang === 'ar' ? 'تم رفض طلب الزيارة' : 'Visit Request Denied'}
                        </h3>
                        <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                          {activePass.rejection_reason || (lang === 'ar' ? 'بناءً على تعليمات الطبيب أو استيعاب الجناح' : 'Per ward capacity or medical directive')}
                        </p>
                        <button
                          onClick={() => setActiveTab('SEARCH')}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                        >
                          {lang === 'ar' ? 'تقديم طلب جديد' : 'Submit New Request'}
                        </button>
                      </div>
                    ) : (
                      /* CASE 3: ACTIVE SCANNABLE DIGITAL QR BADGE */
                      <div className="flex flex-col items-center w-full">
                        {/* Action Bar */}
                        <div className="w-full max-w-sm flex items-center justify-between mb-3 no-print">
                          <span className="text-xs font-bold text-slate-700">
                            {lang === 'ar' ? 'البطاقة الرقمية الرسمية' : 'Digital Scannable Badge'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadQR}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm"
                              title={lang === 'ar' ? 'حفظ صورة الرمز' : 'Save QR image'}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{lang === 'ar' ? 'حفظ الرمز' : 'Save'}</span>
                            </button>
                            <button
                              onClick={handlePrint}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
                            </button>
                          </div>
                        </div>

                        {/* The Visual Badge Container */}
                        <div
                          id="printable-visitor-pass"
                          className="bg-white rounded-3xl border-2 border-slate-900 p-6 sm:p-7 shadow-2xl text-slate-900 max-w-sm w-full space-y-4 print-page relative overflow-hidden"
                        >
                          {/* Anti-Screenshot Dynamic Security Ribbon */}
                          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-[10px] font-mono py-1 px-3 -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-4 flex items-center justify-between font-bold shadow-sm">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                              <span>LIVE APPROVED PASS</span>
                            </span>
                            <span>{currentTime.toLocaleTimeString()}</span>
                          </div>

                          {/* Hospital Header Banner */}
                          <div className="text-center border-b-2 border-slate-900 pb-3">
                            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                              {lang === 'ar' ? 'سلطنة عمان — وزارة الصحة' : 'SULTANATE OF OMAN — MINISTRY OF HEALTH'}
                            </div>
                            <div className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                              {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
                            </div>
                            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                              {lang === 'ar' ? 'تصريح زيارة رقمي معتمد ومفعل' : 'Approved Digital Visitor Pass'}
                            </div>
                          </div>

                          {/* Scannable Real QR Image */}
                          <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200">
                            {activePass.qr_image_base64 && (
                              <img
                                src={activePass.qr_image_base64}
                                alt="Scannable QR Pass"
                                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                              />
                            )}
                            <span className="font-mono text-xs font-black tracking-wider text-slate-900 mt-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                              {activePass.pass_code}
                            </span>
                          </div>

                          {/* Visually Displayed Token Details */}
                          <div className="space-y-2 text-xs divide-y divide-slate-100">
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'اسم الزائر:' : 'Visitor Name:'}</span>
                              <span className="font-bold text-slate-900 text-right rtl:text-left">{activePass.visitor_name}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'الرقم المدني:' : 'Civil ID:'}</span>
                              <span className="font-mono font-semibold text-slate-800">{activePass.visitor_civil_id}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'صلة القرابة:' : 'Relationship:'}</span>
                              <span className="font-bold text-emerald-800">{activePass.relationship || 'First Degree'}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'المريض (MRN):' : 'Patient (MRN):'}</span>
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>{activePass.patient_name}</span>
                              </span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'الموقع والمبنى:' : 'Destination:'}</span>
                              <span className="font-semibold text-slate-800">
                                {getLocalizedWard(activePass.ward_name, lang)} &bull; {activePass.room_number} ({activePass.bed})
                              </span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'الصلاحية والمدة:' : 'Valid Window:'}</span>
                              <span className="font-bold text-slate-900">
                                {new Date(activePass.valid_from).toLocaleDateString()} ({activePass.max_duration_minutes} min)
                              </span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span className="text-slate-500 font-medium">{lang === 'ar' ? 'حالة الاعتماد:' : 'Approval Status:'}</span>
                              <span className="font-bold text-emerald-700">🟢 {lang === 'ar' ? 'معتمد ونشط' : 'Approved & Active'}</span>
                            </div>
                          </div>

                          {/* Directions to Turnstiles & Elevators */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                            <Compass className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-900">
                                {lang === 'ar' ? 'توجيهات الدخول: ' : 'Entry Point: '}
                              </span>
                              <span>
                                {lang === 'ar'
                                  ? 'توجه إلى بوابة CP-01 (البوابة الرئيسية / المصاعد)، وامسح الرمز أمام القارئ الضوئي لفتح البوابة الذكية.'
                                  : 'Proceed to Checkpoint CP-01 (Main Turnstiles). Scan this QR code facing the optical reader to open the barrier.'}
                              </span>
                            </div>
                          </div>

                          {/* Instructions Footnote */}
                          <div className="border-t-2 border-slate-900 pt-2 text-[10px] text-center text-slate-500 leading-tight">
                            {lang === 'ar'
                              ? 'يرجى إبراز هذا الرمز عند بوابات الدخول الذكية. التصريح مخصص للاستخدام الفردي فقط.'
                              : 'Please present this digital code at smart optical turnstiles. Single-person entry only.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lookup Pass by Civil ID Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'استرجاع تصاريحي بالرقم المدني' : 'Find My Passes by Civil ID'}
                </h3>
              </div>
              <button
                onClick={() => setShowLookupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'إذا قمت بإصدار تصريح سابق وتريد استعراض رمز الـ QR أو متابعة موافقة الاستقبال، أدخل رقمك المدني هنا:'
                : 'Enter your Civil ID / Resident ID to look up your existing or pending QR passes:'}
            </p>

            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'الرقم المدني أو الإقامة' : 'Civil ID / Resident ID'}
                </label>
                <input
                  type="text"
                  required
                  value={lookupCivilId}
                  onChange={(e) => setLookupCivilId(e.target.value)}
                  placeholder="e.g. 102938475"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLookupModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {lang === 'ar' ? 'استرجاع التصاريح' : 'Lookup Passes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400 no-print">
        {lang === 'ar'
          ? 'منظومة وصل — مستشفى السلطان قابوس — فريق رؤية للابتكار المؤسسي'
          : 'WESAL Platform — Sultan Qaboos Hospital — Roya Corporate Innovation Team'}
      </footer>
    </div>
  );
};
