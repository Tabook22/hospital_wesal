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

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();

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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex-shrink-0 flex flex-col justify-between p-4 no-print border-r rtl:border-r-0 rtl:border-l border-slate-800">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            {t('nav.operations')}
          </p>
          <nav className="space-y-1">
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-hospital-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-hospital-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-white">{t('hospital.name')}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          {t('hospital.ministry')}
          <br />
          {t('vision.badge')}
        </p>
      </div>
    </aside>
  );
};
