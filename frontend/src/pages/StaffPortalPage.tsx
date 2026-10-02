import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Users, Volume2, ShieldAlert, AlertOctagon,
  Clock, CheckCircle2, AlertTriangle, RefreshCw, LogOut,
  Languages, MapPin, User, MessageSquare, Plus, Sparkles, Radio
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StaffIncidentItem, IncidentCategory, IncidentSeverity, IncidentStatus } from '../types';
import { QuickIncidentModal } from '../components/incidents/QuickIncidentModal';

export const StaffPortalPage: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [initialWard, setInitialWard] = useState<string>('');

  // Fetch incidents reported by this staff member or all department incidents
  const {
    data: incidents = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<StaffIncidentItem[]>({
    queryKey: ['staff-portal-incidents'],
    queryFn: () => api.getIncidents({ limit: 100 }),
    refetchInterval: 3500, // Real-time poll every 3.5s
  });

  const handleLogout = () => {
    logout();
    navigate('/gateway');
  };

  const handleQuickSwitchRole = async (targetUsername: string) => {
    try {
      await login(targetUsername);
      queryClient.invalidateQueries({ queryKey: ['staff-portal-incidents'] });
    } catch (err) {
      console.error('Failed to switch demo staff user:', err);
    }
  };

  // Filter incidents for this view
  const filteredIncidents = incidents.filter((item) => {
    if (filterTab === 'ACTIVE') {
      return item.status === 'OPEN' || item.status === 'DISPATCHED';
    }
    if (filterTab === 'RESOLVED') {
      return item.status === 'RESOLVED' || item.status === 'DISMISSED';
    }
    return true;
  });

  // Calculate local metrics
  const totalCount = incidents.length;
  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const dispatchedCount = incidents.filter((i) => i.status === 'DISPATCHED').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  const getCategoryConfig = (category: IncidentCategory) => {
    switch (category) {
      case 'OVERCROWDING':
        return {
          icon: Users,
          labelAr: 'تكدس وزحام زوار',
          labelEn: 'Overcrowding',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'NOISE_DISTURBANCE':
        return {
          icon: Volume2,
          labelAr: 'إزعاج وضوضاء أطفال',
          labelEn: 'Noise Disturbance',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'UNAUTHORIZED_AREA':
        return {
          icon: ShieldAlert,
          labelAr: 'قسم غير مصرح به',
          labelEn: 'Unauthorized Area',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'URGENT_ACTION':
        return {
          icon: AlertOctagon,
          labelAr: 'تدخل أمني عاجل',
          labelEn: 'Urgent Security Dispatch',
          bg: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'VISITING_HOURS_VIOLATION':
        return {
          icon: Clock,
          labelAr: 'تجاوز وقت الزيارة',
          labelEn: 'Hours Violation',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      default:
        return {
          icon: AlertTriangle,
          labelAr: 'ملاحظة سلوكية',
          labelEn: 'Behavioral Note',
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
        };
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            {lang === 'ar' ? 'قيد الانتظار والمراجعة' : 'Pending Review'}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            {lang === 'ar' ? 'تم توجيه الأمن / الإشراف' : 'Security Dispatched'}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'ar' ? 'تم اتخاذ الإجراء وحل البلاغ' : 'Resolved & Handled'}
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {lang === 'ar' ? 'مغلق / مؤرشف' : 'Dismissed'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Hospital Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-hospital-700 to-hospital-500 text-white flex items-center justify-center shadow-md shadow-hospital-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">WESAL — وصل</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-hospital-100 text-hospital-800 border border-hospital-200">
                  {lang === 'ar' ? 'بوابة الكادر الطبي والتمريضي' : 'Clinical Staff Portal'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {lang === 'ar' ? 'مستشفى السلطان قابوس — صلالة' : 'Sultan Qaboos Hospital — Salalah'}
              </div>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-hospital-100 text-hospital-700 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.full_name || (lang === 'ar' ? 'مريم الكثيري (تمريض)' : 'Nurse Maryam')}
                </div>
                <div className="text-[10px] text-hospital-700 font-semibold">
                  {user?.username === 'doctor'
                    ? (lang === 'ar' ? 'طبيب مقيم — كادر طبي' : 'Resident Doctor')
                    : (lang === 'ar' ? 'تمريض — ممرضة مسؤولة' : 'Charge Nurse')}
                </div>
              </div>
            </div>

            {/* Quick Demo Staff Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSwitchRole('nurse')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  user?.username === 'nurse'
                    ? 'bg-white text-hospital-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="تسجيل بحساب التمريض"
              >
                {lang === 'ar' ? 'تمريض' : 'Nurse'}
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitchRole('doctor')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  user?.username === 'doctor'
                    ? 'bg-white text-hospital-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="تسجيل بحساب الطبيب"
              >
                {lang === 'ar' ? 'طبيب' : 'Doctor'}
              </button>
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center gap-1 shadow-xs"
              title="تغيير اللغة"
            >
              <Languages className="w-4 h-4 text-hospital-600" />
              <span className="hidden md:inline">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Hero Section with Urgent Action Dispatch Button */}
        <div className="bg-gradient-to-r from-hospital-900 via-hospital-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-hospital-900/10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-hospital-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-hospital-200 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  {lang === 'ar'
                    ? 'منظومة البلاغات والملاحظات الفورية للكادر الطبي والتمريضي'
                    : 'Clinical Staff Incident & Urgent Visitor Messaging System'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {lang === 'ar'
                  ? 'إرسال الملاحظات والبلاغات العاجلة لإدارة المستشفى'
                  : 'Dispatch Urgent Notices & Observations to Administration'}
              </h1>
              <p className="text-sm text-hospital-100/90 leading-relaxed">
                {lang === 'ar'
                  ? 'هذه المنصة مخصصة للأطباء وهيئة التمريض لملاحظة وإبلاغ الإدارة والأمن فوراً عن أي تكدس للزوار، ضوضاء الأطفال، التواجد في أقسام غير مصرح بها، أو طلب تدخل سريع لضبط بيئة الرعاية الطبية.'
                  : 'Empowering doctors and nursing staff to promptly alert administration & security of ward overcrowding, noise, or unauthorized visitors, ensuring immediate action and patient safety.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-400/25 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>{lang === 'ar' ? 'إرسال بلاغ أو ملاحظة عاجلة جديدة' : 'Send New Urgent Incident Notice'}</span>
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                <span>{lang === 'ar' ? 'تحديث البلاغات والردود' : 'Refresh Feed'}</span>
              </button>
            </div>
          </div>

          {/* Quick-Pick Issue Buttons */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setInitialWard('Medical Ward A');
                setIsModalOpen(true);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left rtl:text-right transition-all group flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  {lang === 'ar' ? 'تكدس زوار' : 'Overcrowding'}
                </div>
                <div className="text-[10px] text-white/60">
                  {lang === 'ar' ? 'تجاوز حد السرير' : 'Capacity limit'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialWard('Pediatric Ward');
                setIsModalOpen(true);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left rtl:text-right transition-all group flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  {lang === 'ar' ? 'إزعاج أطفال' : 'Noise & Kids'}
                </div>
                <div className="text-[10px] text-white/60">
                  {lang === 'ar' ? 'أصوات وركض بالممر' : 'Corridor noise'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialWard('Intensive Care Unit (ICU)');
                setIsModalOpen(true);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left rtl:text-right transition-all group flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  {lang === 'ar' ? 'قسم مقيد' : 'Restricted Ward'}
                </div>
                <div className="text-[10px] text-white/60">
                  {lang === 'ar' ? 'بدون تصريح معتمد' : 'No permit'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setInitialWard('Surgery Ward');
                setIsModalOpen(true);
              }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left rtl:text-right transition-all group flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  {lang === 'ar' ? 'تدخل أمني' : 'Security Alert'}
                </div>
                <div className="text-[10px] text-white/60">
                  {lang === 'ar' ? 'حضور فوري للأمن' : 'Immediate dispatch'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Metrics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>{lang === 'ar' ? 'إجمالي البلاغات' : 'Total Reports'}</span>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {lang === 'ar' ? 'مسجلة من الأقسام' : 'From all departments'}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
              <span>{lang === 'ar' ? 'قيد المراجعة (جديد)' : 'Open / Pending'}</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">{openCount}</div>
            <div className="text-[11px] text-amber-700/80 mt-1">
              {lang === 'ar' ? 'بانتظار توجيه الإدارة' : 'Awaiting dispatch'}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
            <div className="flex items-center justify-between text-blue-800 text-xs font-semibold mb-2">
              <span>{lang === 'ar' ? 'تم توجيه الأمن / الاستقبال' : 'Dispatched'}</span>
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900">{dispatchedCount}</div>
            <div className="text-[11px] text-blue-700/80 mt-1">
              {lang === 'ar' ? 'فرق الدعم متواجدة بالموقع' : 'Personnel on site'}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-2">
              <span>{lang === 'ar' ? 'تم اتخاذ الإجراء والحل' : 'Resolved'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-700/80 mt-1">
              {lang === 'ar' ? 'تمت معالجته وإغلاقه' : 'Completed actions'}
            </div>
          </div>
        </div>

        {/* Incidents Feed Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header & Filter Tabs */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{lang === 'ar' ? 'سجل البلاغات ومتابعة ردود إدارة المستشفى' : 'Submitted Incidents & Administrative Responses'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {filteredIncidents.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'متابعة حية لحالة كل بلاغ، التوجيه الأمني، وملاحظات الحل المسجلة من الإدارة'
                  : 'Real-time timeline of staff notices, security dispatches, and administrative resolutions.'}
              </p>
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ar' ? 'جميع البلاغات' : 'All Reports'}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTab === 'ACTIVE'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ar' ? 'قيد المتابعة' : 'Active'} ({openCount + dispatchedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('RESOLVED')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterTab === 'RESOLVED'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ar' ? 'تم الحل' : 'Resolved'} ({resolvedCount})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="p-4 sm:p-6 divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-hospital-600 mb-3" />
                <p className="text-sm font-semibold">{lang === 'ar' ? 'جارٍ تحميل سجل البلاغات...' : 'Loading incidents...'}</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
                <div className="text-base font-bold text-slate-700">
                  {lang === 'ar' ? 'لا توجد بلاغات مسجلة في هذا القسم حالياً' : 'No incident reports in this category'}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'الأوضاع هادئة ومنتظمة في الأجنحة الطبية. يمكنك الضغط على زر "إرسال بلاغ" عند ملاحظة أي مخالفة أو تكدس.'
                    : 'Wards are calm and operating normally. Click "Send New Incident Notice" if any visitor issue arises.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال أول بلاغ' : 'Send First Notice'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => {
                  const catCfg = getCategoryConfig(incident.category);
                  const Icon = catCfg.icon;

                  return (
                    <div
                      key={incident.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-hospital-300 hover:shadow-md transition-all space-y-3"
                    >
                      {/* Top Bar of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {incident.incident_number}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${catCfg.bg}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? catCfg.labelAr : catCfg.labelEn}</span>
                          </span>
                          {incident.severity === 'URGENT' && (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-600 text-white animate-pulse">
                              {lang === 'ar' ? 'عاجل وفوري' : 'URGENT'}
                            </span>
                          )}
                        </div>

                        <div>{getStatusBadge(incident.status)}</div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {incident.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          {incident.description}
                        </p>
                      </div>

                      {/* Location & Metadata */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-hospital-600" />
                          <span>{incident.ward_name}</span>
                        </div>
                        {incident.location_details && (
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{incident.location_details}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {lang === 'ar' ? 'مقدم البلاغ:' : 'Reporter:'} <strong className="text-slate-800">{incident.reporter_name}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Suggested Action by Staff */}
                      {incident.suggested_action && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{lang === 'ar' ? 'الإجراء المقترح من الكادر الطبي:' : 'Staff Suggested Action:'}</span>
                          </div>
                          <div className="text-slate-600 leading-relaxed pr-5 rtl:pr-5 rtl:pl-0 pl-5">
                            {incident.suggested_action}
                          </div>
                        </div>
                      )}

                      {/* Official Administration / Security Response Box */}
                      <div className="mt-2">
                        {incident.status === 'OPEN' ? (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                            <span className="leading-relaxed">
                              {lang === 'ar'
                                ? 'تم استلام البلاغ في مركز تحكم الاستقبال والإدارة — جاري توجيه الدعم اللازم لاتخاذ الإجراء.'
                                : 'Notice received at administration control center — pending security dispatch.'}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-emerald-900">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                {incident.status === 'RESOLVED'
                                  ? (lang === 'ar' ? 'إجراء وتوجيه إدارة المستشفى (تم الحل):' : 'Administration Resolution Action:')
                                  : (lang === 'ar' ? 'توجيه الإدارة والأمن (قيد التعامل بالموقع):' : 'Dispatched Action on Site:')}
                              </span>
                              {incident.resolved_by && (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {incident.resolved_by}
                                </span>
                              )}
                            </div>
                            <p className="text-emerald-900/90 leading-relaxed font-medium pr-5 rtl:pr-5 rtl:pl-0 pl-5">
                              {incident.admin_notes || (lang === 'ar' ? 'تم التعامل مع البلاغ ميدانياً والتأكد من انضباط الزوار.' : 'Action handled on site by hospital security.')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick Incident Reporting Modal */}
      <QuickIncidentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialWard('');
        }}
        initialWard={initialWard}
      />
    </div>
  );
};
