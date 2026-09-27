import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  ArrowLeft, ArrowRight, UserCheck, Building, UserPlus, AlertCircle,
  CheckCircle2, Bed, Clock
} from 'lucide-react';
import { Patient, Visit } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id || '0', 10);
  const { t, lang, isRtl } = useLanguage();

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient-detail', patientId],
    queryFn: () => api.getPatient(patientId),
    enabled: !!patientId,
  });

  const { data: allVisits = [] } = useQuery<Visit[]>({
    queryKey: ['patient-visits', patientId],
    queryFn: () => api.getVisits(),
  });

  const patientVisits = allVisits.filter((v) => v.patient_id === patientId);

  if (isLoading || !patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'ar' ? 'جاري تحميل بيانات المريض المنوم...' : 'Loading patient data...'}
      </div>
    );
  }

  const isFull = patient.current_visitors_count >= patient.max_concurrent_visitors;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-hospital-600"
        >
          <BackIcon className="w-4 h-4" />
          {lang === 'ar' ? 'الرجوع إلى قائمة المرضى والأجنحة' : 'Back to Patients & Bedside'}
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-hospital-100 text-hospital-700 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
              {patient.full_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {lang === 'ar' && patient.admission_status === 'ADMITTED'
                    ? 'منوم حالياً'
                    : patient.admission_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'الرقم الصحي:' : 'Hospital #:'} <span className="font-mono">{patient.hospital_number}</span> •{' '}
                {lang === 'ar' ? 'الرقم المدني:' : 'Civil ID:'} <span className="font-mono">{patient.civil_id || '—'}</span> •{' '}
                {lang === 'ar' ? 'الجنس:' : 'Gender:'} {lang === 'ar' ? (patient.gender === 'Male' ? 'ذكر' : 'أنثى') : patient.gender}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                isFull
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {lang === 'ar'
                ? `سعة السرير الحالية: ${patient.current_visitors_count} / ${patient.max_concurrent_visitors}`
                : `Bedside: ${patient.current_visitors_count} / ${patient.max_concurrent_visitors}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'الجناح / القسم' : 'Ward'}</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{patient.ward_name}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'الغرفة والسرير' : 'Room & Bed'}</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{patient.room_number} • {patient.bed}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'الحد الأقصى اليومي' : 'Max Daily Limit'}</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {patient.max_daily_visitors} {lang === 'ar' ? 'زيارات/اليوم' : 'visits/day'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'إجمالي زيارات اليوم' : "Today's Total Visits"}</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{patient.today_visitors_count}</span>
          </div>
        </div>
      </div>

      {/* Patient Visits Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          {lang === 'ar' ? 'سجل زيارات المريض المنوم' : 'Patient Visit History'} ({patientVisits.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5">{t('th.visitor')}</th>
                <th className="px-4 py-2.5">{t('th.pass_id')}</th>
                <th className="px-4 py-2.5">{t('th.status')}</th>
                <th className="px-4 py-2.5">{lang === 'ar' ? 'وقت الدخول' : 'Entered At'}</th>
                <th className="px-4 py-2.5">{lang === 'ar' ? 'وقت الخروج' : 'Exited At'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientVisits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد زيارات مسجلة لهذا المريض اليوم.' : 'No visits recorded for this patient today.'}
                  </td>
                </tr>
              ) : (
                patientVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{v.visitor_name}</td>
                    <td className="px-4 py-2.5 font-mono text-hospital-700">{v.pass_obj?.pass_code || v.visit_number}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-slate-700">
                        {v.status === 'ACTIVE'
                          ? t('status.active')
                          : v.status === 'OVERDUE'
                          ? t('status.overdue')
                          : v.status === 'CHECKED_OUT'
                          ? t('status.checked_out')
                          : v.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {v.check_in_at ? new Date(v.check_in_at).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {v.checked_out_at ? new Date(v.checked_out_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
