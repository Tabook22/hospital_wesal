import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ShieldAlert, Users, Volume2, Clock, CheckCircle2,
  X, Send, Building2, MapPin, User, Shield, Sparkles, AlertOctagon
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { IncidentCategory, IncidentSeverity, StaffIncidentCreatePayload } from '../../types';

interface QuickIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWard?: string;
  initialRoom?: string;
}

export const QuickIncidentModal: React.FC<QuickIncidentModalProps> = ({
  isOpen,
  onClose,
  initialWard,
  initialRoom,
}) => {
  const { lang, isRtl } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<IncidentCategory>('OVERCROWDING');
  const [severity, setSeverity] = useState<IncidentSeverity>('URGENT');
  const [wardName, setWardName] = useState<string>(initialWard || 'Medical Ward A');
  const [locationDetails, setLocationDetails] = useState<string>(initialRoom || '');
  const [reporterName, setReporterName] = useState<string>(user?.full_name || 'Nurse Maryam Al-Kathiri');
  const [reporterRole, setReporterRole] = useState<string>(user?.role || 'NURSE');
  
  const [visitorName, setVisitorName] = useState<string>('');
  const [passCode, setPassCode] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [suggestedAction, setSuggestedAction] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (user?.full_name) {
      setReporterName(user.full_name);
    }
    if (user?.username === 'doctor') {
      setReporterRole('DOCTOR');
    } else if (user?.role === 'STAFF') {
      setReporterRole('NURSE');
    } else if (user?.role) {
      setReporterRole(user.role);
    }
  }, [user, isOpen]);

  // Pre-configured category presets for 1-click fast selection
  const categories: {
    id: IncidentCategory;
    icon: React.ComponentType<{ className?: string }>;
    labelAr: string;
    labelEn: string;
    defaultTitleAr: string;
    defaultTitleEn: string;
    defaultSeverity: IncidentSeverity;
    suggestedActionAr: string;
    suggestedActionEn: string;
  }[] = [
    {
      id: 'OVERCROWDING',
      icon: Users,
      labelAr: 'تكدس وزحام الزوار',
      labelEn: 'Ward Overcrowding',
      defaultTitleAr: 'تكدس زوار عند سرير المريض وتجاوز الطاقة الاستيعابية',
      defaultTitleEn: 'Excessive visitors exceeding bedside capacity limit',
      defaultSeverity: 'URGENT',
      suggestedActionAr: 'إرسال الأمن أو الاستقبال لتوجيه باقي الزوار إلى صالة الانتظار وتنظيم الدخول بالتناوب.',
      suggestedActionEn: 'Dispatch security/reception to escort extra visitors to waiting lounge and enforce 2-visitor rotation.',
    },
    {
      id: 'NOISE_DISTURBANCE',
      icon: Volume2,
      labelAr: 'إزعاج وضوضاء أطفال',
      labelEn: 'Noise & Children Disturbance',
      defaultTitleAr: 'أطفال وزوار يصدرون أصواتاً مرتفعة وضوضاء بالممر',
      defaultTitleEn: 'Children and companions causing noise in patient recovery corridor',
      defaultSeverity: 'HIGH',
      suggestedActionAr: 'تنبيه المرافقين بلباقة بضرورة التزام الهدوء أو مرافقة الأطفال للخارج.',
      suggestedActionEn: 'Politely remind family to maintain hospital quiet hours or take children to outdoor area.',
    },
    {
      id: 'UNAUTHORIZED_AREA',
      icon: ShieldAlert,
      labelAr: 'زائر في قسم غير مصرح به',
      labelEn: 'Unauthorized Area Access',
      defaultTitleAr: 'تواجد زائر في قسم طبي مقيد بدون تصريح معتمد',
      defaultTitleEn: 'Visitor detected in restricted medical ward without valid pass',
      defaultSeverity: 'URGENT',
      suggestedActionAr: 'التحقق من التصريح فوراً ومرافقة الزائر إلى القسم المصرح له أو الاستقبال.',
      suggestedActionEn: 'Verify pass immediately and escort visitor back to authorized section or reception.',
    },
    {
      id: 'URGENT_ACTION',
      icon: AlertOctagon,
      labelAr: 'تدخل أمني عاجل',
      labelEn: 'Urgent Security Dispatch',
      defaultTitleAr: 'موقف طارئ يتطلب حضوراً فورياً لمسؤولي الأمن',
      defaultTitleEn: 'Emergency situation requiring immediate security intervention',
      defaultSeverity: 'URGENT',
      suggestedActionAr: 'توجه أقرب دورية أمنية للموقع للتعامل مع الموقف.',
      suggestedActionEn: 'Direct nearest security patrol to the location immediately.',
    },
    {
      id: 'VISITING_HOURS_VIOLATION',
      icon: Clock,
      labelAr: 'تجاوز وقت الزيارة',
      labelEn: 'Visiting Hours Overstay',
      defaultTitleAr: 'استمرار الزوار داخل الغرفة بعد انتهاء ساعات الزيارة',
      defaultTitleEn: 'Visitors remaining inside inpatient room past official visiting window',
      defaultSeverity: 'MEDIUM',
      suggestedActionAr: 'تذكير الزائر بانتهاء وقت الزيارة وإرشاده إلى بوابات الخروج.',
      suggestedActionEn: 'Remind visitors of visiting hour closure and assist towards smart exit gates.',
    },
    {
      id: 'BEHAVIORAL_ISSUE',
      icon: AlertTriangle,
      labelAr: 'سلوك غير لائق أو مخالفة',
      labelEn: 'Behavioral Violation',
      defaultTitleAr: 'ملاحظة سلوك غير لائق أو مخالفة لتعليمات مكافحة العدوى',
      defaultTitleEn: 'Observed inappropriate behavior or infection control violation',
      defaultSeverity: 'HIGH',
      suggestedActionAr: 'توجيه تنبيه رسمي للزائر وتسجيل الملاحظة في ملف الزيارة.',
      suggestedActionEn: 'Issue formal compliance warning and record note in visitor profile.',
    },
  ];

  // Auto-fill title & action when category changes if title is empty or matching defaults
  const handleCategorySelect = (item: typeof categories[0]) => {
    setCategory(item.id);
    setSeverity(item.defaultSeverity);
    setTitle(lang === 'ar' ? item.defaultTitleAr : item.defaultTitleEn);
    setSuggestedAction(lang === 'ar' ? item.suggestedActionAr : item.suggestedActionEn);
  };

  const createIncidentMutation = useMutation({
    mutationFn: (payload: StaffIncidentCreatePayload) => api.createIncident(payload),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['staff-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['staff-portal-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setVisitorName('');
        setPassCode('');
      }, 1400);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert(lang === 'ar' ? 'يرجى كتابة عنوان البلاغ وشرح الملاحظة.' : 'Please provide an incident title and description.');
      return;
    }

    createIncidentMutation.mutate({
      category,
      severity,
      ward_name: wardName,
      location_details: locationDetails.trim() || undefined,
      reporter_name: reporterName.trim(),
      reporter_role: reporterRole,
      visitor_name: visitorName.trim() || undefined,
      pass_code: passCode.trim() || undefined,
      title: title.trim(),
      description: description.trim(),
      suggested_action: suggestedAction.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {lang === 'ar' ? 'إرسال بلاغ أو ملاحظة إدارية عاجلة' : 'Staff Incident & Urgent Notice Dispatch'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase border border-white/30">
                  {lang === 'ar' ? 'بث حي وفوري' : 'Live Broadcast'}
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                {lang === 'ar'
                  ? 'يتم إشعار إدارة المستشفى ومكتب الاستقبال ودوريات الأمن فورياً لاتخاذ الإجراء'
                  : 'Instantly alerts Hospital Administration, Reception Desk & Security Officers'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'تم إرسال البلاغ وبثه للإدارة بنجاح!' : 'Incident Dispatched Live to Administration!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'تم استلام الإشعار في شاشات الاستقبال والأمن وسيتم التحرك فوراً للتعامل مع الموقف.'
                  : 'The report has appeared on Admin & Reception dashboards with real-time audio chime.'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* 1. Quick Category Buttons (1-Click Presets) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'ar' ? '1. اختر نوع الملاحظة أو البلاغ:' : '1. Select Incident Type:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCategorySelect(item)}
                      className={`p-3 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-slate-500'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-rose-600" />}
                      </div>
                      <span className="text-xs font-bold leading-tight block">
                        {lang === 'ar' ? item.labelAr : item.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Priority / Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {lang === 'ar' ? 'درجة الخطورة والاستعجال:' : 'Urgency Level:'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'URGENT', labelAr: 'عاجل جداً', labelEn: 'Urgent', bg: 'bg-rose-600 text-white', border: 'border-rose-600' },
                    { id: 'HIGH', labelAr: 'مرتفع', labelEn: 'High', bg: 'bg-amber-600 text-white', border: 'border-amber-600' },
                    { id: 'MEDIUM', labelAr: 'متوسط', labelEn: 'Medium', bg: 'bg-blue-600 text-white', border: 'border-blue-600' },
                    { id: 'LOW', labelAr: 'عادي', labelEn: 'Low', bg: 'bg-slate-700 text-white', border: 'border-slate-600' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id as IncidentSeverity)}
                      className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-all ${
                        severity === s.id
                          ? s.bg
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'ar' ? s.labelAr : s.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ward Location */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {lang === 'ar' ? 'الجناح أو القسم المعني:' : 'Ward / Department:'}
                </label>
                <select
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0 bg-white"
                >
                  <option value="Medical Ward A">{lang === 'ar' ? 'جناح الباطنية (أ)' : 'Medical Ward A'}</option>
                  <option value="Medical Ward B">{lang === 'ar' ? 'جناح الباطنية (ب)' : 'Medical Ward B'}</option>
                  <option value="Intensive Care Unit (ICU)">{lang === 'ar' ? 'العناية المركزة (ICU)' : 'Intensive Care Unit (ICU)'}</option>
                  <option value="Pediatric Ward">{lang === 'ar' ? 'جناح الأطفال' : 'Pediatric Ward'}</option>
                  <option value="Surgical Ward">{lang === 'ar' ? 'جناح الجراحة' : 'Surgical Ward'}</option>
                  <option value="Emergency Department">{lang === 'ar' ? 'قسم الطوارئ' : 'Emergency Department'}</option>
                  <option value="Main Entrance & Lobby">{lang === 'ar' ? 'المدخل الرئيسي والبهو' : 'Main Entrance & Lobby'}</option>
                </select>
              </div>
            </div>

            {/* Room / Specific Location & Optional Pass Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'الموقع الدقيق (غرفة / سرير / ممر):' : 'Specific Room / Bed / Corridor:'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: غرفة 204 أو ممر العناية الشرقي' : 'e.g. Room 204, Bed B, East Corridor'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'اسم الزائر أو رقم التصريح (اختياري):' : 'Visitor Name or Pass Code (Optional):'}
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: سالم المشيخي أو WES-000101' : 'e.g. Salim or WES-000101'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0"
                />
              </div>
            </div>

            {/* Headline Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {lang === 'ar' ? 'عنوان الملاحظة / البلاغ:' : 'Incident Headline / Title:'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب عنواناً مختصراً للموقف...' : 'Brief summary of the issue...'}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {lang === 'ar' ? 'تفاصيل الملاحظة والإجراء المطلوب اتخاذه:' : 'Observation Details & Action Required:'}
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اشرح ما لاحظته: مثال (تجمع أكثر من 6 أشخاص عند السرير مع وجود أطفال يركضون ويصدرون إزعاجاً للمرضى المجاورين، يرجى حضور الأمن لتنظيم الزوار وإخلاء الممر)...'
                    : 'Describe the situation in detail: e.g. Overcrowding around bed with loud children disturbing patients...'
                }
                className="w-full p-3 text-xs rounded-2xl border border-slate-300 focus:border-rose-500 focus:ring-0 leading-relaxed"
              />
            </div>

            {/* Suggested Action for Admin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'ar' ? 'الإجراء المقترح على الإدارة / الأمن (اختياري):' : 'Suggested Action for Security/Admin (Optional):'}
              </label>
              <input
                type="text"
                value={suggestedAction}
                onChange={(e) => setSuggestedAction(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: إرسال دورية أمنية لإخلاء الممر وتنبيه الزوار...' : 'e.g. Dispatch security to clear corridor...'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0"
              />
            </div>

            {/* Reporter details bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>
                  {lang === 'ar' ? 'الموظف المبلغ:' : 'Reporting Staff:'}{' '}
                  <strong className="text-slate-800">{reporterName}</strong> ({reporterRole})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={createIncidentMutation.isPending}
                className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-600/30 transition-all"
              >
                {createIncidentMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إرسال البلاغ فورياً' : 'Dispatch Incident'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
