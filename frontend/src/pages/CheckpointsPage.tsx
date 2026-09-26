import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Navigation, Building, QrCode, Shield, CheckCircle2,
  XCircle, Clock, ArrowRight, Eye
} from 'lucide-react';
import { Checkpoint } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const CheckpointsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [selectedCp, setSelectedCp] = useState<Checkpoint | null>(null);

  const { data: checkpoints = [] } = useQuery<Checkpoint[]>({
    queryKey: ['checkpoints-page'],
    queryFn: () => api.getCheckpoints(),
  });

  const activeCheckpoint = selectedCp || (checkpoints.length > 0 ? checkpoints[0] : null);

  const { data: checkpointScans = [] } = useQuery({
    queryKey: ['checkpoint-scans', activeCheckpoint?.id],
    queryFn: () => (activeCheckpoint ? api.getCheckpointScans(activeCheckpoint.id) : []),
    enabled: !!activeCheckpoint,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'ar' ? 'نقاط التفتيش وبوابات الوصول الذكية' : 'Smart Gate Checkpoints'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'نقاط التحكم الإلكترونية وبوابات العبور الموزعة في مستشفى السلطان قابوس'
              : 'Configured physical access control points across Sultan Qaboos Hospital'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checkpoint Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {checkpoints.map((cp) => {
            const isSelected = activeCheckpoint?.id === cp.id;
            const isExit = cp.checkpoint_type === 'EXIT_GATE';
            const isEntry = cp.checkpoint_type === 'ENTRY_GATE';

            return (
              <div
                key={cp.id}
                onClick={() => setSelectedCp(cp)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left rtl:text-right ${
                  isSelected
                    ? 'bg-hospital-50/80 border-hospital-500 ring-2 ring-hospital-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {cp.code}
                    </span>
                    <h2 className="font-bold text-sm text-slate-900">{cp.name}</h2>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isExit
                        ? 'bg-purple-100 text-purple-700'
                        : isEntry
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isExit ? (lang === 'ar' ? 'بوابة خروج' : 'EXIT GATE') :
                     isEntry ? (lang === 'ar' ? 'بوابة دخول' : 'ENTRY GATE') :
                     (lang === 'ar' ? 'نقطة جناح' : 'WARD GATE')}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {lang === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                    <span className="font-bold text-emerald-600">
                      {lang === 'ar' ? 'متصلة ومفعلة' : 'Online & Armed'}
                    </span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/gate?checkpoint=${cp.code}`);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-hospital-700 hover:underline"
                  >
                    {lang === 'ar' ? 'فتح ماسح البوابة' : 'Open Gate Scanner'} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkpoint Recent Scans (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {lang === 'ar' ? 'سجل حركات نقطة العبور' : 'CHECKPOINT ACTIVITY LOG'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {activeCheckpoint?.name} ({activeCheckpoint?.code})
              </h3>
            </div>

            <button
              onClick={() => navigate(`/gate?checkpoint=${activeCheckpoint?.code}`)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تشغيل البوابة' : 'Launch Gate'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-2.5">{lang === 'ar' ? 'الوقت' : 'Time'}</th>
                  <th className="px-4 py-2.5">{lang === 'ar' ? 'النتيجة' : 'Result'}</th>
                  <th className="px-4 py-2.5">{t('th.visitor')}</th>
                  <th className="px-4 py-2.5">{t('th.pass_id')}</th>
                  <th className="px-4 py-2.5">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checkpointScans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      {lang === 'ar' ? 'لم تُسجل أي عمليات مسح عند هذه البوابة حتى الآن.' : 'No scan events recorded at this gate yet.'}
                    </td>
                  </tr>
                ) : (
                  checkpointScans.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {new Date(s.scan_time).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            s.result === 'GRANTED' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {s.result === 'GRANTED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {s.result === 'GRANTED' ? (lang === 'ar' ? 'مسموح' : 'GRANTED') : (lang === 'ar' ? 'مرفوض' : 'DENIED')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{s.visitor_name}</td>
                      <td className="px-4 py-2.5 font-mono text-hospital-700">{s.pass_code}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {s.denial_reason || (lang === 'ar' ? 'تمت الموافقة بالدخول' : 'Access Approved')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
