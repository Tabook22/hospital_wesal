import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard, UserPlus, QrCode, Radio, ShieldAlert
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const { lang } = useLanguage();

  const navItems = [
    {
      label: lang === 'ar' ? 'الرئيسية' : 'Home',
      to: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: lang === 'ar' ? 'الاستقبال' : 'Register',
      to: '/reception',
      icon: UserPlus,
    },
    {
      label: lang === 'ar' ? 'البوابة' : 'Gate',
      to: '/gate',
      icon: QrCode,
      isCenter: true,
    },
    {
      label: lang === 'ar' ? 'المراقبة' : 'Live',
      to: '/live',
      icon: Radio,
    },
    {
      label: lang === 'ar' ? 'التصاريح' : 'Passes',
      to: '/passes',
      icon: ShieldAlert,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[calc(0.375rem+var(--safe-bottom))] no-print transition-all"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-5 group transition-transform active:scale-95 ${
                    isActive ? 'scale-105' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-hospital-700 to-hospital-500 text-white shadow-hospital-500/40 ring-4 ring-white'
                          : 'bg-slate-900 text-white shadow-slate-900/30 group-hover:bg-hospital-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1 tracking-tight ${
                        isActive ? 'text-hospital-700 font-black' : 'text-slate-600'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[54px] transition-all active:scale-95 ${
                  isActive
                    ? 'text-hospital-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-hospital-600" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-black text-hospital-700' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
