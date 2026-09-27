import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Settings, Save, Sparkles, Clock, Users, Shield, CheckCircle2,
  Building, AlertCircle
} from 'lucide-react';
import { PolicySettings } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState<Partial<PolicySettings>>({
    visiting_start: '17:00',
    visiting_end: '19:00',
    default_duration_minutes: 20,
    warning_threshold_minutes: 5,
    max_concurrent_per_patient: 2,
    max_daily_per_patient: 6,
    companions_allowed: 1,
    demo_mode_enabled: true,
    demo_duration_minutes: 2,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: policy, isLoading, refetch } = useQuery<PolicySettings>({
    queryKey: ['policy-settings-page'],
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (policy) {
      setForm(policy);
    }
  }, [policy]);

  const updateMutation = useMutation({
    mutationFn: () => api.updateSettings(form),
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      refetch();
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-hospital-100 text-hospital-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {lang === 'ar' ? 'سياسات وإعدادات زيارة المستشفى' : 'Hospital Visitation Policy & Settings'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'ضبط السياسات الرسمية لمستشفى السلطان قابوس، مدد الزيارة، وسعة الأسرة ووضع المحاكاة'
                  : 'Configure official Sultan Qaboos Hospital access rules, duration limits, and live demo mode'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          {updateMutation.isPending
            ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving Policies...')
            : (lang === 'ar' ? 'حفظ السياسات' : 'Save Settings')}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {lang === 'ar'
            ? 'تم تحديث سياسات زيارة المستشفى وتعميمها بنجاح على كافة البوابات الذكية.'
            : 'Hospital visitation policies updated and broadcasted to all smart gates.'}
        </div>
      )}

      {/* Demo Mode Setting Box */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ar' ? 'وضع المحاكاة التفاعلي (Demo Mode)' : 'Interactive Demonstration Mode'}
              </h2>
              <p className="text-xs text-indigo-950/70">
                {lang === 'ar'
                  ? 'يتيح تسريع فترات الزيارة لمشاهدة آليات التحذير وتجاوز الوقت الحية أثناء العرض'
                  : 'Enables fast evaluation of warning and overdue expiry transitions during presentations'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.demo_mode_enabled ?? true}
              onChange={(e) => setForm({ ...form, demo_mode_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="pt-2 border-t border-indigo-200/60">
          <label className="block text-xs font-bold text-indigo-950 uppercase mb-2">
            {lang === 'ar' ? 'المدة الافتراضية للمحاكاة' : 'Default Demo Duration'}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 5, 10, 20].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setForm({ ...form, demo_duration_minutes: mins })}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  form.demo_duration_minutes === mins
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-100/50'
                }`}
              >
                {mins} {lang === 'ar' ? (mins === 1 ? 'دقيقة' : 'دقائق') : (mins === 1 ? 'Minute' : 'Minutes')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital Visiting Hours & Policies */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? 'مواعيد الزيارة الرسمية' : 'Hospital Visiting Hours'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar' ? 'جدول الزيارة العامة المعتمد في المستشفى' : 'Official general visitation schedule'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {lang === 'ar' ? 'بداية فترة الزيارة' : 'Visiting Window Start'}
            </label>
            <input
              type="text"
              value={form.visiting_start || '17:00'}
              onChange={(e) => setForm({ ...form, visiting_start: e.target.value })}
              className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {lang === 'ar' ? 'نهاية فترة الزيارة' : 'Visiting Window End'}
            </label>
            <input
              type="text"
              value={form.visiting_end || '19:00'}
              onChange={(e) => setForm({ ...form, visiting_end: e.target.value })}
              className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {lang === 'ar' ? 'حدود سعة الأسرة ومدد الزيارة' : 'Patient Capacity & Duration Limits'}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {lang === 'ar'
              ? 'تُطبق آلياً عند كافة بوابات التفتيش ومكاتب الاستقبال'
              : 'Enforced at all smart gates and reception desks'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'المدة القياسية للزيارة (بالدقائق)' : 'Standard Visit Duration (Minutes)'}
              </label>
              <input
                type="number"
                value={form.default_duration_minutes || 20}
                onChange={(e) => setForm({ ...form, default_duration_minutes: parseInt(e.target.value, 10) })}
                className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'وقت التنبيه قبل انتهاء الزيارة (بالدقائق)' : 'Ending Soon Warning Threshold (Minutes)'}
              </label>
              <input
                type="number"
                value={form.warning_threshold_minutes || 5}
                onChange={(e) => setForm({ ...form, warning_threshold_minutes: parseInt(e.target.value, 10) })}
                className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'الحد الأقصى للزوار المتزامنين عند السرير (2 زوار)' : 'Max Concurrent Visitors at Bedside'}
              </label>
              <input
                type="number"
                value={form.max_concurrent_per_patient || 2}
                onChange={(e) => setForm({ ...form, max_concurrent_per_patient: parseInt(e.target.value, 10) })}
                className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'الحد الأقصى للزوار في اليوم للمريض الواحد (6 زوار)' : 'Max Daily Visitors per Patient'}
              </label>
              <input
                type="number"
                value={form.max_daily_per_patient || 6}
                onChange={(e) => setForm({ ...form, max_daily_per_patient: parseInt(e.target.value, 10) })}
                className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
