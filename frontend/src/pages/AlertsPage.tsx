import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import {
  Bell, Smartphone, Send, ShieldAlert, Clock, AlertTriangle,
  CheckCircle2, RefreshCw, MessageSquare
} from 'lucide-react';
import { NotificationItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const AlertsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [selectedAlert, setSelectedAlert] = useState<NotificationItem | null>(null);
  const [mobileTab, setMobileTab] = useState<'LOGS' | 'PHONE' | 'DISPATCH'>('LOGS');

  // Custom Simulator Form State
  const [recipientName, setRecipientName] = useState(lang === 'ar' ? 'محمد بن علي اليافعي' : 'Mohammed Ali');
  const [mobileNumber, setMobileNumber] = useState('96891234567');
  const [messageText, setMessageText] = useState(
    lang === 'ar'
      ? 'عزيزي الزائر، تفيدكم إدارة مستشفى السلطان قابوس بأن مدة الزيارة المتبقية هي 5 دقائق. يرجى الاستعداد للمغادرة. منصة وصل – مستشفى السلطان قابوس'
      : 'Dear Mohammed, your visiting period will end in 5 minutes. Please prepare to leave the ward. Wesal – Sultan Qaboos Hospital'
  );
  const [alertType, setAlertType] = useState('WARNING_5MIN');

  const { data: alerts = [], refetch, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['alerts-list'],
    queryFn: () => api.getAlerts(),
    refetchInterval: 5000,
  });

  useLiveUpdates(() => {
    refetch();
  });

  const activeSelected = selectedAlert || (alerts.length > 0 ? alerts[0] : null);

  const simulateMutation = useMutation({
    mutationFn: () =>
      api.simulateAlert({
        recipient_name: recipientName,
        mobile_number: mobileNumber,
        message: messageText,
        notification_type: alertType,
      }),
    onSuccess: (newAlert) => {
      setSelectedAlert(newAlert);
      setMobileTab('PHONE');
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{t('alerts.title')}</h1>
              <p className="text-xs text-slate-500">
                {t('alerts.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> {t('btn.refresh')}
        </button>
      </div>

      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold no-print">
        <button
          onClick={() => setMobileTab('LOGS')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'LOGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          {lang === 'ar' ? `السجل (${alerts.length})` : `Logs (${alerts.length})`}
        </button>
        <button
          onClick={() => setMobileTab('PHONE')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'PHONE' ? 'bg-white text-hospital-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {lang === 'ar' ? 'معاينة الهاتف 📱' : 'Phone View 📱'}
        </button>
        <button
          onClick={() => setMobileTab('DISPATCH')}
          className={`flex-1 py-2 text-center rounded-lg transition-all ${
            mobileTab === 'DISPATCH' ? 'bg-white text-hospital-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {lang === 'ar' ? 'إرسال تنبيه 📤' : 'Dispatch 📤'}
        </button>
      </div>

      {/* Main Grid: Left = Notifications List, Center = Mobile Device Mockup, Right = Simulator Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts Log Stream (4 cols) */}
        <div className={`lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 ${
          mobileTab === 'LOGS' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">
              {lang === 'ar' ? `سجل التنبيهات (${alerts.length})` : `Alert Logs (${alerts.length})`}
            </span>
            <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'انقر للمعاينة' : 'Click to preview'}</span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                {lang === 'ar' ? 'لم يتم تسجيل أي تنبيهات بعد.' : 'No notifications recorded yet.'}
              </p>
            ) : (
              alerts.map((a) => {
                const isOverdue = a.notification_type === 'OVERDUE';
                const isWarning = a.notification_type === 'WARNING_5MIN';

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAlert(a);
                      setMobileTab('PHONE');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left rtl:text-right ${
                      activeSelected?.id === a.id
                        ? 'bg-hospital-50 border-hospital-500 ring-2 ring-hospital-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{a.recipient_name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-hospital-100 text-hospital-700'
                        }`}
                      >
                        {isOverdue ? (lang === 'ar' ? 'تجاوز الزيارة' : 'OVERDUE') :
                         isWarning ? (lang === 'ar' ? 'إنذار 5 دقائق' : 'WARNING 5M') :
                         a.notification_type}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{a.message}</p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{a.mobile_number}</span>
                      <span>{new Date(a.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Mobile Device Simulation Mockup (4 cols) */}
        <div className={`lg:col-span-4 flex flex-col items-center justify-center ${
          mobileTab === 'PHONE' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="w-full max-w-[280px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-700 relative">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
              <div className="w-6 h-1 rounded-full bg-slate-900" />
            </div>

            {/* Screen */}
            <div className="bg-slate-100 rounded-[30px] p-4 min-h-[460px] flex flex-col justify-between overflow-hidden text-slate-900 border border-slate-300">
              {/* Phone Status Bar */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pb-2 border-b border-slate-200">
                <span>05:30 PM</span>
                <span className="font-mono">Omantel 5G</span>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 py-4 flex-1">
                <div className="text-center">
                  <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {lang === 'ar' ? 'اليوم' : 'Today'}
                  </span>
                </div>

                {activeSelected ? (
                  <div className="space-y-2">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-hospital-700 font-bold text-[11px] mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'وصل • مستشفى السلطان قابوس' : 'Wesal • Sultan Qaboos Hospital'}
                      </div>
                      <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-line text-left rtl:text-right">
                        {activeSelected.message}
                      </p>
                      <div className="text-right rtl:text-left mt-1.5 text-[9px] text-slate-400">
                        {new Date(activeSelected.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {lang === 'ar' ? 'تم التسليم' : 'Delivered'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    {lang === 'ar' ? 'لم يتم اختيار أي رسالة' : 'No message selected'}
                  </div>
                )}
              </div>

              {/* Simulated Input Bar */}
              <div className="bg-white rounded-full px-3 py-1.5 border border-slate-300 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{lang === 'ar' ? 'رسالة نصية (SMS)' : 'Text Message'}</span>
                <Send className="w-3.5 h-3.5 text-hospital-500 rtl:rotate-180" />
              </div>
            </div>

            {/* Home indicator bar */}
            <div className="w-20 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>
        </div>

        {/* Right: Manual SMS Dispatch Simulator (4 cols) */}
        <div className={`lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 ${
          mobileTab === 'DISPATCH' ? 'block' : 'hidden lg:block'
        }`}>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-hospital-600" />
              {t('alerts.dispatch_title')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ar' ? 'اختبار إرسال الرسائل التحذيرية التلقائية للزوار' : 'Test automated warning delivery to visitors'}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'رقم الهاتف المتنقل' : 'Mobile Number'}
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'نوع التنبيه' : 'Alert Type'}
              </label>
              <select
                value={alertType}
                onChange={(e) => {
                  const val = e.target.value;
                  setAlertType(val);
                  if (val === 'WARNING_5MIN') {
                    setMessageText(
                      lang === 'ar'
                        ? `عزيزي ${recipientName}،\nتفيدكم إدارة مستشفى السلطان قابوس بأن مدة الزيارة المتبقية هي 5 دقائق. يرجى الاستعداد للمغادرة.\nمنصة وصل – مستشفى السلطان قابوس`
                        : `Dear ${recipientName},\nyour visiting period at Sultan Qaboos Hospital will end in 5 minutes. Please prepare to leave the ward.\nWesal – Sultan Qaboos Hospital`
                    );
                  } else if (val === 'OVERDUE') {
                    setMessageText(
                      lang === 'ar'
                        ? `عزيزي ${recipientName}،\nلقد انتهت المدة المصرح بها لزيارتكم في مستشفى السلطان قابوس. يرجى التوجه إلى بوابة الخروج (CP-07) فوراً. شاكرين حسن تعاونكم.\nمنصة وصل – مستشفى السلطان قابوس`
                        : `Dear ${recipientName},\nyour authorized visiting period has ended. Please proceed to the hospital exit (CP-07). Thank you.\nWesal – Sultan Qaboos Hospital`
                    );
                  }
                }}
                aria-label={lang === 'ar' ? 'نوع التنبيه' : 'Alert Type'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500 bg-white"
              >
                <option value="WARNING_5MIN">{lang === 'ar' ? 'إنذار اقتراب انتهاء الزيارة (5 دقائق)' : '5-Minute Duration Warning'}</option>
                <option value="OVERDUE">{lang === 'ar' ? 'تنبيه تجاوز وقت الزيارة المحدد' : 'Overdue Expiration Alert'}</option>
                <option value="SECURITY_ALERT">{lang === 'ar' ? 'إشعار أمني رسمي' : 'Hospital Security Notice'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {lang === 'ar' ? 'نص رسالة التنبيه' : 'Message Body'}
              </label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
              />
            </div>

            <button
              type="button"
              onClick={() => simulateMutation.mutate()}
              disabled={simulateMutation.isPending}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
              {simulateMutation.isPending
                ? (lang === 'ar' ? 'جارٍ الإرسال...' : 'Sending...')
                : t('alerts.dispatch_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
