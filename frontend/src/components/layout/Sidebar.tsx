import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard, UserPlus, Users, UserCheck, ShieldAlert,
  QrCode, Radio, BarChart3, Settings, Bell, Sparkles, Navigation
} from 'lucide-react';

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { t, isRtl, lang } = useLanguage();

  const navItems: NavItem[] = [
    { key: 'nav.dashboard', name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { key: 'nav.reception', name: t('nav.reception'), href: '/reception', icon: UserPlus },
    { key: 'nav.gate', name: t('nav.gate'), href: '/gate', icon: QrCode, badge: 'Scanner' },
    { key: 'nav.live', name: t('nav.live'), href: '/live', icon: Radio, badge: 'Live' },
    { key: 'nav.passes', name: t('nav.passes'), href: '/passes', icon: ShieldAlert },
    { key: 'nav.visitors', name: t('nav.visitors'), href: '/visitors', icon: Users },
    { key: 'nav.patients', name: t('nav.patients'), href: '/patients', icon: UserCheck },
    { key: 'nav.checkpoints', name: t('nav.checkpoints'), href: '/checkpoints', icon: Navigation },
    { key: 'nav.alerts', name: t('nav.alerts'), href: '/alerts', icon: Bell },
    { key: 'nav.reports', name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { key: 'nav.settings', name: t('nav.settings'), href: '/settings', icon: Settings },
    { key: 'nav.demo', name: t('nav.demo'), href: '/demo', icon: Sparkles, badge: 'Demo' },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Mobile Header Inside Drawer */}
        <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hospital-600 flex items-center justify-center text-white font-bold text-sm">
              {lang === 'ar' ? 'و' : 'W'}
            </div>
            <div>
              <span className="font-bold text-white text-sm block">
                {lang === 'ar' ? 'منظومة وصل الذكية' : 'WESAL Platform'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {t('hospital.name')}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            {t('nav.operations')}
          </p>
          <nav className="space-y-1">
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-hospital-600 text-white shadow-sm shadow-hospital-600/30'
                      : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            {t('nav.management')}
          </p>
          <nav className="space-y-1">
            {navItems.slice(5).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-hospital-600 text-white shadow-sm shadow-hospital-600/30'
                      : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Hospital Footer Card */}
      <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700/60 mt-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white">{t('hospital.name')}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          {t('hospital.ministry')}
          <br />
          <span className="text-[10px] text-hospital-400 font-semibold">{t('vision.badge')}</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex-shrink-0 flex-col no-print border-r rtl:border-r-0 rtl:border-l border-slate-800 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-over (< 1024px) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <aside
            className={`relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 h-full shadow-2xl flex flex-col z-10 animate-in ${
              isRtl ? 'mr-auto slide-in-from-right' : 'ml-auto slide-in-from-left'
            } duration-200 border-slate-800 ${isRtl ? 'border-l' : 'border-r'}`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

