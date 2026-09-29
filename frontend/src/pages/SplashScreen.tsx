import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Building2, ArrowRight, Languages, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SplashScreen: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 2.5 second smooth animation to gateway
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          navigate('/gateway');
          return 100;
        }
        return prev + 4;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleEnterNow = () => {
    navigate('/gateway');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-hospital-950 to-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-hospital-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium">
          <Building2 className="w-4 h-4 text-hospital-400" />
          <span>{lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}</span>
        </div>

        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-bold transition-all"
        >
          <Languages className="w-3.5 h-3.5 text-hospital-400" />
          <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Center Hero */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto my-auto z-10 space-y-6">
        {/* Pulsing Emblem */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-hospital-500 blur-xl opacity-40 animate-ping" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-hospital-600 via-hospital-500 to-emerald-400 p-0.5 shadow-2xl shadow-hospital-500/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[22px] flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-12 h-12 sm:w-14 sm:h-14 text-hospital-300" />
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        {/* Title & Branding */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-hospital-500/20 text-hospital-300 text-xs font-bold tracking-wider uppercase border border-hospital-500/30">
            {lang === 'ar' ? 'بوابة إدارة وتنظيم الزيارات الذكية' : 'Smart Visitor & Access Management Portal'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {lang === 'ar' ? 'مَنَصّة وَصْل' : 'WESAL PORTAL'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-md mx-auto">
            {lang === 'ar'
              ? 'مرحباً بكم في بوابة مستشفى السلطان قابوس للتحكم بالدخول وتنظيم زيارات ومرافقي المرضى.'
              : 'Welcome to Sultan Qaboos Hospital Visitor & Management Portal. Real-time bedside tracking and digital access control.'}
          </p>
        </div>

        {/* Progress & Quick Enter Action */}
        <div className="w-full max-w-xs space-y-3 pt-4">
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-hospital-400 to-emerald-400 h-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={handleEnterNow}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-hospital-500 to-hospital-600 hover:from-hospital-400 hover:to-hospital-500 text-white font-bold text-sm shadow-lg shadow-hospital-600/40 flex items-center justify-center gap-2 group transition-all transform active:scale-95"
          >
            <span>{lang === 'ar' ? 'الدخول إلى البوابة الآن' : 'Enter Portal Now'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 z-10 border-t border-white/10 pt-4 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ar' ? 'نظام معتمد وفق بروتوكولات وزارة الصحة' : 'Ministry of Health Oman Certified Prototype'}</span>
        </div>
        <span>{lang === 'ar' ? 'برنامج الابتكار المؤسسي — فريق رؤية' : 'Corporate Innovation Program — Roya Team'}</span>
      </div>
    </div>
  );
};
