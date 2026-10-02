import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Users, ArrowRight, CheckCircle2,
  Lock, QrCode, Search, Activity, Languages, Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const RoleSelectionPage: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-hospital-50/30 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-8">
      {/* Top Navbar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hospital-600 text-white flex items-center justify-center shadow-md shadow-hospital-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>WESAL — وصل</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-hospital-100 text-hospital-800">
                {lang === 'ar' ? 'بوابة الأدوار' : 'Dual-Role Gate'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-hospital-600" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Main Choice Section */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="text-center space-y-2 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'ar' ? 'اختر نوع الحساب للمتابعة' : 'Select Your Access Portal'}
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            {lang === 'ar'
              ? 'يرجى تحديد صفتك للتوجه إلى البوابة المناسبة وضمان تطبيق ضوابط الأمان وخصوصية المرضى'
              : 'Please select your role below to ensure seamless access routing and strict regulatory compliance.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Card A: Hospital Staff */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-hospital-500 shadow-xl shadow-slate-200/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 text-hospital-400" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {lang === 'ar' ? 'المستوى 1: تحكم كامل' : 'Tier 1: Full Control'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? 'موظفو المستشفى (إدارة / تمريض / أطباء)' : 'Hospital Personnel (Admin / Clinical / Reception)'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar'
                    ? 'للأطباء، هيئة التمريض، مسؤولي الاستقبال، حراس الأمن، والإدارة التنفيذية'
                    : 'For doctors, nursing staff, receptionists, security, and hospital management.'}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-hospital-600 flex-shrink-0" />
                  <span>{lang === 'ar' ? 'إدارة سجلات وتنويم المرضى ومكتب الاستقبال' : 'Full Patient Admission & Reception CRUD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800">{lang === 'ar' ? 'بوابة بلاغات وملاحظات التمريض والأطباء العاجلة' : 'Clinical Urgent Incident Messaging for Doctors & Nurses'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-hospital-600 flex-shrink-0" />
                  <span>{lang === 'ar' ? 'قارئ البوابات الذكية وفحص تصاريح QR' : 'Optical Smart Turnstile & Gate Scanner'}</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 group-hover:bg-hospital-700 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل دخول موظف' : 'Staff Sign-In'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* Card B: Visitor */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 shadow-xl shadow-slate-200/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {lang === 'ar' ? 'تصريح فوري مباشر (بدون كلمة مرور)' : 'Instant Pass (No Password)'}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? 'زائر / مرافق مريض' : 'Hospital Visitor / Companion'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar'
                    ? 'لعائلات المرضى، الأقارب، والمرافقين — احصل على تصريحك برقمك المدني خلال ثوانٍ'
                    : 'For patients’ families, friends, and companions — get your digital pass in seconds.'}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{lang === 'ar' ? 'دخول مباشر وسريع بدون إنشاء حساب أو كلمة سر' : 'Frictionless entry — No username or password'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{lang === 'ar' ? 'البحث عن المريض والتحقق من مواعيد وسعة السرير' : 'Search patient & check real-time bed capacity'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{lang === 'ar' ? 'إصدار تصريح زيارة رقمي برمز QR فوري للبوابات' : 'Instant Optical QR Pass for Smart Turnstiles'}</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => navigate('/visitor-portal')}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all group"
              >
                <QrCode className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إصدار تصريح زيارة سريع الآن' : 'Issue Express Visit Pass Now'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400 py-2">
        {lang === 'ar'
          ? 'نظام وصل الذكي — منصة إدارة الحشود والتحكم بالدخول بمستشفى السلطان قابوس بصلالة'
          : 'WESAL Smart System — Crowd Management & Access Control at Sultan Qaboos Hospital Salalah'}
      </div>
    </div>
  );
};
