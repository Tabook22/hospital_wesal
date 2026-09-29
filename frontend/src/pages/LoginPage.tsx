import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Building2, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Languages } from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsLoading(true);
    try {
      await login(role.toLowerCase());
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل تسجيل الدخول السريع' : 'Quick login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-hospital-50/40 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Header Bar */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={() => navigate('/gateway')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{lang === 'ar' ? 'بوابة الأدوار' : 'Role Gate'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-hospital-600" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center pt-8 sm:pt-0">
        {/* Hospital & Vision Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
          <Building2 className="w-4 h-4 text-hospital-600" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700">
            {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
          </span>
        </div>

        {/* Brand Logo */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-hospital-700 to-hospital-500 flex items-center justify-center text-white shadow-xl shadow-hospital-500/25">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'ar' ? 'وصل — WESAL' : 'WESAL — وصل'}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-hospital-700 mt-1">
          {t('brand.subtitle')}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          {lang === 'ar' ? 'نموذج تطبيقي رسمي للعرض في مستشفى السلطان قابوس' : 'Prototype for Sultan Qaboos Hospital Official Demonstration'}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, reception, security, management"
                  className="block w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {isLoading
                ? (lang === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing In...')
                : (lang === 'ar' ? 'تسجيل الدخول إلى مركز التحكم' : 'Sign In to Control Center')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>

          {/* Quick Demo Login Cards */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'ar' ? 'الدخول السريع بحسابات العرض' : 'Quick Demo Roles'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'ar' ? 'نقرة واحدة' : 'One-click login'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="p-2.5 text-left rtl:text-right rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-hospital-700">
                  {lang === 'ar' ? 'مسؤول النظام (Admin)' : 'Admin'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'صلاحيات كاملة وإعدادات' : 'Full System Access'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('RECEPTION')}
                className="p-2.5 text-left rtl:text-right rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-hospital-700">
                  {lang === 'ar' ? 'الاستقبال (Reception)' : 'Reception'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'تسجيل الزوار وإصدار التصاريح' : 'Visitor Registration'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('SECURITY')}
                className="p-2.5 text-left rtl:text-right rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-hospital-700">
                  {lang === 'ar' ? 'الأمن (Security)' : 'Security'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'ماسح البوابة الذكية' : 'Smart Gate Scanner'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('MANAGEMENT')}
                className="p-2.5 text-left rtl:text-right rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-hospital-700">
                  {lang === 'ar' ? 'الإدارة (Management)' : 'Management'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'المؤشرات والمراقبة الحية' : 'KPIs & Live Monitor'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          {lang === 'ar'
            ? 'مستشفى السلطان قابوس © 2026 • منظومة وصل للتحكم في الزوار'
            : 'Sultan Qaboos Hospital © 2026 • Wesal Access Management'}
        </p>
      </div>
    </div>
  );
};
