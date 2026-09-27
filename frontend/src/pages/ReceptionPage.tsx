import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, UserCheck, Shield, CheckCircle2,
  AlertCircle, Clock, QrCode, Printer, ArrowRight, ArrowLeft,
  Sparkles, Building2, Phone, IdCard, Info, HeartHandshake,
  BookOpen, BedDouble
} from 'lucide-react';
import { Patient, Visit } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AdminWorkflowGuide } from '../components/common/AdminWorkflowGuide';

export const ReceptionPage: React.FC = () => {
  const { t, lang, isRtl } = useLanguage();
  const navigate = useNavigate();

  // Wizard Step: 1 = Patient, 2 = Visitor Info, 3 = Visit Permission, 4 = Confirmation / Pass Generated
  const [step, setStep] = useState<number>(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Visitor Form State
  const [visitorName, setVisitorName] = useState('');
  const [civilId, setCivilId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [visitorType, setVisitorType] = useState<'VISITOR' | 'COMPANION'>('VISITOR');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');

  // Duration State (Demo mode support)
  const [durationMinutes, setDurationMinutes] = useState<number>(2); // Default to 2 min for interactive demo
  const [generatedVisit, setGeneratedVisit] = useState<Visit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Fetch Patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => api.getPatients(patientSearch),
  });

  // Fetch Policy to check demo mode
  const { data: policy } = useQuery({
    queryKey: ['policy-settings'],
    queryFn: () => api.getSettings(),
  });

  // Create Visit Mutation
  const createVisitMutation = useMutation({
    mutationFn: () => {
      if (!selectedPatient) throw new Error('Patient not selected');
      return api.createVisit({
        patient_id: selectedPatient.id,
        full_name: visitorName,
        civil_id: civilId,
        mobile_number: mobileNumber,
        visitor_type: visitorType,
        relationship_to_patient: relationship,
        notes: notes,
        duration_minutes: durationMinutes,
      });
    },
    onSuccess: (data) => {
      setGeneratedVisit(data);
      setStep(4);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to register visit');
    },
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setErrorMessage(null);
    setStep(2);
  };

  const handleValidateStep2 = () => {
    if (!visitorName.trim()) {
      setErrorMessage(lang === 'ar' ? 'يرجى إدخال اسم الزائر أو المرافق بالكامل' : 'Please enter visitor full name');
      return;
    }
    if (!civilId.trim()) {
      setErrorMessage(lang === 'ar' ? 'يرجى إدخال الرقم المدني أو بطاقة الهوية الوطنية' : 'Please enter Civil ID or National Identification number');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage(lang === 'ar' ? 'يرجى إدخال رقم هاتف متنقل صحيح لإرسال الرسائل النصية' : 'Please enter a valid mobile number for SMS alerts');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleRegisterAndIssuePass = () => {
    setErrorMessage(null);
    createVisitMutation.mutate();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedPatient(null);
    setVisitorName('');
    setCivilId('');
    setMobileNumber('');
    setRelationship('');
    setNotes('');
    setGeneratedVisit(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Operator Guide Button */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-hospital-600 to-indigo-600 text-white shadow-md shadow-hospital-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('rec.title')}</h1>
              <p className="text-xs text-slate-500">
                {t('rec.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-sm group"
          >
            <BookOpen className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>{lang === 'ar' ? '💡 دليل المشغل وخطوات التسجيل' : '💡 Operator Registration Guide'}</span>
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: t('rec.step1') },
              { num: 2, label: t('rec.step2') },
              { num: 3, label: t('rec.step3') },
              { num: 4, label: t('rec.step4') },
            ].map((st) => (
              <div key={st.num} className="flex-1 flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      step > st.num
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : step === st.num
                        ? 'bg-hospital-600 text-white shadow-md ring-4 ring-hospital-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > st.num ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden md:inline truncate ${
                      step >= st.num ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {st.num < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 sm:mx-3 transition-colors ${
                      step > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Active Step Indicator for Mobile */}
          <div className="md:hidden mt-2.5 text-center">
            <span className="text-xs font-bold text-hospital-700 bg-hospital-50 px-3 py-1 rounded-full border border-hospital-200">
              {step === 1 ? t('rec.step1') :
               step === 2 ? t('rec.step2') :
               step === 3 ? t('rec.step3') : t('rec.step4')}
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Find Patient */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('rec.search_patient_title')}</h2>
            <p className="text-xs text-slate-500">
              {t('rec.search_patient_subtitle')}
            </p>
          </div>

          {/* Friendly Operator Tip Box for Step 1 */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-900 block mb-0.5">
                {lang === 'ar' ? '💡 توجيهات المشغل للخطوة 1: فحص سعة السرير' : '💡 Operator Guide for Step 1: Bedside Capacity Check'}
              </span>
              <span>
                {lang === 'ar'
                  ? 'ابحث عن المريض وتأكد أن سعة السرير غير مكتملة (أقل من 2). إذا كانت السعة (2/2)، فالسرير محجوز بالكامل ويمنع النظام إصدار تصريح جديد لحماية راحة المريض؛ اطلب من الزائر بلطف الانتظار في صالة الاستقبال حتى مغادرة أحدهم.'
                  : 'Search for the patient and verify bedside capacity (<2). If capacity is 2/2, the bed is occupied and the system locks new passes to protect patient recovery; kindly ask the visitor to wait in the lounge.'}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder={t('rec.search_patient_placeholder')}
              className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500 shadow-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {patients.map((p) => {
              const isFull = p.current_visitors_count >= p.max_concurrent_visitors;
              const isDailyLimit = p.today_visitors_count >= p.max_daily_visitors;
              const cannotAdmit = !p.can_admit_visitor;

              return (
                <div
                  key={p.id}
                  onClick={() => !cannotAdmit && handleSelectPatient(p)}
                  className={`p-4 rounded-xl border transition-all text-left rtl:text-right ${
                    cannotAdmit
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-hospital-400 hover:shadow-md cursor-pointer group'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-hospital-600 block">
                        {p.hospital_number}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-hospital-600 transition-colors">
                        {p.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.ward_name} • {p.room_number} ({p.bed})
                      </p>
                    </div>

                    <div className="text-right rtl:text-left space-y-1">
                      {/* Bedside Capacity Badge */}
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isFull
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {t('rec.bedside_capacity')}: {p.current_visitors_count}/{p.max_concurrent_visitors}
                      </span>

                      {/* Warning if blocked */}
                      {isFull && (
                        <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5 justify-end rtl:justify-start">
                          <AlertCircle className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'السرير ممتلئ (2/2)' : 'Bed Full (2/2)'}</span>
                        </div>
                      )}
                      {isDailyLimit && !isFull && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          {lang === 'ar' ? 'وصل الحد اليومي (6)' : 'Max daily limit reached'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{lang === 'ar' ? `الزيارات اليوم: ${p.today_visitors_count}/${p.max_daily_visitors}` : `Visits Today: ${p.today_visitors_count}/${p.max_daily_visitors}`}</span>
                    <span className="font-semibold text-hospital-600 group-hover:underline">
                      {cannotAdmit ? (lang === 'ar' ? 'غير متاح للزيارة حالياً' : 'Capacity Locked') : (lang === 'ar' ? 'اختيار المريض ←' : 'Select Patient →')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Visitor Information */}
      {step === 2 && selectedPatient && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Selected Patient Mini Banner */}
          <div className="p-3.5 rounded-xl bg-hospital-50 border border-hospital-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-hospital-600 text-white flex items-center justify-center font-bold text-xs">
                {selectedPatient.full_name[0]}
              </div>
              <div>
                <span className="text-[10px] text-hospital-600 font-semibold uppercase">{lang === 'ar' ? 'المريض المنوم المحدد' : 'Selected Patient'}</span>
                <div className="text-xs font-bold text-hospital-950">{selectedPatient.full_name}</div>
                <p className="text-xs text-hospital-800">
                  {selectedPatient.hospital_number} • {selectedPatient.ward_name} • {selectedPatient.room_number} ({selectedPatient.bed})
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-hospital-700 hover:underline"
            >
              {lang === 'ar' ? 'تغيير المريض' : 'Change Patient'}
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">{t('rec.visitor_info_title')}</h2>
            <p className="text-xs text-slate-500">
              {t('rec.visitor_info_subtitle')}
            </p>
          </div>

          {/* Friendly Operator Tip Box for Step 2 */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-xs text-slate-700 flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-900 block mb-0.5">
                {lang === 'ar' ? '💡 توجيهات المشغل للخطوة 2: التعامل مع نوع واحتياجات الزائر' : '💡 Operator Guide for Step 2: Visitor Needs & Identity'}
              </span>
              <span>
                {lang === 'ar'
                  ? '• زائر اعتيادي: للزيارات الروتينية (ساعة واحدة). • مرافق مريض: للمرافقة الدائمة لحالات كبار السن والأطفال والعمليات. • تأكد من تسجيل رقم الهاتف العماني الصحيح لتمكين تنبيهات الرسائل النصية القصيرة (SMS).'
                  : '• Regular Visitor: Standard 1-hour visit. • Patient Companion: Extended stay for elderly, pediatric, or post-op care. • Ensure accurate Omani mobile number to receive automated SMS alerts.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.full_name')}
              </label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: سالم بن أحمد العامري' : 'e.g. Salem Ahmed Al-Amri'}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.civil_id')}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={civilId}
                onChange={(e) => setCivilId(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: 10928374' : 'e.g. 10928374'}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.mobile')}
              </label>
              <input
                type="tel"
                inputMode="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: 96891234567' : 'e.g. 96891234567'}
                className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.type')}
              </label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as any)}
                aria-label={t('rec.type')}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500 bg-white"
              >
                <option value="VISITOR">{t('rec.type_visitor')}</option>
                <option value="COMPANION">{t('rec.type_companion')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.relationship')}
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: أخ، والدة، صديق' : 'e.g. Brother, Mother, Friend'}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('rec.notes')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: توصيل مستلزمات طبية' : 'e.g. Bringing medical items'}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary text-xs"
            >
              {t('btn.back')}
            </button>
            <button
              type="button"
              onClick={handleValidateStep2}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <span>{t('rec.btn_continue')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Visit Permission & Duration (with Demo Mode) */}
      {step === 3 && selectedPatient && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('rec.permission_title')}</h2>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'تحديد الجناح المصرح به والمدة الزمنية للزيارة قبل تشفير وإصدار رمز QR.'
                : 'Specify authorized ward access and duration limits before cryptographic QR generation.'}
            </p>
          </div>

          {/* Friendly Operator Tip Box for Step 3 */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block mb-0.5">
                {lang === 'ar' ? '💡 توجيهات المشغل للخطوة 3: تحديد الصلاحيات والمدة' : '💡 Operator Guide for Step 3: Access Policies & Duration'}
              </span>
              <span>
                {lang === 'ar'
                  ? 'التصريح مخصص للجناح المنوم به المريض فقط لحماية خصوصية الأجنحة الأخرى. لعروض لجان التقييم، يمكنك اختيار مدة تجريبية سريعة (1 أو 2 دقيقة) لاختبار نظام التنبيهات والعد التنازلي المباشر.'
                  : 'Access is restricted to the patient’s ward. For live evaluation demonstrations, select a 1- or 2-minute demo duration to observe live countdown and SMS triggers.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'الجناح المصرح به' : 'Authorized Ward'}</span>
              <div className="text-sm font-black text-slate-900 mt-1">{selectedPatient.ward_name}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'ar' ? 'محدد تلقائياً حسب سرير وغرفة المريض' : 'Auto-populated from patient bedside room'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'مواعيد الزيارة الرسمية' : 'Visiting Window'}</span>
              <div className="text-sm font-black text-slate-900 mt-1">17:00 – 19:00</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'ar' ? 'أوقات الزيارة المعتمدة بمستشفى السلطان قابوس' : 'Hospital official visiting hours'}</p>
            </div>
          </div>

          {/* Duration Selector with interactive Demo Mode values */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  {t('rec.duration_title')}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                {t('rec.demo_mode_badge')}
              </span>
            </div>
            <p className="text-xs text-indigo-900/80">
              {lang === 'ar'
                ? 'حدد مدة الزيارة. تتيح المدد القصيرة (1-2 دقيقة) للمسؤولين مشاهدة آليات التحذير وتجاوز الوقت الحية أثناء العرض التجريبي دون الحاجة للانتظار 20 دقيقة.'
                : 'Select visit duration. Short durations (1-2 minutes) allow hospital officials to observe the live 5-minute warning and overdue alert mechanisms during the presentation without waiting 20 minutes.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { label: lang === 'ar' ? '1 دقيقة' : '1 Min', val: 1 },
                { label: lang === 'ar' ? '2 دقيقة' : '2 Mins', val: 2 },
                { label: lang === 'ar' ? '5 دقائق' : '5 Mins', val: 5 },
                { label: lang === 'ar' ? '10 دقائق' : '10 Mins', val: 10 },
                { label: lang === 'ar' ? '20 دقيقة' : '20 Mins', val: 20 },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDurationMinutes(d.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition-all ${
                    durationMinutes === d.val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Checklist Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              {lang === 'ar' ? 'الفحوصات الأمنية والسياسات قبل الإصدار' : 'Pre-Issuance Validation Checks'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'المريض منوم وسريره نشط' : 'Patient Admitted & Bed Active'}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'السعة السريرية الحالية متاحة (أقل من 2)' : 'Concurrent Bedside Capacity Available'}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'تم التحقق من هوية الزائر ورقم الهاتف' : 'Visitor ID & Mobile Validated'}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'صلاحية الجناح محددة ومشفرة' : 'Ward Cryptographic Signature Ready'}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary text-xs"
            >
              {t('btn.back')}
            </button>
            <button
              type="button"
              onClick={handleRegisterAndIssuePass}
              disabled={createVisitMutation.isPending}
              className="btn-primary text-xs flex items-center gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {createVisitMutation.isPending
                  ? (lang === 'ar' ? 'جاري تشفير وإصدار التصريح...' : 'Generating Pass...')
                  : t('rec.generate_pass_btn')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Pass Generated & Printable Badge Preview */}
      {step === 4 && generatedVisit && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('rec.pass_ready_title')}</h2>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'تم إنشاء رمز QR مشفر وتوثيق التصريح بنجاح. يمكنك الآن طباعة البطاقة للزائر أو مسحها مباشرة.'
                : 'Encrypted QR pass successfully minted. You may now print the visitor badge or scan at gates.'}
            </p>
          </div>

          {/* Friendly Operator Tip Box for Step 4 */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-slate-700 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 block mb-0.5">
                {lang === 'ar' ? '💡 ماذا تفعل الآن بعد صدور التصريح؟' : '💡 Next Steps After Pass Generation'}
              </span>
              <span>
                {lang === 'ar'
                  ? '1. اضغط "طباعة بطاقة الزائر" وسلمها للزائر أو اطلب منه تصوير رمز QR بهاتفه. 2. وجّه الزائر إلى البوابة الرئيسية (CP-01) لمسح الرمز ضوئياً، حيث تفتح البوابة ويبدأ احتساب وقت الزيارة تلقائياً.'
                  : '1. Click "Print Badge" and hand it to visitor or let them capture QR on phone. 2. Direct visitor to Main Gate CP-01 for optical barcode scan to start their visit.'}
              </span>
            </div>
          </div>

          {/* Printable Official Visitor Badge (A6 standard layout) */}
          <div className="max-w-xs mx-auto border-2 border-slate-900 rounded-2xl p-5 bg-white shadow-lg space-y-4 print-page">
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {t('pass.ministry_header')}
              </div>
              <h3 className="font-black text-sm text-slate-900 mt-0.5">{t('hospital.name')}</h3>
              <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-hospital-100 text-hospital-800">
                {generatedVisit.visitor_type === 'COMPANION' ? 'مرافق مريض (COMPANION)' : 'تصريح زائر (VISITOR PASS)'}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
              {generatedVisit.pass_obj?.qr_image_base64 ? (
                <img
                  src={generatedVisit.pass_obj.qr_image_base64}
                  alt="Pass QR Code"
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                  QR Code
                </div>
              )}
              <span className="font-mono text-xs font-bold text-slate-700 mt-1">
                {generatedVisit.pass_obj?.pass_code}
              </span>
            </div>

            {/* Badge Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.visitor')}</span>
                <span className="font-bold text-slate-900">{generatedVisit.visitor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.patient')}</span>
                <span className="font-semibold text-slate-800">{generatedVisit.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.destination')}</span>
                <span className="font-bold text-hospital-700">{generatedVisit.ward_name} ({generatedVisit.patient_room})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.duration')}</span>
                <span className="font-bold text-slate-900">
                  {generatedVisit.max_duration_minutes} {lang === 'ar' ? 'دقيقة' : 'minutes'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.code')}</span>
                <span className="font-mono font-bold text-slate-900">{generatedVisit.pass_obj?.pass_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('pass.status')}</span>
                <span className="font-bold text-emerald-600">{t('status.active')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
              {t('pass.footer_note')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> {t('rec.print_badge_btn')}
            </button>

            <button
              onClick={() => navigate('/gate')}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              {lang === 'ar' ? 'الانتقال إلى ماسح البوابة الذكية' : 'Go to Smart Gate Scanner'}
            </button>

            <button
              onClick={resetForm}
              className="btn-secondary text-xs"
            >
              {t('rec.another_visitor')}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal Guide */}
      <AdminWorkflowGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
