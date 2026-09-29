import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, ArrowLeft, Lock, User, Phone, CreditCard,
  CheckCircle2, Sparkles, Languages, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const VisitorAuthPage: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { login, registerVisitor } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regCivilId, setRegCivilId] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(loginUsername, loginPassword);
      navigate('/visitor');
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await registerVisitor({
        full_name: regFullName,
        civil_id: regCivilId,
        mobile_number: regMobile,
        username: regUsername,
        password: regPassword,
      });
      navigate('/visitor');
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى' : 'Failed to register. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoVisitorLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await login('visitor', 'wesal123');
      navigate('/visitor');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-teal-50/50 via-slate-50 to-teal-50/40 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/gateway')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{lang === 'ar' ? 'الرجوع لبوابة الأدوار' : 'Back to Gateway'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'ar' ? 'بوابة الزوار والمرافقين' : 'Visitor Access Portal'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'LOGIN'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'ar' ? 'تسجيل دخول زائر' : 'Visitor Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'REGISTER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'ar' ? 'تسجيل زائر جديد' : 'New Visitor Registration'}
          </button>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {/* Quick Demo Visitor Access Pill */}
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[11px] font-bold text-emerald-950">
                  {lang === 'ar' ? 'حساب تجريبي فوري' : 'Instant Demo Account'}
                </div>
                <div className="text-[10px] text-emerald-700">
                  {lang === 'ar' ? 'الدخول كزائر مسجل (أحمد الحارثي)' : 'Login as Ahmed Al-Harthi'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoVisitorLogin}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              {lang === 'ar' ? 'دخول فوري' : '1-Click Demo'}
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'LOGIN' ? (
            /* --- Form: Visitor Login --- */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: visitor' : 'e.g. visitor'}
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{lang === 'ar' ? 'تسجيل الدخول ومتابعة الزيارة' : 'Sign In & Proceed to Visit'}</span>
                )}
              </button>
            </form>
          ) : (
            /* --- Form: New Visitor Registration --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'الاسم الكامل للزائر' : 'Full Legal Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={lang === 'ar' ? 'الاسم الثلاثي أو الرباعي' : 'First and Last Name'}
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'الرقم المدني' : 'Civil ID'}
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regCivilId}
                      onChange={(e) => setRegCivilId(e.target.value)}
                      placeholder="e.g. 71829304"
                      className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الهاتف النقال' : 'Mobile Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+968 9XXXXXXX"
                      className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'اسم المستخدم للدخول' : 'Desired Username'}
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. ahmed_visitor"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{lang === 'ar' ? 'إنشاء حساب وإصدار تصريح' : 'Register & Proceed'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
