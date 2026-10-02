import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLiveUpdates } from '../../hooks/useLiveUpdates';
import {
  Shield, UserCheck, Stethoscope, LogOut, Radio, QrCode,
  Sparkles, Building2, Globe, BookOpen, Menu, Users, ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../../types';
import { AdminWorkflowGuide } from '../common/AdminWorkflowGuide';
import { QuickIncidentModal } from '../incidents/QuickIncidentModal';

interface NavbarProps {
  onToggleMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMenu }) => {
  const { user, logout, switchRole } = useAuth();
  const { isConnected } = useLiveUpdates();
  const { lang, toggleLang, isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);


  const handleRoleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 no-print transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-2">
            {/* Left: Mobile Menu Button, Go Back & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse min-w-0">
              {/* Mobile Hamburger Drawer Trigger */}
              <button
                type="button"
                onClick={onToggleMenu}
                aria-label="Open Navigation Menu"
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-hospital-500"
              >
                <Menu className="w-5 h-5" />
              </button>

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

              <Link
                to="/gateway"
                title={lang === 'ar' ? 'الصفحة الرئيسية — بوابة الأدوار' : 'Homepage — Gate'}
                className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse group min-w-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-tr from-hospital-700 via-hospital-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-hospital-500/20 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-hospital-800 to-indigo-800 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                      {lang === 'ar' ? 'وصل' : 'WESAL'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] bg-hospital-100 text-hospital-800 px-1.5 py-0.2 rounded-full font-bold border border-hospital-200 shrink-0">
                      {lang === 'ar' ? 'WESAL' : 'وصل'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1 truncate max-w-[130px] sm:max-w-none group-hover:text-slate-700 transition-colors">
                    <Building2 className="w-3 h-3 text-hospital-500 shrink-0" />
                    <span className="truncate">{t('hospital.name')}</span>
                  </p>
                </div>
              </Link>

              {/* Live WebSocket Sync Pill */}
              <div className="hidden xl:flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200/80">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[11px] font-semibold text-slate-600">
                  {isConnected ? t('sync.active') : t('sync.connecting')}
                </span>
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse shrink-0">
              {/* Friendly Admin Step-by-Step Operator Guide Button */}
              <button
                onClick={() => setIsGuideOpen(true)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 text-emerald-800 border border-emerald-300/80 hover:border-emerald-400 hover:shadow-sm text-xs font-bold transition-all group"
                title={lang === 'ar' ? 'عرض دليل خطوات العمل للمشغل وإرشادات الزوار' : 'Open Admin Step-by-Step Workflow Guide'}
              >
                <BookOpen className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">
                  {lang === 'ar' ? 'دليل المشغل' : 'Operator Guide'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping sm:inline-block hidden" />
              </button>

              {/* Language Switcher Toggle */}
              <button
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-hospital-50 hover:border-hospital-300 text-xs font-bold text-slate-700 hover:text-hospital-700 transition-colors shadow-sm"
                title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              >
                <Globe className="w-3.5 h-3.5 text-hospital-600" />
                <span className="text-[11px] font-black">{lang === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              {/* Quick Demo Simulator Badge */}
              <Link
                to="/demo"
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {t('btn.demo_simulator')}
              </Link>

              {/* Quick Smart Gate Button (visible on tablet+) */}
              <Link
                to="/gate"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">{t('btn.smart_gate')}</span>
              </Link>

              {/* Role Switcher */}
              <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 hidden lg:inline">{t('role.label')}:</span>
                <select
                  value={user?.role || 'ADMIN'}
                  onChange={handleRoleSelect}
                  aria-label={t('role.label')}
                  className="text-xs font-bold bg-transparent border-none text-slate-800 focus:ring-0 cursor-pointer pr-2 py-0.5 max-w-[90px] sm:max-w-none truncate"
                >
                  <option value="ADMIN">{t('role.admin')}</option>
                  <option value="RECEPTION">{t('role.reception')}</option>
                  <option value="SECURITY">{t('role.security')}</option>
                  <option value="MANAGEMENT">{t('role.management')}</option>
                </select>
              </div>

              {/* Quick Link to Visitor Portal for Testing / Demonstration */}
              <Link
                to="/visitor"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                title={lang === 'ar' ? 'عرض بوابة الزوار الذاتية' : 'View Visitor Self-Service Portal'}
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ar' ? 'بوابة الزوار' : 'Visitor Portal'}</span>
              </Link>

              {/* Quick Incident Reporting Trigger (Available to any staff anywhere) */}
              <button
                onClick={() => setIsIncidentModalOpen(true)}
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 text-xs font-bold transition-all shadow-sm group"
                title={lang === 'ar' ? 'إرسال بلاغ أو ملاحظة إدارية عاجلة' : 'Report Urgent Incident / Staff Notice'}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'بلاغ عاجل' : 'Report Incident'}
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping hidden sm:inline-block" />
              </button>

              {/* Logout */}
              <button
                onClick={() => {
                  logout();
                  navigate('/gateway');
                }}
                title={t('btn.signout')}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Modal Guide */}
      <AdminWorkflowGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Global Quick Incident Modal */}
      <QuickIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />
    </>
  );
};

