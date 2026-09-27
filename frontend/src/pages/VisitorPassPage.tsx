import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Printer, QrCode, Search, Shield, Eye, XCircle, CheckCircle2,
  Calendar, Clock, Building, Download, Share2
} from 'lucide-react';
import { VisitorPass, Visit } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const VisitorPassPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'LIST' | 'BADGE'>('LIST');

  const { data: visits = [], refetch } = useQuery<Visit[]>({
    queryKey: ['all-visits-passes'],
    queryFn: () => api.getVisits(),
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
              ? 'إصدار وعرض وطباعة تصاريح الزيارة الذكية المعتمدة لمستشفى السلطان قابوس'
              : 'Generate, view, print and manage official Sultan Qaboos Hospital QR visitor passes'}
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
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase">
              {lang === 'ar' ? `التصاريح الصادرة (${filteredVisits.length})` : `Issued Passes (${filteredVisits.length})`}
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
                {filteredVisits.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => handleSelectPass(v)}
                    className={`hover:bg-hospital-50/50 cursor-pointer transition-colors ${
                      selectedVisit?.id === v.id ? 'bg-hospital-50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-hospital-600' : ''
                    }`}
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.pass_obj?.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : v.pass_obj?.status === 'USED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {v.pass_obj?.status === 'ACTIVE' ? t('status.active') :
                         v.pass_obj?.status === 'USED' ? (lang === 'ar' ? 'تم استخدامه' : 'USED') :
                         v.pass_obj?.status || v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPass(v);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                      >
                        {lang === 'ar' ? 'عرض البطاقة' : 'View Badge'}
                      </button>
                    </td>
                  </tr>
                ))}
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
                      {selectedVisit.pass_obj?.status === 'ACTIVE' ? t('status.active') : selectedVisit.pass_obj?.status || selectedVisit.status}
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
