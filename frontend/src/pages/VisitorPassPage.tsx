import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Printer, QrCode, Search, Shield, Eye, XCircle, CheckCircle2,
  Calendar, Clock, Building, Download, Share2, Check, Hourglass, AlertTriangle
} from 'lucide-react';
import { VisitorPass, Visit } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const VisitorPassPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();

  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'LIST' | 'BADGE'>('LIST');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: visits = [], refetch } = useQuery<Visit[]>({
    queryKey: ['all-visits-passes'],
    queryFn: () => api.getVisits(),
    refetchInterval: 4000, // Live poll every 4s
  });

  // Approve Visit Request Mutation
  const approveMutation = useMutation({
    mutationFn: (visitId: number) => api.approveVisitRequest(visitId),
    onSuccess: (_, visitId) => {
      queryClient.invalidateQueries({ queryKey: ['all-visits-passes'] });
      queryClient.invalidateQueries({ queryKey: ['pending-visit-requests'] });
      setActionSuccess(lang === 'ar' ? 'تم اعتماد وتفعيل التصريح بنجاح!' : 'Pass approved & activated successfully!');
      setTimeout(() => setActionSuccess(null), 3000);
      if (selectedVisit?.id === visitId) {
        setSelectedVisit((prev) =>
          prev
            ? {
                ...prev,
                status: 'REGISTERED',
                pass_obj: prev.pass_obj ? { ...prev.pass_obj, status: 'ACTIVE' } : undefined,
              }
            : null
        );
      }
    },
  });

  // Reject Visit Request Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ visitId, reason }: { visitId: number; reason?: string }) =>
      api.rejectVisitRequest(visitId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-visits-passes'] });
      queryClient.invalidateQueries({ queryKey: ['pending-visit-requests'] });
      setActionSuccess(lang === 'ar' ? 'تم رفض طلب الزيارة.' : 'Pass request rejected.');
      setTimeout(() => setActionSuccess(null), 3000);
      if (selectedVisit?.id === variables.visitId) {
        setSelectedVisit((prev) =>
          prev
            ? {
                ...prev,
                status: 'REJECTED',
                pass_obj: prev.pass_obj ? { ...prev.pass_obj, status: 'REVOKED' } : undefined,
              }
            : null
        );
      }
    },
  });

  const filteredVisits = visits.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.visitor_name.toLowerCase().includes(s) ||
      v.patient_name.toLowerCase().includes(s) ||
      (v.pass_obj && v.pass_obj.pass_code.toLowerCase().includes(s)) ||
      v.visit_number.toLowerCase().includes(s)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSelectPass = (visit: Visit) => {
    setSelectedVisit(visit);
    setMobileTab('BADGE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'ar' ? 'دليل وسجل تصاريح الزوار' : 'Visitor Passes Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'إصدار وعرض واعتماد وطباعة تصاريح الزيارة الذكية المعتمدة لمستشفى السلطان قابوس'
              : 'Manage, approve, view, print and track official Sultan Qaboos Hospital QR visitor passes'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث برمز التصريح، الزائر، المريض...' : 'Search pass code, visitor, patient...'}
              className="w-full sm:w-56 pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-hospital-500"
            />
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 no-print animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold no-print">
        <button
          onClick={() => setMobileTab('LIST')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'LIST'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'ar' ? `قائمة التصاريح (${filteredVisits.length})` : `Passes List (${filteredVisits.length})`}
        </button>
        <button
          onClick={() => setMobileTab('BADGE')}
          className={`flex-1 py-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'BADGE'
              ? 'bg-white text-hospital-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{lang === 'ar' ? 'معاينة البطاقة' : 'Badge Preview'}</span>
          {selectedVisit && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Main Grid: Left = Pass Table, Right = Printable Badge Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pass Table (7 cols) */}
        <div className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print ${
          mobileTab === 'BADGE' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">
              {lang === 'ar' ? `التصاريح الصادرة (${filteredVisits.length})` : `Issued Passes (${filteredVisits.length})`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {lang === 'ar' ? 'تحديث حي' : 'Live Sync'}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">{t('th.pass_id')}</th>
                  <th className="px-4 py-3">{t('th.visitor')}</th>
                  <th className="px-4 py-3">{t('th.patient_room')}</th>
                  <th className="px-4 py-3">{t('th.status')}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{t('th.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredVisits.map((v) => {
                  const isPending = v.pass_obj?.status === 'PENDING' || v.status === 'PENDING_APPROVAL';
                  const isActive = v.pass_obj?.status === 'ACTIVE' || v.status === 'REGISTERED';
                  const isUsed = v.pass_obj?.status === 'USED';
                  const isRejected = v.pass_obj?.status === 'REVOKED' || v.status === 'REJECTED';

                  return (
                    <tr
                      key={v.id}
                      onClick={() => handleSelectPass(v)}
                      className={`hover:bg-hospital-50/50 cursor-pointer transition-colors ${
                        selectedVisit?.id === v.id ? 'bg-hospital-50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-hospital-600' : ''
                      } ${isPending ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-hospital-700">
                        {v.pass_obj?.pass_code || v.visit_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {v.visitor_name}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {v.visitor_type === 'COMPANION' ? (lang === 'ar' ? 'مرافق مريض' : 'Companion') : (lang === 'ar' ? 'زائر' : 'Visitor')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{v.patient_name}</div>
                        <div className="text-[11px] text-slate-500">{v.ward_name} ({v.patient_room})</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : isUsed
                              ? 'bg-slate-100 text-slate-600'
                              : isRejected
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Hourglass className="w-2.5 h-2.5 animate-spin text-amber-600" />
                              <span>{lang === 'ar' ? 'قيد المراجعة' : 'PENDING'}</span>
                            </>
                          ) : isActive ? (
                            t('status.active')
                          ) : isUsed ? (
                            lang === 'ar' ? 'تم استخدامه' : 'USED'
                          ) : isRejected ? (
                            lang === 'ar' ? 'مرفوض' : 'REJECTED'
                          ) : (
                            v.pass_obj?.status || v.status
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right rtl:text-left">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => approveMutation.mutate(v.id)}
                              disabled={approveMutation.isPending}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                              title={lang === 'ar' ? 'اعتماد وتفعيل التصريح فورياً' : 'Approve & Activate Pass'}
                            >
                              <Check className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'اعتماد' : 'Approve'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt(
                                  lang === 'ar' ? 'أدخل سبب رفض طلب الزيارة (اختياري):' : 'Enter rejection reason (optional):',
                                  lang === 'ar' ? 'تعليمات الطبيب المعالج أو استيعاب الجناح' : 'Per physician directive or ward capacity'
                                );
                                if (reason !== null) {
                                  rejectMutation.mutate({ visitId: v.id, reason });
                                }
                              }}
                              disabled={rejectMutation.isPending}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-all"
                              title={lang === 'ar' ? 'رفض الطلب' : 'Reject Request'}
                            >
                              <XCircle className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                            </button>
                            <button
                              onClick={() => handleSelectPass(v)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                            >
                              {lang === 'ar' ? 'عرض' : 'View'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPass(v);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            {lang === 'ar' ? 'عرض البطاقة' : 'View Badge'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: High Quality Printable Badge (5 cols) */}
        <div className={`lg:col-span-5 ${mobileTab === 'LIST' ? 'hidden lg:block' : 'block'}`}>
          {/* Mobile Back to List button */}
          <div className="lg:hidden mb-3 no-print">
            <button
              onClick={() => setMobileTab('LIST')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-hospital-700 bg-hospital-50 px-3 py-1.5 rounded-xl border border-hospital-200 hover:bg-hospital-100 transition-colors"
            >
              <span>{lang === 'ar' ? '← العودة لقائمة التصاريح' : '← Back to Passes List'}</span>
            </button>
          </div>

          {selectedVisit ? (
            <div className="space-y-4">
              {/* If Selected Visit is PENDING, show big Approval/Rejection action box right here! */}
              {(selectedVisit.pass_obj?.status === 'PENDING' || selectedVisit.status === 'PENDING_APPROVAL') && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 no-print shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Hourglass className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>{lang === 'ar' ? 'طلب تصريح زيارة قيد مراجعة واعتماد الاستقبال' : 'Visitor Pass Pending Reception Approval'}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {lang === 'ar'
                      ? 'هذا الطلب مقدم ذاتياً من الزائر وينتظر موافقتك. بمجرد الضغط على "اعتماد"، سيتم تفعيل الرمز الرقمي فوراً للزائر وللبوابات الذكية.'
                      : 'This self-service pass requires staff approval. Once approved, the scannable QR token activates immediately for turnstile entry.'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approveMutation.mutate(selectedVisit.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      {approveMutation.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'اعتماد وتفعيل التصريح الآن' : 'Approve & Activate Pass'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt(
                          lang === 'ar' ? 'أدخل سبب الرفض:' : 'Enter rejection reason:',
                          lang === 'ar' ? 'تعليمات الطبيب المعالج أو اكتمال سعة الجناح' : 'Medical directive or ward capacity'
                        );
                        if (reason !== null) {
                          rejectMutation.mutate({ visitId: selectedVisit.id, reason });
                        }
                      }}
                      disabled={rejectMutation.isPending}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'رفض الطلب' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  {lang === 'ar' ? 'بطاقة الزائر المحددة' : 'Selected Visitor Badge'}
                </span>
                <button
                  onClick={handlePrint}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> {lang === 'ar' ? 'طباعة التصريح' : 'Print Badge'}
                </button>
              </div>

              {/* The Official Pass Card (Optimized for Screen and Print) */}
              <div
                id="printable-visitor-pass"
                className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-2xl text-slate-900 max-w-sm mx-auto space-y-4 print-page"
              >
                {/* Hospital Header Banner */}
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                    {t('pass.ministry_header')}
                  </div>
                  <div className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                    {t('hospital.name')}
                  </div>
                  <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    {t('pass.header_title')}
                  </div>
                </div>

                {/* Scannable Real QR Image */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedVisit.pass_obj?.qr_image_base64 && (
                    <img
                      src={selectedVisit.pass_obj.qr_image_base64}
                      alt="Scannable QR Pass"
                      className="w-48 h-48 object-contain"
                    />
                  )}
                  <span className="font-mono text-xs font-bold tracking-wider text-slate-800 mt-2">
                    {selectedVisit.pass_obj?.pass_code}
                  </span>
                </div>

                {/* Badge Details */}
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{t('pass.visitor')}</span>
                    <span className="font-bold text-slate-900 text-right rtl:text-left">{selectedVisit.visitor_name}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{lang === 'ar' ? 'الرقم المدني:' : 'Civil ID:'}</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedVisit.visitor_civil_id}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{lang === 'ar' ? 'نوع التصريح:' : 'Visitor Type:'}</span>
                    <span className="font-bold text-slate-900">
                      {selectedVisit.visitor_type === 'COMPANION' ? (lang === 'ar' ? 'مرافق مريض' : 'Companion') : (lang === 'ar' ? 'زائر اعتيادي' : 'Visitor')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{t('pass.patient')}</span>
                    <span className="font-semibold text-slate-800">{selectedVisit.patient_name}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{t('pass.destination')}</span>
                    <span className="font-bold text-hospital-700">
                      {selectedVisit.ward_name} ({selectedVisit.patient_room} - {selectedVisit.patient_bed})
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{t('pass.duration')}</span>
                    <span className="font-bold text-slate-900">
                      {selectedVisit.max_duration_minutes} {lang === 'ar' ? 'دقيقة' : 'Minutes'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">{t('pass.status')}</span>
                    <span className="font-bold text-emerald-600">
                      {selectedVisit.pass_obj?.status === 'ACTIVE'
                        ? t('status.active')
                        : selectedVisit.pass_obj?.status === 'PENDING' || selectedVisit.status === 'PENDING_APPROVAL'
                        ? '🟡 ' + (lang === 'ar' ? 'قيد مراجعة الاستقبال' : 'Pending Approval')
                        : selectedVisit.pass_obj?.status || selectedVisit.status}
                    </span>
                  </div>
                </div>

                {/* Footer security note */}
                <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  {t('pass.footer_note')}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">
                {lang === 'ar' ? 'اختر تصريح زائر من القائمة لمعاينة البطاقة وطباعتها' : 'Select a visitor pass to preview badge and print'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
