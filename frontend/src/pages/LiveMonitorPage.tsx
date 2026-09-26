import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import {
  Radio, Users, Clock, AlertTriangle, Building,
  Maximize2, Minimize2, RefreshCw, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { Visit } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const LiveMonitorPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Second-by-second ticker for live duration counters
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: visits = [], refetch, isLoading } = useQuery<Visit[]>({
    queryKey: ['live-monitor-visits'],
    queryFn: () => api.getActiveVisits(),
    refetchInterval: 3000,
  });

  useLiveUpdates(() => {
    refetch();
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const insideCount = visits.length;
  const endingSoonCount = visits.filter((v) => v.status === 'ENDING_SOON').length;
  const overdueCount = visits.filter((v) => v.status === 'OVERDUE').length;

  const formatLiveDuration = (visit: Visit) => {
    if (!visit.expected_exit_at) return { text: lang === 'ar' ? 'بانتظار الدخول' : 'Pending', color: 'text-slate-400' };

    const exitTime = new Date(visit.expected_exit_at).getTime();
    const diff = exitTime - nowTimestamp;

    if (diff <= 0) {
      const overdueSec = Math.floor(Math.abs(diff) / 1000);
      const m = Math.floor(overdueSec / 60);
      const s = overdueSec % 60;
      return {
        text: `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${lang === 'ar' ? 'تجاوز الوقت' : 'OVERDUE'}`,
        color: 'text-rose-500 font-black animate-pulse',
      };
    } else {
      const remSec = Math.floor(diff / 1000);
      const m = Math.floor(remSec / 60);
      const s = remSec % 60;
      const isEndingSoon = remSec <= 300;
      return {
        text: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${lang === 'ar' ? 'متبقية' : 'remaining'}`,
        color: isEndingSoon ? 'text-amber-400 font-bold animate-pulse' : 'text-emerald-400 font-semibold',
      };
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 min-h-[85vh] flex flex-col justify-between shadow-2xl border border-slate-800">
      {/* Control Room Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-hospital-600/30 border border-hospital-500/50 flex items-center justify-center text-hospital-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">{t('live.title')}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {t('live.badge')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('live.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {t('btn.refresh')}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-hospital-600 text-white text-xs font-semibold hover:bg-hospital-500 flex items-center gap-1.5"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? (lang === 'ar' ? 'إنهاء ملء الشاشة' : 'Exit Fullscreen') : t('live.fullscreen')}
            </button>
          </div>
        </div>

        {/* 3 Prominent Large-Screen KPI Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {/* Currently Inside */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                {t('live.inside')}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-white mt-1 block">
                {insideCount}
              </span>
              <span className="text-xs text-hospital-400 mt-1 block font-medium">
                {lang === 'ar' ? 'الزوار المتواجدون حالياً' : 'Active Hospital Visitors'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-hospital-600/20 text-hospital-400">
              <Users className="w-8 h-8" />
            </div>
          </div>

          {/* Ending Soon */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                {t('live.ending_soon')}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-amber-400 mt-1 block">
                {endingSoonCount}
              </span>
              <span className="text-xs text-slate-400 mt-1 block font-medium">
                {lang === 'ar' ? 'أقل من 5 دقائق متبقية' : '< 5 minutes remaining'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
          </div>

          {/* Overdue */}
          <div className={`border rounded-2xl p-6 flex items-center justify-between shadow-lg transition-all ${
            overdueCount > 0
              ? 'bg-rose-950/40 border-rose-500/60 ring-2 ring-rose-500/20'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
                {t('live.overdue')}
              </span>
              <span className={`text-4xl sm:text-5xl font-black mt-1 block ${
                overdueCount > 0 ? 'text-rose-500 animate-pulse' : 'text-white'
              }`}>
                {overdueCount}
              </span>
              <span className="text-xs text-rose-300/80 mt-1 block font-medium">
                {lang === 'ar' ? 'تم إرسال تنبيهات SMS والأمن' : 'Staff & SMS Alerts Dispatched'}
              </span>
            </div>
            <div className={`p-4 rounded-2xl ${overdueCount > 0 ? 'bg-rose-500/30 text-rose-400 animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Live Visitor Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {t('live.stream_title')}
            </h2>
            <span className="text-xs text-slate-500">
              {lang === 'ar' ? 'تحديثات مباشرة عبر بروتوكول WebSocket' : 'Live updates via WebSocket connection'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-slate-500">
                {lang === 'ar' ? 'لا يوجد زوار متواجدون داخل أجنحة المستشفى حالياً.' : 'No visitors currently inside hospital wards.'}
              </div>
            ) : (
              visits.map((v) => {
                const durationInfo = formatLiveDuration(v);
                return (
                  <div
                    key={v.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      v.status === 'OVERDUE'
                        ? 'bg-rose-950/20 border-rose-600/80 shadow-rose-900/20'
                        : v.status === 'ENDING_SOON'
                        ? 'bg-amber-950/20 border-amber-600/80 shadow-amber-900/20'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-base font-bold text-white block">{v.visitor_name}</span>
                        <span className="text-xs font-mono text-hospital-400">{v.pass_obj?.pass_code}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          v.status === 'OVERDUE'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : v.status === 'ENDING_SOON'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {v.status === 'ACTIVE' ? t('status.active') :
                         v.status === 'ENDING_SOON' ? t('status.ending_soon') :
                         v.status === 'OVERDUE' ? t('status.overdue') :
                         v.status === 'CHECKED_OUT' ? t('status.checked_out') : v.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{lang === 'ar' ? 'المريض:' : 'Patient:'}</span>
                        <span className="text-slate-200 font-semibold">{v.patient_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{lang === 'ar' ? 'الجناح والسرير:' : 'Ward & Bed:'}</span>
                        <span className="text-slate-200">{v.ward_name} ({v.patient_room})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{lang === 'ar' ? 'آخر نقطة عبور:' : 'Last Checkpoint:'}</span>
                        <span className="text-hospital-300 font-medium">
                          {v.last_checkpoint_name || (lang === 'ar' ? 'المدخل الرئيسي' : 'Main Entrance')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{lang === 'ar' ? 'الدخول / المتوقع:' : 'Entry / Expected:'}</span>
                        <span className="text-slate-300 font-mono">
                          {v.check_in_at ? new Date(v.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} →{' '}
                          {v.expected_exit_at ? new Date(v.expected_exit_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{lang === 'ar' ? 'مؤشر الوقت:' : 'Duration Status:'}</span>
                      <span className={durationInfo.color}>{durationInfo.text}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-900 flex justify-between text-xs text-slate-500">
        <span>{lang === 'ar' ? 'مستشفى السلطان قابوس • شبكة الأمان والتحكم لمنظومة وصل' : 'Sultan Qaboos Hospital • Wesal Platform Security Network'}</span>
        <span>{lang === 'ar' ? 'التحديث التلقائي نشط' : 'Automatic refresh active'}</span>
      </div>
    </div>
  );
};
