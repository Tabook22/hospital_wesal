import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  BarChart3, Printer, Download, FileText, Building, ShieldAlert,
  Clock, CheckCircle2, AlertTriangle, Users, RefreshCw
} from 'lucide-react';
import {
  TodayReport, WardReportItem, DenialReportItem, CurrentLiveReport
} from '../types';
import { useLanguage } from '../context/LanguageContext';

export const ReportsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WARDS' | 'DENIALS' | 'CURRENT_LIVE'>('TODAY');

  const { data: todayReport, refetch: refetchToday } = useQuery<TodayReport>({
    queryKey: ['report-today'],
    queryFn: () => api.getTodayReport(),
  });

  const { data: wardReport = [], refetch: refetchWard } = useQuery<WardReportItem[]>({
    queryKey: ['report-wards'],
    queryFn: () => api.getWardReport(),
  });

  const { data: denialReport = [], refetch: refetchDenials } = useQuery<DenialReportItem[]>({
    queryKey: ['report-denials'],
    queryFn: () => api.getDenialReport(),
  });

  const { data: currentLive, refetch: refetchCurrent } = useQuery<CurrentLiveReport>({
    queryKey: ['report-current-live'],
    queryFn: () => api.getCurrentLiveReport(),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'CURRENT_LIVE' && currentLive) {
      csvContent += 'Visitor Name,Visitor Type,Pass Code,Patient Name,Hospital #,Ward,Room,Last Location,Entered At,Expected Exit,Status,Remaining/Overdue\n';
      currentLive.visitors.forEach((v) => {
        csvContent += `"${v.visitor_name}","${v.visitor_type}","${v.pass_code}","${v.patient_name}","${v.patient_hospital_number}","${v.ward_name}","${v.room_number}","${v.last_location}","${v.entered_at || ''}","${v.expected_exit_at || ''}","${v.status}","${v.remaining_or_overdue_text}"\n`;
      });
    } else if (activeTab === 'WARDS') {
      csvContent += 'Ward Name,Code,Visitors Today,Currently Inside,Overdue Count,Avg Duration (Min)\n';
      wardReport.forEach((w) => {
        csvContent += `"${w.ward_name}","${w.ward_code}",${w.visitors_today},${w.currently_inside},${w.overdue_count},${w.average_duration_minutes}\n`;
      });
    } else {
      csvContent += 'Metric,Value\n';
      csvContent += `Date,${todayReport?.date || ''}\n`;
      csvContent += `Total Registered,${todayReport?.total_registered || 0}\n`;
      csvContent += `Total Entries,${todayReport?.total_entries || 0}\n`;
      csvContent += `Total Exits,${todayReport?.total_exits || 0}\n`;
      csvContent += `Currently Inside,${todayReport?.currently_inside || 0}\n`;
      csvContent += `Overdue Count,${todayReport?.overdue_count || 0}\n`;
      csvContent += `Denied Attempts,${todayReport?.denied_attempts || 0}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WESAL_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-hospital-100 text-hospital-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {lang === 'ar' ? 'التقارير التشغيلية والتدقيق الأمني' : 'Operational Reports & Auditing'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'التقارير اليومية الرسمية وإحصائيات التدفق والتدقيق لمستشفى السلطان قابوس'
                  : 'Official Sultan Qaboos Hospital daily visitor management statements and printable audits'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> {t('btn.export_csv')}
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> {lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-slate-200 gap-2 no-print overflow-x-auto">
        {[
          { id: 'TODAY', label: lang === 'ar' ? 'تقرير ملخص اليوم' : "Today's Summary Report" },
          { id: 'CURRENT_LIVE', label: lang === 'ar' ? 'سجل المتواجدين حالياً (للطباعة)' : 'Current Live Hospital Status (Printable)' },
          { id: 'WARDS', label: lang === 'ar' ? 'توزيع الأجنحة الطبية' : 'Ward Breakdown Report' },
          { id: 'DENIALS', label: lang === 'ar' ? 'سجل محاولات الدخول المرفوضة' : 'Access Denial Audit' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-hospital-600 text-hospital-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Today's Report */}
      {activeTab === 'TODAY' && todayReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {lang === 'ar' ? 'تقرير التدقيق التنفيذي اليومي' : 'DAILY EXECUTIVE AUDIT'}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? 'ملخص حركة ونشاط الزوار اليوم بمستشفى السلطان قابوس' : "Today's Hospital Visitor Activity Summary"}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ar' ? `تاريخ البيان: ${todayReport.date}` : `Statement Date: ${todayReport.date}`}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
                {t('hospital.name')}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">{lang === 'ar' ? 'إجمالي المسجلين' : 'Total Registered'}</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{todayReport.total_registered}</span>
                <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'تصاريح صدرت اليوم' : 'Passes issued today'}</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block font-semibold">{lang === 'ar' ? 'إجمالي حركات الدخول' : 'Total Check-In Entries'}</span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">{todayReport.total_entries}</span>
                <span className="text-[11px] text-emerald-600">{lang === 'ar' ? 'عبر البوابة الرئيسية CP-01' : 'Passed CP-01 Main Gate'}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">{lang === 'ar' ? 'إجمالي حركات الخروج' : 'Total Check-Out Exits'}</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{todayReport.total_exits}</span>
                <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'مسجلة ببوابة الخروج CP-07' : 'Recorded at CP-07 Exit'}</span>
              </div>
              <div className="p-4 rounded-xl bg-hospital-50 border border-hospital-200">
                <span className="text-hospital-700 block font-semibold">{lang === 'ar' ? 'المتواجدون حالياً' : 'Currently Inside'}</span>
                <span className="text-2xl font-black text-hospital-800 mt-1 block">{todayReport.currently_inside}</span>
                <span className="text-[11px] text-hospital-600">{lang === 'ar' ? 'نشطون في الأجنحة' : 'Active inside wards'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block">{lang === 'ar' ? 'تجاوزوا وقت الزيارة' : 'Overdue Visitors'}</span>
                  <span className="text-lg font-bold text-rose-600">{todayReport.overdue_count}</span>
                </div>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block">{lang === 'ar' ? 'محاولات الدخول المرفوضة' : 'Denied Gate Attempts'}</span>
                  <span className="text-lg font-bold text-amber-600">{todayReport.denied_attempts}</span>
                </div>
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block">{lang === 'ar' ? 'فترة ذروة الزيارة' : 'Peak Visiting Period'}</span>
                  <span className="text-lg font-bold text-slate-900">{todayReport.peak_visiting_hour}</span>
                </div>
                <Clock className="w-5 h-5 text-hospital-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENT HOSPITAL VISITOR STATUS (Special Printable Report) */}
      {activeTab === 'CURRENT_LIVE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print-page space-y-6">
            {/* Printable Report Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {t('pass.ministry_header')}
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {lang === 'ar' ? 'مستشفى السلطان قابوس — تقرير حالة الزوار المباشرة' : 'SULTAN QABOOS HOSPITAL — LIVE VISITOR STATUS REPORT'}
              </h2>
              <div className="flex justify-between items-center text-xs text-slate-600 mt-3 pt-2 border-t border-slate-200">
                <span>{lang === 'ar' ? `وقت الاستخراج: ${currentLive?.generated_at}` : `Generated: ${currentLive?.generated_at}`}</span>
                <span className="font-bold text-hospital-700">
                  {lang === 'ar'
                    ? `إجمالي الزوار المتواجدين حالياً: ${currentLive?.total_inside || 0}`
                    : `TOTAL VISITORS CURRENTLY INSIDE: ${currentLive?.total_inside || 0}`}
                </span>
              </div>
            </div>

            {/* Questions Answered Directly */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2 no-print">
              <div>{lang === 'ar' ? '✓ من المتواجد حالياً داخل المستشفى؟' : '✓ WHO IS CURRENTLY INSIDE?'}</div>
              <div>{lang === 'ar' ? '✓ آخر نقطة عبور مسجلة' : '✓ LAST RECORDED CHECKPOINT'}</div>
              <div>{lang === 'ar' ? '✓ من هو المريض الذي تتم زيارته؟' : '✓ WHO ARE THEY VISITING?'}</div>
              <div>{lang === 'ar' ? '✓ متى دخل الزائر؟' : '✓ WHEN DID THEY ENTER?'}</div>
              <div>{lang === 'ar' ? '✓ متى يجب أن يغادر؟' : '✓ WHEN SHOULD THEY LEAVE?'}</div>
              <div>{lang === 'ar' ? '✓ من تجاوز المدة المحددة؟' : '✓ WHO IS OVERDUE?'}</div>
            </div>

            {/* Visitors Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-300 text-left rtl:text-right text-xs">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase">
                  <tr>
                    <th className="px-3 py-2.5">{t('th.visitor')}</th>
                    <th className="px-3 py-2.5">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="px-3 py-2.5">{t('th.pass_id')}</th>
                    <th className="px-3 py-2.5">{lang === 'ar' ? 'المريض' : 'Patient Visited'}</th>
                    <th className="px-3 py-2.5">{t('th.ward')}</th>
                    <th className="px-3 py-2.5">{t('th.last_location')}</th>
                    <th className="px-3 py-2.5">{t('th.entry_time')}</th>
                    <th className="px-3 py-2.5">{t('th.allowed_until')}</th>
                    <th className="px-3 py-2.5">{t('th.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentLive?.visitors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                        {lang === 'ar' ? 'لا يوجد زوار متواجدون داخل المستشفى حالياً.' : 'No visitors currently inside hospital facility.'}
                      </td>
                    </tr>
                  ) : (
                    currentLive?.visitors.map((v, i) => (
                      <tr
                        key={i}
                        className={v.status === 'OVERDUE' ? 'bg-rose-50/70 font-semibold' : ''}
                      >
                        <td className="px-3 py-2 font-bold text-slate-900">{v.visitor_name}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {v.visitor_type === 'COMPANION' ? (lang === 'ar' ? 'مرافق' : 'Companion') : (lang === 'ar' ? 'زائر' : 'Visitor')}
                        </td>
                        <td className="px-3 py-2 font-mono text-hospital-700">{v.pass_code}</td>
                        <td className="px-3 py-2">{v.patient_name}</td>
                        <td className="px-3 py-2 font-medium">{v.ward_name} ({v.room_number})</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{v.last_location}</td>
                        <td className="px-3 py-2 font-mono">{v.entered_at || '—'}</td>
                        <td className="px-3 py-2 font-mono">{v.expected_exit_at || '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-bold ${
                              v.status === 'OVERDUE'
                                ? 'text-rose-600'
                                : v.status === 'ENDING_SOON'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {v.remaining_or_overdue_text}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signature Footer for Printed Audit */}
            <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 text-xs text-slate-700">
              <div>
                <p className="font-bold">{lang === 'ar' ? 'ضابط أمن النوبة المناوب:' : 'Security Duty Officer:'}</p>
                <p className="mt-8 border-b border-slate-400 w-48"></p>
                <p className="text-[10px] text-slate-400 mt-1">{lang === 'ar' ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
              </div>
              <div className="text-right rtl:text-left">
                <p className="font-bold">{lang === 'ar' ? 'إدارة مستشفى السلطان قابوس:' : 'Hospital Administration:'}</p>
                <p className="mt-8 border-b border-slate-400 w-48 ml-auto rtl:ml-0 rtl:mr-auto"></p>
                <p className="text-[10px] text-slate-400 mt-1">{lang === 'ar' ? 'ختم مستشفى السلطان قابوس' : 'Sultan Qaboos Hospital Seal'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Ward Breakdown Report */}
      {activeTab === 'WARDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? 'إحصائيات وتوزيع الزوار حسب الأجنحة الطبية' : 'Ward Breakdown Statistics'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">{lang === 'ar' ? 'الجناح الطبي' : 'Ward Name'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'الرمز' : 'Code'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'زوار اليوم' : 'Visitors Today'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'المتواجدون حالياً' : 'Currently Inside'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'المتأخرون' : 'Overdue Count'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'متوسط مدة الزيارة' : 'Average Duration'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {wardReport.map((w) => (
                  <tr key={w.ward_code} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{w.ward_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{w.ward_code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{w.visitors_today}</td>
                    <td className="px-4 py-3 font-bold text-hospital-700">{w.currently_inside}</td>
                    <td className="px-4 py-3">
                      <span className={w.overdue_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        {w.overdue_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {w.average_duration_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Access Denial Report */}
      {activeTab === 'DENIALS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? 'أسباب رفض الدخول ومخالفات السياسات' : 'Access Denial Reasons & Policy Violations'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">{lang === 'ar' ? 'سبب رفض الدخول' : 'Reason for Access Denial'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'عدد التكرارات' : 'Occurrences'}</th>
                  <th className="px-4 py-3">{lang === 'ar' ? 'النسبة المئوية' : 'Percentage'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {denialReport.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      {d.reason}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{d.count}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{d.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
