import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Users, Search, Eye, Filter, Phone, UserCheck, Shield } from 'lucide-react';
import { Visitor } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const VisitorsListPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [visitorType, setVisitorType] = useState<string>('ALL');

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ['visitors-list', search, visitorType],
    queryFn: () => api.getVisitors(search, visitorType === 'ALL' ? undefined : visitorType),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'ar' ? 'سجل الزوار والمرافقين' : 'Visitors & Companions Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'الملفات الشخصية للزوار، الأرقام المدنية وسجلات التواصل'
              : 'Registered visitor profiles, identification numbers, and contact records'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث باسم الزائر، الرقم المدني...' : 'Search visitor name, civil ID...'}
              className="pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-hospital-500 w-52"
            />
          </div>

          <select
            value={visitorType}
            onChange={(e) => setVisitorType(e.target.value)}
            aria-label="Filter by Visitor Type"
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">{lang === 'ar' ? 'كافة الأنواع' : 'All Types'}</option>
            <option value="VISITOR">{lang === 'ar' ? 'زائر اعتيادي (Visitor)' : 'Visitor (زائر)'}</option>
            <option value="COMPANION">{lang === 'ar' ? 'مرافق مريض (Companion)' : 'Companion (مرافق)'}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'الرقم المدني' : 'Civil ID / National ID'}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'رقم الهاتف' : 'Mobile Number'}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'نوع التصريح' : 'Visitor Type'}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'صلة القرابة' : 'Relationship'}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'الزيارة الحالية' : 'Active Visit'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t('th.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لم يتم العثور على سجلات زوار.' : 'No visitor records found.'}
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <Link to={`/visitors/${v.id}`} className="hover:text-hospital-600">
                        {v.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{v.civil_id}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{v.mobile_number}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.visitor_type === 'COMPANION'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-hospital-100 text-hospital-800'
                        }`}
                      >
                        {v.visitor_type === 'COMPANION' ? (lang === 'ar' ? 'مرافق' : 'Companion') : (lang === 'ar' ? 'زائر' : 'Visitor')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.relationship_to_patient || '—'}</td>
                    <td className="px-4 py-3">
                      {v.active_visit_status ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.active_visit_status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-700'
                              : v.active_visit_status === 'ENDING_SOON'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {v.active_visit_status === 'ACTIVE' ? t('status.active') :
                           v.active_visit_status === 'ENDING_SOON' ? t('status.ending_soon') :
                           v.active_visit_status === 'OVERDUE' ? t('status.overdue') :
                           v.active_visit_status}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'لا يوجد' : 'None'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left">
                      <Link
                        to={`/visitors/${v.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" /> {lang === 'ar' ? 'السجل الزمني' : 'Timeline'}
                      </Link>
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
