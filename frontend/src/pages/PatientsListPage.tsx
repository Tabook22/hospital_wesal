import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCheck, Search, Building, UserPlus, AlertCircle,
  CheckCircle2, Bed, ArrowRight
} from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const PatientsListPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['patients-list', search],
    queryFn: () => api.getPatients(search),
  });

  const filteredPatients = patients.filter((p) => {
    if (wardFilter !== 'ALL' && p.ward_name !== wardFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'ar' ? 'المرضى وسعة الأسرة السريرية' : 'Patients & Bedside Capacity'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'متابعة إشغال الأسرة، سعة الزوار المتزامنة لكل مريض، والحدود اليومية المعتمدة'
              : 'Real-time patient ward census, bedside concurrent limits, and daily visitor quotas'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث باسم المريض، الرقم الصحي، الغرفة...' : 'Search patient, hospital #, room...'}
              className="w-full sm:w-56 pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-hospital-500"
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            aria-label="Filter by Ward"
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">{lang === 'ar' ? 'كافة الأجنحة' : 'All Wards'}</option>
            <option value="Medical Ward A">{lang === 'ar' ? 'الجناح الباطني أ' : 'Medical Ward A'}</option>
            <option value="Medical Ward B">{lang === 'ar' ? 'الجناح الباطني ب' : 'Medical Ward B'}</option>
            <option value="Surgical Ward">{lang === 'ar' ? 'جناح الجراحة' : 'Surgical Ward'}</option>
            <option value="Intensive Care Unit (ICU)">{lang === 'ar' ? 'العناية المركزة (ICU)' : 'ICU'}</option>
            <option value="Pediatric Ward">{lang === 'ar' ? 'جناح الأطفال' : 'Pediatric Ward'}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredPatients.map((p) => {
          const isFull = p.current_visitors_count >= p.max_concurrent_visitors;
          const isDailyFull = p.today_visitors_count >= p.max_daily_visitors;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">{p.full_name}</h2>
                    <span className="text-xs font-mono font-medium text-hospital-700">
                      {p.hospital_number}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {p.current_visitors_count} / {p.max_concurrent_visitors} {lang === 'ar' ? 'عند السرير' : 'Bedside'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'ar' ? 'الجناح:' : 'Ward:'}</span>
                    <span className="font-semibold text-slate-800">{p.ward_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'ar' ? 'الغرفة والسرير:' : 'Room & Bed:'}</span>
                    <span className="text-slate-800">{p.room_number} • {p.bed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'ar' ? 'زيارات اليوم:' : "Today's Visits:"}</span>
                    <span className="text-slate-800 font-mono">
                      {p.today_visitors_count} / {p.max_daily_visitors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'ar' ? 'حالة التنويم:' : 'Admission Status:'}</span>
                    <span className="font-semibold text-emerald-600">
                      {p.admission_status === 'ADMITTED' ? (lang === 'ar' ? 'منوم حالياً' : 'ADMITTED') : p.admission_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/patients/${p.id}`}
                  className="text-xs text-hospital-600 hover:underline font-semibold"
                >
                  {lang === 'ar' ? 'تفاصيل السرير' : 'View Bed Details'}
                </Link>

                <button
                  onClick={() => navigate(`/reception?patientId=${p.id}`)}
                  disabled={isFull || isDailyFull}
                  className="px-2.5 py-1 rounded-lg bg-hospital-50 hover:bg-hospital-100 text-hospital-700 font-semibold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'إصدار تصريح' : 'Issue Pass'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
