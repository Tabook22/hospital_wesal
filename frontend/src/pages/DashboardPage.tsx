import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import {
  Users, UserCheck, Clock, AlertTriangle, ShieldX, QrCode,
  Search, Filter, RefreshCw, ArrowUpRight, ArrowDownRight,
  Activity, Building, Eye, CheckCircle2, Sparkles, BookOpen, BedDouble
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Visit, DashboardData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AdminWorkflowGuide } from '../components/common/AdminWorkflowGuide';

export const DashboardPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Real-time ticking counter every second so remaining countdowns visibly tick down
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data, refetch, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard-live'],
    queryFn: () => api.getDashboardLive(),
    refetchInterval: 5000, // Background poll every 5s for reliability
  });

  // WebSocket instant notification
  useLiveUpdates((msg) => {
    if (msg.type === 'GATE_SCAN' || msg.type === 'STATUS_REFRESH' || msg.type === 'VISIT_CREATED' || msg.type === 'CHECKOUT') {
      refetch();
    }
  });

  const kpis = data?.kpis || {
    visitors_inside: 0,
    visitors_today: 0,
    checked_out: 0,
    overdue: 0,
    denied_entries: 0,
    active_passes: 0,
  };

  // Helper to format remaining or overdue time live
  const formatCountdown = (visit: Visit) => {
    if (visit.status === 'CHECKED_OUT') {
      return { text: t('status.checked_out'), badge: 'badge-checked-out' };
    }
    if (visit.status === 'CANCELLED') {
      return { text: lang === 'ar' ? 'ملغي' : 'Cancelled', badge: 'badge-denied' };
    }
    if (!visit.expected_exit_at) {
      return { text: lang === 'ar' ? 'بانتظار الدخول' : 'Pending Entry', badge: 'badge-checked-out' };
    }

    const exitTime = new Date(visit.expected_exit_at).getTime();
    const diff = exitTime - nowTimestamp;

    if (diff <= 0) {
      const overdueSec = Math.floor(Math.abs(diff) / 1000);
      const m = Math.floor(overdueSec / 60);
      const s = overdueSec % 60;
      return {
        text: `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${lang === 'ar' ? 'تجاوز' : 'OVERDUE'}`,
        badge: 'badge-overdue',
      };
    } else {
      const remSec = Math.floor(diff / 1000);
      const m = Math.floor(remSec / 60);
      const s = remSec % 60;
      const isEndingSoon = remSec <= 300; // <= 5 minutes
      return {
        text: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${lang === 'ar' ? 'متبقية' : 'remaining'}`,
        badge: isEndingSoon ? 'badge-ending-soon' : 'badge-active',
      };
    }
  };

  // Filter visitors
  const allVisitors = data?.active_visitors || [];
  const filteredVisitors = allVisitors.filter((v) => {
    // Status filter
    if (filterStatus === 'INSIDE' && !['ACTIVE', 'ENDING_SOON', 'OVERDUE'].includes(v.status)) return false;
    if (filterStatus === 'OVERDUE' && v.status !== 'OVERDUE') return false;
    if (filterStatus === 'ENDING_SOON' && v.status !== 'ENDING_SOON') return false;
    if (filterStatus === 'CHECKED_OUT' && v.status !== 'CHECKED_OUT') return false;

    // Ward filter
    if (selectedWard !== 'ALL' && v.ward_name !== selectedWard) return false;

    // Search filter
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      const matchVisitor = v.visitor_name.toLowerCase().includes(s);
      const matchPatient = v.patient_name.toLowerCase().includes(s);
      const matchPass = v.pass_obj?.pass_code.toLowerCase().includes(s) || false;
      const matchWard = v.ward_name.toLowerCase().includes(s);
      if (!matchVisitor && !matchPatient && !matchPass && !matchWard) return false;
    }

    return true;
  });

  const DENIAL_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header with Title and Live Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dash.title')}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-hospital-100 text-hospital-800 border border-hospital-200">
              {lang === 'ar' ? 'مراقبة حية' : 'Live Monitor'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('dash.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/reception"
            className="btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            {t('nav.reception')}
          </Link>
          <button
            onClick={() => refetch()}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5"
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('btn.refresh')}
          </button>
        </div>
      </div>

      {/* Welcoming Hospital Executive Banner */}
      <div className="bg-gradient-to-r from-hospital-700 via-hospital-600 to-indigo-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('hospital.name')} • {t('hospital.location')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {lang === 'ar'
                ? 'مرحباً بك في منصة وصل الذكية لإدارة الزوار والبوابات'
                : 'Welcome to WESAL Smart Visitor & Access Control Platform'}
            </h2>
            <p className="text-xs sm:text-sm text-hospital-100 max-w-2xl leading-relaxed">
              {lang === 'ar'
                ? 'نظام مؤتمت لحماية سعة الأسرة (حد أقصى 2 عند السرير)، إصدار تصاريح QR المشفرة، المسح البصري الذكي، والرقابة الآنية على الأجنحة الطبية.'
                : 'Automated platform enforcing bedside limits (max 2 per bed), encrypted QR passes, optical gate scans, and live ward monitoring.'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <Link
              to="/reception"
              className="px-4 py-2.5 rounded-xl bg-white text-hospital-800 hover:bg-hospital-50 font-bold text-xs shadow-md transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-hospital-600" />
              <span>{lang === 'ar' ? 'تسجيل زائر جديد 🚀' : 'New Visitor Registration 🚀'}</span>
            </Link>
            <Link
              to="/patients"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/25 transition-all inline-flex items-center gap-2"
            >
              <BedDouble className="w-4 h-4 text-emerald-300" />
              <span>{lang === 'ar' ? 'فحص سعة الأسرة 🛏️' : 'Bedside Capacity 🛏️'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Visitors Inside */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.inside')}</span>
            <div className="p-2 rounded-lg bg-hospital-50 text-hospital-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.visitors_inside}</span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center">
              <Activity className="w-3 h-3 mr-0.5 animate-pulse" /> {t('dash.kpi.active_pulse')}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-hospital-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (kpis.visitors_inside / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* Visitors Today */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.today')}</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.visitors_today}</span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'إجمالي' : 'Total'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" /> {lang === 'ar' ? 'كافة الأجنحة' : 'Across all wards'}
          </p>
        </div>

        {/* Checked Out */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.checked_out')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.checked_out}</span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'غادروا' : 'Exited'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-slate-400" /> {lang === 'ar' ? 'بوابة الخروج CP-07' : 'Passed CP-07'}
          </p>
        </div>

        {/* Overdue */}
        <div className={`rounded-xl p-4 border shadow-sm transition-all ${
          kpis.overdue > 0
            ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.overdue')}</span>
            <div className={`p-2 rounded-lg ${kpis.overdue > 0 ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${kpis.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {kpis.overdue}
            </span>
            {kpis.overdue > 0 && (
              <span className="text-[11px] font-bold text-rose-600 uppercase">{t('dash.kpi.alert_sent')}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">{lang === 'ar' ? 'تجاوزوا المدة المحددة' : 'Exceeded visiting time'}</p>
        </div>

        {/* Denied Entries */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.denied')}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.denied_entries}</span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'محاولات' : 'Attempts'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">{lang === 'ar' ? 'منع بالسعة والسياسات' : 'Policy / capacity blocks'}</p>
        </div>

        {/* Active Passes */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash.kpi.passes')}</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.active_passes}</span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'باركود QR' : 'Tokens'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">{lang === 'ar' ? 'تصاريح صالحة للدخول' : 'Scannable QR codes'}</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Entries vs Exits Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t('dash.traffic.title')}</h2>
              <p className="text-xs text-slate-500">{t('dash.traffic.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-hospital-600" /> {t('dash.traffic.entries')}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('dash.traffic.exits')}
              </span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourly_activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="entryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="exitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="entries" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#entryGrad)" name="Entries" />
                <Area type="monotone" dataKey="exits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#exitGrad)" name="Exits" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Occupancy Capacity Gauges */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t('dash.ward_occupancy.title')}</h2>
                <p className="text-xs text-slate-500">{t('dash.ward_occupancy.subtitle')}</p>
              </div>
              <Building className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3.5">
              {(data?.ward_occupancy || []).map((ward) => (
                <div key={ward.code}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{ward.ward_name}</span>
                    <span className="text-slate-500 font-medium">
                      {ward.current_inside} / {ward.capacity} ({ward.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ward.percent > 85 ? 'bg-rose-500' : ward.percent > 60 ? 'bg-amber-500' : 'bg-hospital-500'
                      }`}
                      style={{ width: `${Math.min(100, ward.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>{lang === 'ar' ? 'إجمالي نسبة إشغال المستشفى:' : 'Overall Hospital Occupancy:'}</span>
            <span className="font-bold text-slate-800">{data?.current_occupancy_rate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Embedded Interactive Admin Workflow & Guidance Playbook */}
      <AdminWorkflowGuide isEmbedded={true} />

      {/* LIVE VISITOR ACTIVITY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-hospital-600" />
              {t('dash.table.title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('dash.table.subtitle')}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dash.search_placeholder')}
                className="pl-8 rtl:pl-3 rtl:pr-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-hospital-500 focus:border-hospital-500 w-48 sm:w-56"
              />
            </div>

            {/* Ward Selector */}
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label="Filter by Ward"
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-hospital-500"
            >
              <option value="ALL">{lang === 'ar' ? 'كافة الأجنحة' : 'All Wards'}</option>
              <option value="Medical Ward A">{lang === 'ar' ? 'الجناح الباطني أ (Medical A)' : 'Medical Ward A'}</option>
              <option value="Medical Ward B">{lang === 'ar' ? 'الجناح الباطني ب (Medical B)' : 'Medical Ward B'}</option>
              <option value="Surgical Ward">{lang === 'ar' ? 'جناح الجراحة (Surgical Ward)' : 'Surgical Ward'}</option>
              <option value="Intensive Care Unit (ICU)">{lang === 'ar' ? 'العناية المركزة (ICU)' : 'Intensive Care Unit (ICU)'}</option>
              <option value="Pediatric Ward">{lang === 'ar' ? 'جناح الأطفال (Pediatric Ward)' : 'Pediatric Ward'}</option>
            </select>

            {/* Status Pills */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dash.filter.all')}
              </button>
              <button
                onClick={() => setFilterStatus('INSIDE')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterStatus === 'INSIDE' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dash.filter.inside')}
              </button>
              <button
                onClick={() => setFilterStatus('OVERDUE')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterStatus === 'OVERDUE' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dash.filter.overdue')}
              </button>
              <button
                onClick={() => setFilterStatus('CHECKED_OUT')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterStatus === 'CHECKED_OUT' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dash.filter.checked_out')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left rtl:text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{t('th.visitor')}</th>
                <th className="px-4 py-3">{t('th.pass_id')}</th>
                <th className="px-4 py-3">{t('th.patient_room')}</th>
                <th className="px-4 py-3">{t('th.ward')}</th>
                <th className="px-4 py-3">{t('th.last_location')}</th>
                <th className="px-4 py-3">{t('th.entry_time')}</th>
                <th className="px-4 py-3">{t('th.allowed_until')}</th>
                <th className="px-4 py-3">{t('th.remaining_time')}</th>
                <th className="px-4 py-3">{t('th.status')}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t('th.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لا يوجد زوار مطابقين لخيارات البحث المحددة.' : 'No visitors found matching current filters.'}
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visit) => {
                  const countdown = formatCountdown(visit);
                  const entryFormatted = visit.check_in_at
                    ? new Date(visit.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const exitFormatted = visit.expected_exit_at
                    ? new Date(visit.expected_exit_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  return (
                    <tr
                      key={visit.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        visit.status === 'OVERDUE' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Visitor Name & Type */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link to={`/visitors/${visit.visitor_id}`} className="hover:text-hospital-600 flex flex-col">
                          <span className="font-bold">{visit.visitor_name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {visit.visitor_type === 'COMPANION' ? (lang === 'ar' ? 'مرافق مريض' : 'Companion (مرافق)') : (lang === 'ar' ? 'زائر اعتيادي' : 'Visitor (زائر)')}
                          </span>
                        </Link>
                      </td>

                      {/* Pass Code */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        <Link to={`/passes`} className="text-hospital-600 hover:underline">
                          {visit.pass_obj?.pass_code || 'N/A'}
                        </Link>
                      </td>

                      {/* Patient & Room */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{visit.patient_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {visit.patient_room} • {visit.patient_bed} ({visit.patient_hospital_number})
                        </div>
                      </td>

                      {/* Ward */}
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {visit.ward_name}
                      </td>

                      {/* Last Known Checkpoint Location */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-hospital-500" />
                          {visit.last_checkpoint_name || (lang === 'ar' ? 'المدخل الرئيسي' : 'Main Entrance')}
                        </div>
                      </td>

                      {/* Entry Time */}
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {entryFormatted}
                      </td>

                      {/* Allowed Until */}
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {exitFormatted}
                      </td>

                      {/* Live Ticking Countdown */}
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={countdown.badge}>
                          {countdown.text}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${
                            visit.status === 'OVERDUE'
                              ? 'text-rose-600'
                              : visit.status === 'ENDING_SOON'
                              ? 'text-amber-600'
                              : visit.status === 'ACTIVE'
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {visit.status === 'ACTIVE' ? t('status.active') :
                           visit.status === 'ENDING_SOON' ? t('status.ending_soon') :
                           visit.status === 'OVERDUE' ? t('status.overdue') :
                           visit.status === 'CHECKED_OUT' ? t('status.checked_out') : visit.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          <Link
                            to={`/visitors/${visit.visitor_id}`}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title={lang === 'ar' ? 'عرض السجل الزمني' : 'View Visitor Timeline'}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {visit.status !== 'CHECKED_OUT' && (
                            <button
                              onClick={async () => {
                                const msg = lang === 'ar' 
                                  ? `هل أنت متأكد من تسجيل خروج الزائر ${visit.visitor_name}؟`
                                  : `Perform checkout for visitor ${visit.visitor_name}?`;
                                if (confirm(msg)) {
                                  await api.checkoutVisit(visit.id);
                                  refetch();
                                }
                              }}
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              {t('btn.checkout')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
