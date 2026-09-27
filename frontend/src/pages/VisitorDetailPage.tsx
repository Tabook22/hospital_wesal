import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  User, ArrowLeft, ArrowRight, Clock, ShieldCheck, MapPin, Building,
  AlertTriangle, Phone, IdCard, Calendar, CheckCircle2, QrCode
} from 'lucide-react';
import { VisitorDetail } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const VisitorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const visitorId = parseInt(id || '0', 10);
  const { t, lang, isRtl } = useLanguage();

  const { data: visitor, isLoading } = useQuery<VisitorDetail>({
    queryKey: ['visitor-detail', visitorId],
    queryFn: () => api.getVisitor(visitorId),
    enabled: !!visitorId,
  });

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'ar' ? 'جاري تحميل تفاصيل وسجل الزائر...' : 'Loading visitor details...'}
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="p-8 text-center text-slate-500">
        {lang === 'ar' ? 'لم يتم العثور على الزائر.' : 'Visitor not found.'}{' '}
        <Link to="/visitors" className="text-hospital-600 hover:underline">
          {lang === 'ar' ? 'العودة إلى دليل الزوار' : 'Return to visitors'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/visitors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-hospital-600"
        >
          <BackIcon className="w-4 h-4" />
          {lang === 'ar' ? 'الرجوع إلى دليل الزوار والمرافقين' : 'Back to Visitors Directory'}
        </Link>
      </div>

      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-hospital-100 text-hospital-700 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
              {visitor.full_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{visitor.full_name}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    visitor.active_visit_status === 'OVERDUE'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                      : visitor.active_visit_status === 'ENDING_SOON'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : visitor.active_visit_status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {visitor.active_visit_status === 'OVERDUE'
                    ? t('status.overdue')
                    : visitor.active_visit_status === 'ENDING_SOON'
                    ? t('status.ending_soon')
                    : visitor.active_visit_status === 'ACTIVE'
                    ? t('status.active')
                    : lang === 'ar'
                    ? 'غير نشط حالياً'
                    : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' && visitor.visitor_type === 'COMPANION'
                  ? 'مرافق مريض'
                  : lang === 'ar' && visitor.visitor_type === 'VISITOR'
                  ? 'زائر اعتيادي'
                  : visitor.visitor_type}{' '}
                • {lang === 'ar' ? 'الرقم المدني:' : 'Civil ID:'} <span className="font-mono">{visitor.civil_id}</span> •{' '}
                {lang === 'ar' ? 'الهاتف:' : 'Mobile:'} <span className="font-mono">{visitor.mobile_number}</span>
              </p>
            </div>
          </div>

          <div className="text-left rtl:text-right sm:text-right sm:rtl:text-left">
            <span className="text-xs text-slate-400 block">
              {lang === 'ar' ? 'إجمالي زيارات المستشفى' : 'Total Hospital Visits'}
            </span>
            <span className="text-2xl font-black text-slate-800">{visitor.total_visits}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'الرقم المدني' : 'Civil ID'}</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{visitor.civil_id}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'رقم الهاتف المتنقل' : 'Mobile'}</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{visitor.mobile_number}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'صلة القرابة' : 'Relationship'}</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {visitor.relationship_to_patient || (lang === 'ar' ? 'غير محدد' : 'None')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold">{lang === 'ar' ? 'تاريخ أول تسجيل' : 'Member Since'}</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {new Date(visitor.created_at).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB')}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVITY TIMELINE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-hospital-600" />
            {lang === 'ar' ? 'السجل الزمني المتسلسل لحركة ونشاط الزائر' : 'Sequential Activity Timeline'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? 'سجل تدقيق أمني مفصل يشمل تسجيل الدخول، مسح البوابات الذكية، نقاط التفتيش، وإشعارات الرسائل القصيرة (SMS)'
              : 'Complete audit trail of registrations, smart gate scans, checkpoint passages, and SMS alerts'}
          </p>
        </div>

        <div className={`relative ${isRtl ? 'pr-6 before:right-2' : 'pl-6 before:left-2'} space-y-6 before:absolute before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200`}>
          {visitor.timeline.length === 0 ? (
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'لا توجد حركات مسجلة حتى الآن.' : 'No activity recorded yet.'}
            </p>
          ) : (
            visitor.timeline.map((event, idx) => {
              const isOverdue = event.event_type.includes('OVERDUE');
              const isDenied = event.status === 'DENIED';
              const isGranted = event.status === 'GRANTED';

              return (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute ${isRtl ? '-right-6' : '-left-6'} top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      isDenied
                        ? 'bg-rose-500 ring-4 ring-rose-100'
                        : isOverdue
                        ? 'bg-amber-500 ring-4 ring-amber-100'
                        : isGranted
                        ? 'bg-emerald-500 ring-4 ring-emerald-100'
                        : 'bg-hospital-600 ring-4 ring-hospital-100'
                    }`}
                  />

                  <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">{event.event_type}</span>
                      <span className="font-mono text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">{event.description}</p>

                    {event.checkpoint_name && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-hospital-500" />
                        <span>{lang === 'ar' ? 'نقطة العبور:' : 'Location:'}</span> {event.checkpoint_name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
