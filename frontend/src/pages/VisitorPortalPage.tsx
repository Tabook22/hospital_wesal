import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Shield, Users, QrCode, Clock, Calendar, CheckCircle2,
  AlertTriangle, XCircle, Printer, ArrowLeft, LogOut, Building2,
  Sparkles, RefreshCw, UserCheck, HeartHandshake, Eye, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { VisitorPatientSearchItem, VisitorPassDetail } from '../types';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'SEARCH' | 'PASSES'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<VisitorPatientSearchItem | null>(null);

  // Visit Booking Form state
  const [visitorType, setVisitorType] = useState<'VISITOR' | 'COMPANION'>('VISITOR');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [bookingNotes, setBookingNotes] = useState('');

  // Generated Active Pass modal / view state
  const [activePass, setActivePass] = useState<VisitorPassDetail | null>(null);

  // Live seconds ticker for anti-screenshot watermark
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Search Admitted Patients Query
  const {
    data: patients = [],
    isLoading: isLoadingPatients,
    refetch: refetchPatients
  } = useQuery<VisitorPatientSearchItem[]>({
    queryKey: ['visitor-patients-search', searchQuery],
    queryFn: () => api.searchVisitorPatients(searchQuery),
  });

  // 2. Fetch My Passes Query
  const {
    data: myPasses = [],
    isLoading: isLoadingPasses,
    refetch: refetchPasses
  } = useQuery<VisitorPassDetail[]>({
    queryKey: ['visitor-my-passes'],
    queryFn: () => api.getMyVisitorPasses(),
  });

  // Set the latest pass if available and none selected
  useEffect(() => {
    if (myPasses.length > 0 && !activePass) {
      setActivePass(myPasses[0]);
    }
  }, [myPasses]);

  // 3. Book Visit Pass Mutation
  const bookPassMutation = useMutation({
    mutationFn: (data: { patient_id: number; visitor_type: string; duration_minutes: number; notes?: string }) =>
      api.bookVisitorPass(data),
    onSuccess: (newPass) => {
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
    bookPassMutation.mutate({
      patient_id: selectedPatient.id,
      visitor_type: visitorType,
      duration_minutes: durationMinutes,
      notes: bookingNotes || undefined,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>WESAL | وصل</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {lang === 'ar' ? 'بوابة الزوار الذكية' : 'Visitor Portal'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{user?.full_name || 'Visitor'}</span>
            </div>

            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Logout / Switch Role */}
            <button
              onClick={() => {
                logout();
                navigate('/gateway');
              }}
              title={lang === 'ar' ? 'تسجيل الخروج والعودة للبوابة' : 'Log out & return to gateway'}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
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
            <span>{lang === 'ar' ? 'البحث عن مريض وإصدار تصريح' : 'Patient Search & Pass Booking'}</span>
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
              {lang === 'ar' ? `تصاريحي النشطة (${myPasses.length})` : `My Active Passes (${myPasses.length})`}
            </span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: PATIENT SEARCH & PASS BOOKING */}
        {/* ==================================================================== */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-6 no-print">
            {/* Search Input Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="max-w-xl">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar' ? 'البحث عن مريض منوم' : 'Search Admitted Inpatient'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar'
                    ? 'ابحث باسم المريض أو رقمه المدني لمعرفة موقعه والتحقق الفوري من إمكانية الزيارة وسعة السرير'
                    : 'Search by patient name or civil ID to check real-time bedside capacity and request a visit token.'}
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
                      ? 'اكتب اسم المريض (مثال: سالم، فاطمة، سعيد)...'
                      : 'Type patient name (e.g. Salim, Fatima, Said)...'
                  }
                  className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 text-sm shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Patients Results Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">
                  {lang === 'ar' ? `المرضى المنومون المتوفرون (${patients.length})` : `Admitted Patients (${patients.length})`}
                </span>
                <span>
                  {lang === 'ar' ? 'يتم تحديث سعة الغرف فورياً' : 'Bedside capacities update in real-time'}
                </span>
              </div>

              {isLoadingPatients ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  <span className="text-xs">{lang === 'ar' ? 'جاري البحث في سجلات التنويم...' : 'Searching inpatient directory...'}</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                  {lang === 'ar'
                    ? 'لم يتم العثور على مريض منوم بهذا الاسم. يرجى التأكد من كتابة الاسم أو مراجعة الاستقبال'
                    : 'No admitted patient found matching this query. Please check spelling or contact the reception desk.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map((p) => {
                    const isFull = !p.can_admit_visitor || p.current_concurrent_visitors >= p.max_concurrent_visitors;
                    const displayName = lang === 'ar' && p.arabic_name ? p.arabic_name : p.full_name;
                    const secondaryName = lang === 'ar' && p.arabic_name ? p.full_name : null;

                    return (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                          isFull
                            ? 'border-slate-200 bg-slate-50/50 shadow-sm opacity-95'
                            : selectedPatient?.id === p.id
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header: Name & Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm leading-snug">{displayName}</h3>
                              {secondaryName && (
                                <div className="text-[11px] text-slate-500 font-medium">{secondaryName}</div>
                              )}
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                MRN: <span dir="ltr">{p.hospital_number}</span>
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                                isFull
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {!isFull ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>{lang === 'ar' ? 'متاح للزيارة' : 'Available'}</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>{lang === 'ar' ? 'سعة مكتملة' : 'Capacity Full'}</span>
                                </>
                              )}
                            </span>
                          </div>

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
                            <Clock className="w-3.5 h-3.5 text-hospital-600 shrink-0" />
                            <span>{lang === 'ar' ? 'مواعيد الزيارة اليوم:' : 'Visiting Hours:'}</span>
                            <span dir="ltr" className="font-mono font-semibold text-slate-700 inline-block">{p.visiting_hours}</span>
                          </div>
                        </div>

                        {/* Select Action Button */}
                        <div className="pt-4">
                          <button
                            type="button"
                            disabled={isFull}
                            onClick={() => !isFull && setSelectedPatient(p)}
                            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : selectedPatient?.id === p.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-emerald-800'
                            }`}
                          >
                            {isFull ? (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>{lang === 'ar' ? 'سعة السرير مكتملة (تعذر الحجز)' : 'Bedside Full (Locked)'}</span>
                              </>
                            ) : selectedPatient?.id === p.id ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'المريض محدد للزيارة' : 'Patient Selected'}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'ar' ? 'تحديد وإصدار التصريح' : 'Select Patient'}</span>
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

            {/* Step 2: Visit Token Booking Modal / Drawer */}
            {selectedPatient && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {lang === 'ar' ? 'الخطوة 2: تأكيد بيانات وتوقيت الزيارة' : 'Step 2: Confirm Visit Timing'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      {selectedPatient.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedPatient.ward_name} &bull; {selectedPatient.room_number} ({selectedPatient.bed})
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-bold"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                {bookPassMutation.isError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{(bookPassMutation.error as any)?.message || 'Failed to book pass'}</span>
                  </div>
                )}

                <form onSubmit={handleBookSubmit} className="space-y-5">
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
                          { val: 2, label: lang === 'ar' ? '2 دقيقة (تجريبي)' : '2 Min (Demo)' },
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

                  {/* Summary Notice */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'ar' ? 'إشعار الدخول عبر البوابات الذكية:' : 'Smart Gate Turnstile Policy:'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {lang === 'ar'
                        ? 'سيتم توليد رمز QR مشفر لمرة واحدة. يجب مسحه عند البوابة الخارجية (CP-01) وبوابة الجناح المخصص قبل انتهاء المدة المحددة.'
                        : 'A single-use cryptographic QR code will be issued. Scan it at the Main Entrance Turnstile (CP-01) and designated Ward Gate.'}
                    </p>
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
                      disabled={bookPassMutation.isPending}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2"
                    >
                      {bookPassMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'توليد رمز وتصريح الزيارة الآن' : 'Generate Digital QR Pass'}</span>
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
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 space-y-3 max-w-md mx-auto">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">
                  {lang === 'ar' ? 'لا يوجد لديك تصاريح زيارة نشطة حالياً' : 'No Active Visit Passes'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'يمكنك البحث عن المريض وتوليد تصريح فوري بالضغط على زر البحث'
                    : 'Search for an admitted patient to issue a digital scannable QR pass.'}
                </p>
                <button
                  onClick={() => setActiveTab('SEARCH')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  {lang === 'ar' ? 'البحث عن مريض الآن' : 'Search Patient Now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Pass Selector Cards */}
                <div className="lg:col-span-4 space-y-3 no-print">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'ar' ? 'سجل التصاريح الخاصة بك' : 'Your Visit Passes'}
                  </h3>

                  {myPasses.map((p) => (
                    <div
                      key={p.visit_id}
                      onClick={() => setActivePass(p)}
                      className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                        activePass?.visit_id === p.visit_id
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-xs font-bold text-emerald-800">{p.pass_code}</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{p.patient_name}</div>
                          <div className="text-[11px] text-slate-500">{p.ward_name} &bull; Room {p.room_number}</div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Side: The Official Scannable Digital QR Badge */}
                {activePass && (
                  <div className="lg:col-span-8 flex flex-col items-center">
                    {/* Action Bar */}
                    <div className="w-full max-w-sm flex items-center justify-between mb-3 no-print">
                      <span className="text-xs font-bold text-slate-700">
                        {lang === 'ar' ? 'البطاقة الرقمية الرسمية' : 'Digital Scannable Badge'}
                      </span>
                      <button
                        onClick={handlePrint}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'طباعة التصريح' : 'Print Badge'}</span>
                      </button>
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
                          <span>LIVE PASS</span>
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
                        <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                          {lang === 'ar' ? 'تصريح زيارة رقمي ذكي' : 'Smart Digital Visitor Pass'}
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
                          <span className="text-slate-500 font-medium">{lang === 'ar' ? 'اسم المريض:' : 'Patient Name:'}</span>
                          <span className="font-bold text-emerald-800">{activePass.patient_name}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500 font-medium">{lang === 'ar' ? 'الموقع والمبنى:' : 'Destination:'}</span>
                          <span className="font-semibold text-slate-800">
                            {activePass.ward_name} &bull; Room {activePass.room_number} ({activePass.bed})
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500 font-medium">{lang === 'ar' ? 'تاريخ وساعات الزيارة:' : 'Valid Window:'}</span>
                          <span className="font-bold text-slate-900">
                            {new Date(activePass.valid_from).toLocaleDateString()} ({activePass.max_duration_minutes} min)
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500 font-medium">{lang === 'ar' ? 'حالة التصريح:' : 'Pass Status:'}</span>
                          <span className="font-bold text-emerald-700">🟢 {activePass.status}</span>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400 no-print">
        {lang === 'ar'
          ? 'منظومة وصل — مستشفى السلطان قابوس — فريق رؤية للابتكار المؤسسي'
          : 'WESAL Platform — Sultan Qaboos Hospital — Roya Corporate Innovation Team'}
      </footer>
    </div>
  );
};
