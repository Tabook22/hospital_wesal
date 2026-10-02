import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, AlertTriangle, Users, Volume2, Clock, CheckCircle2,
  Filter, Search, Send, Check, RefreshCw, XCircle, ArrowRight,
  Shield, Building2, MapPin, User, Sparkles, AlertOctagon, MessageSquare,
  Radio, PhoneCall
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StaffIncidentItem, IncidentCategory, IncidentSeverity, IncidentStatus } from '../types';
import { QuickIncidentModal } from '../components/incidents/QuickIncidentModal';

export const IncidentsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action / Resolution Modal State
  const [selectedIncident, setSelectedIncident] = useState<StaffIncidentItem | null>(null);
  const [actionType, setActionType] = useState<'DISPATCH' | 'RESOLVE' | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  // 1. Fetch Incidents
  const {
    data: incidents = [],
    isLoading,
    refetch,
  } = useQuery<StaffIncidentItem[]>({
    queryKey: ['staff-incidents', statusFilter, severityFilter, wardFilter],
    queryFn: () =>
      api.getIncidents({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        ward_name: wardFilter !== 'ALL' ? wardFilter : undefined,
      }),
    refetchInterval: 4000, // Live poll every 4s
  });

  // 2. Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: () => api.getIncidentStats(),
    refetchInterval: 4000,
  });

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { status: IncidentStatus; admin_notes?: string; resolved_by?: string } }) =>
      api.updateIncidentStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
      setSelectedIncident(null);
      setActionType(null);
      setAdminNotes('');
    },
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !actionType) return;

    const newStatus: IncidentStatus = actionType === 'DISPATCH' ? 'DISPATCHED' : 'RESOLVED';
    updateStatusMutation.mutate({
      id: selectedIncident.id,
      payload: {
        status: newStatus,
        admin_notes: adminNotes.trim() || (actionType === 'DISPATCH' ? 'تم توجيه دورية الأمن فوراً للموقع' : 'تم التعامل مع البلاغ بنجاح'),
        resolved_by: user?.full_name || 'Admin Officer',
      },
    });
  };

  const getCategoryBadge = (category: IncidentCategory) => {
    switch (category) {
      case 'OVERCROWDING':
        return {
          icon: Users,
          labelAr: 'تكدس وزحام زوار',
          labelEn: 'Overcrowding',
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
        };
      case 'NOISE_DISTURBANCE':
        return {
          icon: Volume2,
          labelAr: 'إزعاج وضوضاء أطفال',
          labelEn: 'Noise Disturbance',
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'UNAUTHORIZED_AREA':
        return {
          icon: ShieldAlert,
          labelAr: 'قسم غير مصرح به',
          labelEn: 'Restricted Area',
          bg: 'bg-rose-100 text-rose-900 border-rose-200',
        };
      case 'URGENT_ACTION':
        return {
          icon: AlertOctagon,
          labelAr: 'تدخل أمني عاجل',
          labelEn: 'Security Intervention',
          bg: 'bg-red-100 text-red-900 border-red-200',
        };
      case 'VISITING_HOURS_VIOLATION':
        return {
          icon: Clock,
          labelAr: 'تجاوز ساعات الزيارة',
          labelEn: 'Overstay Violation',
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      default:
        return {
          icon: AlertTriangle,
          labelAr: 'ملاحظة ومخالفة',
          labelEn: 'Staff Notice',
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'URGENT':
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-sm shadow-rose-600/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>{lang === 'ar' ? 'عاجل جداً' : 'Urgent'}</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            {lang === 'ar' ? 'أولوية مرتفعة' : 'High Priority'}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {lang === 'ar' ? 'متوسط' : 'Medium'}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {lang === 'ar' ? 'عادي' : 'Low'}
          </span>
        );
    }
  };

  const filteredIncidents = incidents.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.incident_number.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.reporter_name.toLowerCase().includes(q) ||
      (item.location_details && item.location_details.toLowerCase().includes(q)) ||
      item.ward_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-rose-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{lang === 'ar' ? 'منظومة البلاغات والملاحظات الإدارية والأمنية الحية' : 'Live Staff Incidents & Security Dispatch'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {lang === 'ar' ? 'بلاغات وملاحظات الكادر الطبي والأمني' : 'Hospital Staff Incidents & Alerts'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'قناة تواصل عاجلة لفرق التمريض والأطباء لإشعار الإدارة ومكتب الاستقبال ودوريات الأمن بأي مخالفات (تكدس الزوار، أطفال يصدرون ضوضاء، أو تواجد في أقسام مقيدة).'
                : 'Emergency communication stream enabling clinical staff to notify administration & security of visitor overstay, noise disturbances, overcrowding, or restricted ward access.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>{lang === 'ar' ? 'تسجيل بلاغ عاجل جديد' : 'Report Urgent Incident'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'بلاغات اليوم' : 'Total Today'}
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_today || 0}</div>
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'مسجلة منذ الصباح' : 'Logged since midnight'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-rose-200 bg-rose-50/20 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{lang === 'ar' ? 'عاجلة بحاجة لإجراء' : 'Urgent Active'}</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.urgent_count || 0}</div>
          <div className="text-[10px] text-rose-800 font-semibold">{lang === 'ar' ? 'أولوية قصوى' : 'Immediate dispatch'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'قيد الانتظار' : 'Open / Unassigned'}
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.open_count || 0}</div>
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'بانتظار توجيه الأمن' : 'Awaiting action'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'تم توجيه الأمن' : 'Security Dispatched'}
          </div>
          <div className="text-2xl font-black text-blue-600">{stats?.dispatched_count || 0}</div>
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'دورية بالموقع حالياً' : 'En route to ward'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'ar' ? 'تم حلها اليوم' : 'Resolved Today'}
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.resolved_today_count || 0}</div>
          <div className="text-[10px] text-slate-400">{lang === 'ar' ? 'تمت معالجتها بنجاح' : 'Successfully resolved'}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
              { id: 'OPEN', labelAr: 'مفتوح', labelEn: 'Open' },
              { id: 'DISPATCHED', labelAr: 'تم التوجيه', labelEn: 'Dispatched' },
              { id: 'RESOLVED', labelAr: 'تم الحل', labelEn: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث برقم البلاغ، الموظف، الغرفة...' : 'Search by code, staff, room...'}
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Secondary filters (Severity & Ward) */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصفية حسب:' : 'Filter by:'}</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع درجات الأولوية' : 'All Severities'}</option>
            <option value="URGENT">{lang === 'ar' ? '🔴 عاجل جداً' : '🔴 Urgent'}</option>
            <option value="HIGH">{lang === 'ar' ? '🟠 مرتفع' : '🟠 High'}</option>
            <option value="MEDIUM">{lang === 'ar' ? '🔵 متوسط' : '🔵 Medium'}</option>
            <option value="LOW">{lang === 'ar' ? '⚪ عادي' : '⚪ Low'}</option>
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع الأجنحة الطبية' : 'All Medical Wards'}</option>
            <option value="Medical Ward A">{lang === 'ar' ? 'جناح الباطنية (أ)' : 'Medical Ward A'}</option>
            <option value="Medical Ward B">{lang === 'ar' ? 'جناح الباطنية (ب)' : 'Medical Ward B'}</option>
            <option value="Intensive Care Unit (ICU)">{lang === 'ar' ? 'العناية المركزة (ICU)' : 'Intensive Care Unit (ICU)'}</option>
            <option value="Pediatric Ward">{lang === 'ar' ? 'جناح الأطفال' : 'Pediatric Ward'}</option>
            <option value="Surgical Ward">{lang === 'ar' ? 'جناح الجراحة' : 'Surgical Ward'}</option>
          </select>

          {(statusFilter !== 'ALL' || severityFilter !== 'ALL' || wardFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setWardFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[11px] text-rose-600 font-bold hover:underline px-2"
            >
              {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          )}
        </div>
      </div>

      {/* Incidents Feed */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-rose-600" />
          <span className="text-xs font-semibold">{lang === 'ar' ? 'جاري تحميل سجل البلاغات الحية...' : 'Loading live incidents stream...'}</span>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3 max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            {lang === 'ar' ? 'لا توجد بلاغات نشطة مطابقة' : 'No Matching Incidents Found'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === 'ar'
              ? 'جميع الأجنحة هادئة ومنضبطة، أو تم التعامل مع جميع الملاحظات المسجلة.'
              : 'All inpatient wards are currently operating smoothly with no outstanding notices.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            {lang === 'ar' ? 'تسجيل بلاغ جديد' : 'Log New Incident'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700">
              {lang === 'ar' ? `البلاغات والملاحظات المسجلة (${filteredIncidents.length})` : `Logged Incidents (${filteredIncidents.length})`}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === 'ar' ? 'متصل بالبث الحي للإنذارات' : 'Live WebSocket Sync'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredIncidents.map((item) => {
              const cat = getCategoryBadge(item.category);
              const CatIcon = cat.icon;
              const isUrgent = item.severity === 'URGENT';
              const isOpen = item.status === 'OPEN';
              const isDispatched = item.status === 'DISPATCHED';
              const isResolved = item.status === 'RESOLVED';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-sm space-y-4 ${
                    isUrgent && isOpen
                      ? 'border-rose-400 bg-rose-50/20 shadow-md ring-2 ring-rose-500/10'
                      : isDispatched
                      ? 'border-blue-300 bg-blue-50/10'
                      : isResolved
                      ? 'border-slate-200 opacity-90'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Code, Category, Severity, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.incident_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${cat.bg}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{lang === 'ar' ? cat.labelAr : cat.labelEn}</span>
                      </span>
                      {getSeverityBadge(item.severity)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isOpen
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isDispatched
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {isOpen
                          ? lang === 'ar' ? 'قيد الانتظار' : 'Open'
                          : isDispatched
                          ? lang === 'ar' ? 'تم توجيه الأمن' : 'Security Dispatched'
                          : lang === 'ar' ? 'تم الحل والإغلاق' : 'Resolved'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Middle Content: Title, Description, Location */}
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  </div>

                  {/* Suggested Action Bar */}
                  {item.suggested_action && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">{lang === 'ar' ? 'الإجراء المقترح من الكادر:' : 'Suggested Staff Action:'} </strong>
                        <span>{item.suggested_action}</span>
                      </div>
                    </div>
                  )}

                  {/* Admin Resolution / Dispatch Log */}
                  {item.admin_notes && (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px] text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'ar' ? 'سجل التعامل الإداري والأمني:' : 'Administrative Action Taken:'}</span>
                        </span>
                        <span>{item.resolved_by}</span>
                      </div>
                      <p className="text-xs text-emerald-900">{item.admin_notes}</p>
                    </div>
                  )}

                  {/* Footer Bar: Location + Reporter Info + Interactive Admin Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.ward_name}</span>
                        {item.location_details && (
                          <span className="text-slate-500 font-normal">({item.location_details})</span>
                        )}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {lang === 'ar' ? 'المبلغ:' : 'Reporter:'}{' '}
                          <strong className="text-slate-800">{item.reporter_name}</strong> ({item.reporter_role})
                        </span>
                      </span>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {item.status !== 'RESOLVED' && (
                        <>
                          {item.status !== 'DISPATCHED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIncident(item);
                                setActionType('DISPATCH');
                                setAdminNotes(
                                  lang === 'ar'
                                    ? `تم توجيه دورية الأمن إلى ${item.ward_name} ${item.location_details || ''} فوراً.`
                                    : `Security dispatched to ${item.ward_name} immediately.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'توجيه الأمن' : 'Dispatch Security'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIncident(item);
                              setActionType('RESOLVE');
                              setAdminNotes(
                                lang === 'ar'
                                  ? 'تم التعامل مع الموقف ميدانياً، وتم تنبيه الزوار والالتزام بالضوابط.'
                                  : 'Incident resolved on-site. Visitors complied with hospital regulations.'
                              );
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'إغلاق وحل البلاغ' : 'Resolve Incident'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Action / Resolution Modal */}
      {selectedIncident && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {actionType === 'DISPATCH' ? (
                  <PhoneCall className="w-5 h-5 text-blue-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {actionType === 'DISPATCH'
                    ? lang === 'ar' ? 'توجيه الأمن أو الاستقبال للبلاغ' : 'Dispatch Security / Staff'
                    : lang === 'ar' ? 'تسجيل الحل وإغلاق البلاغ' : 'Resolve & Close Incident'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800">{selectedIncident.title}</div>
              <div className="text-slate-500">{selectedIncident.ward_name} &bull; {selectedIncident.location_details}</div>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {actionType === 'DISPATCH'
                    ? lang === 'ar' ? 'ملاحظة التوجيه لدورية الأمن:' : 'Dispatch Note / Instructions:'
                    : lang === 'ar' ? 'شرح الإجراء المتخذ لحل البلاغ:' : 'Resolution Summary / Action Taken:'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-0 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIncident(null);
                    setActionType(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 ${
                    actionType === 'DISPATCH'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {updateStatusMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : actionType === 'DISPATCH' ? (
                    <>
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تأكيد توجيه الأمن' : 'Confirm Dispatch'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تأكيد حل البلاغ' : 'Confirm Resolution'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Quick Incident Modal */}
      <QuickIncidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
