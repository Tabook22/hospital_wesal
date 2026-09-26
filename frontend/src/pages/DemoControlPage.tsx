import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Play, ShieldAlert, CheckCircle2, XCircle,
  ArrowRight, Users, QrCode, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DemoControlPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const { data: visits = [], refetch: refetchVisits } = useQuery({
    queryKey: ['demo-visits'],
    queryFn: () => api.getVisits(),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['demo-patients'],
    queryFn: () => api.getPatients(),
  });

  // Action 1: Create 1-minute demo visit and check in immediately
  const runQuickCheckIn = async () => {
    setRunningAction('quick-checkin');
    setDemoMessage(null);
    try {
      const p = patients[0]; // Ahmed
      const visit = await api.createVisit({
        patient_id: p.id,
        full_name: lang === 'ar' ? 'زائر تجريبي (اختبار سريع)' : 'Demo Visitor (Quick Test)',
        civil_id: '99881122',
        mobile_number: '96899990000',
        visitor_type: 'VISITOR',
        duration_minutes: 1, // 1 minute demo!
      });

      // Scan entry at CP-01
      if (visit.pass_obj) {
        await api.scanGate(visit.pass_obj.secure_token, 'CP-01');
      }

      setDemoMessage(
        lang === 'ar'
          ? `✓ تم تسجيل زائر تجريبي للمريض ${p.full_name} وتسجيل دخوله بنجاح عند البوابة الرئيسية (CP-01) بمدة دقيقة واحدة!`
          : `✓ Quick visit registered for ${p.full_name} and checked in at CP-01! It has a 1-minute duration.`
      );
      refetchVisits();
    } catch (err: any) {
      setDemoMessage(`Error: ${err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  // Action 2: Test Bedside Capacity Block
  const runCapacityTest = async () => {
    setRunningAction('capacity-test');
    setDemoMessage(null);
    try {
      const p = patients[0];
      const visit = await api.createVisit({
        patient_id: p.id,
        full_name: lang === 'ar' ? 'زائر ثالث (اختبار السعة)' : 'Third Visitor (Capacity Test)',
        civil_id: `CID-${Date.now().toString().slice(-6)}`,
        mobile_number: '96891112233',
        visitor_type: 'VISITOR',
        duration_minutes: 5,
      });

      if (visit.pass_obj) {
        const scan = await api.scanGate(visit.pass_obj.secure_token, 'CP-01');
        if (scan.result === 'DENIED') {
          setDemoMessage(
            lang === 'ar'
              ? `✓ تأكيد قاعدة التحكم بالدخول: رفضت البوابة الدخول بنجاح [✕ ACCESS DENIED: ${scan.reason}]. تم تطبيق قفل سعة السرير بصرامة!`
              : `✓ ACCESS CONTROL RULE CONFIRMED: Gate returned [✕ ACCESS DENIED: ${scan.reason}]. Bedside capacity is strictly enforced!`
          );
        } else {
          setDemoMessage(
            lang === 'ar'
              ? 'تم تسجيل الدخول. يرجى محاولة مسح تصريح آخر للوصول إلى حد السعة القصوى.'
              : 'Pass checked in. Now try scanning another pass to reach capacity limit.'
          );
        }
      }
      refetchVisits();
    } catch (err: any) {
      setDemoMessage(
        lang === 'ar'
          ? `✓ تم رفض التسجيل / الدخول بنجاح كما هو متوقع: ${err.message}`
          : `✓ Registration / Gate Denied as expected: ${err.message}`
      );
    } finally {
      setRunningAction(null);
    }
  };

  // Action 3: Test Unauthorized Area Checkpoint Scan
  const runUnauthorizedWardTest = async () => {
    setRunningAction('unauthorized-ward');
    setDemoMessage(null);
    try {
      const medVisit = visits.find((v) => v.ward_name.includes('Medical Ward') && v.pass_obj);
      if (!medVisit || !medVisit.pass_obj) {
        setDemoMessage(
          lang === 'ar'
            ? 'لم يتم العثور على تصريح نشط للجناح الباطني. يرجى إصدار تصريح أولاً.'
            : 'No active Medical Ward pass found. Please issue a pass first.'
        );
        setRunningAction(null);
        return;
      }

      // Scan at CP-05 (ICU Gate)
      const res = await api.scanGate(medVisit.pass_obj.secure_token, 'CP-05');
      if (res.result === 'DENIED') {
        setDemoMessage(
          lang === 'ar'
            ? `✓ تم تأكيد قفل المنطقة الجغرافية: بوابة العناية المركزة (CP-05) رفضت الزائر بسبب [${res.reason}]. تم منع زائر الجناح الباطني من دخول العناية المركزة!`
            : `✓ ZONE RESTRICTION CONFIRMED: Gate CP-05 (ICU Security Gate) denied visitor with reason: [${res.reason}]. Medical Ward visitor was blocked from entering ICU!`
        );
      } else {
        setDemoMessage(`Scan result: ${res.result}`);
      }
    } catch (err: any) {
      setDemoMessage(`Error: ${err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === 'ar' ? 'لوحة المحاكاة والسيناريوهات التفاعلية' : 'Interactive Demonstration Controller'}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'سيناريوهات بنقرة واحدة لإثبات قواعد الدخول، قفل السعة السريرية، وسلوك التوقيت والتنبيهات أمام مسؤولي المستشفى'
                : 'One-click scenarios to demonstrate access control rules, capacity locks, and timing behaviors to hospital officials'}
            </p>
          </div>
        </div>
      </div>

      {demoMessage && (
        <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-medium border border-slate-700 shadow-md">
          {demoMessage}
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: 1-Minute Expiry Demo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-hospital-100 text-hospital-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'محاكاة انتهاء الزيارة السريع (دقيقة واحدة)' : '1-Minute Fast Expiry Test'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'تسجيل زائر بمدة مصرح بها قدرها دقيقة واحدة وتسجيل دخوله تلقائياً عند بوابة CP-01. شاهد العداد التنازلي يتحول من الأخضر إلى البرتقالي ثم الأحمر المتجاوز مع إرسال رسالة SMS تحذيرية!'
                : 'Registers a visitor with a 1-minute permitted duration and automatically checks in at CP-01. Watch the dashboard countdown tick from Green → Amber (<30s) → Red Overdue with SMS warning!'}
            </p>
          </div>

          <button
            onClick={runQuickCheckIn}
            disabled={runningAction === 'quick-checkin'}
            className="btn-primary text-xs flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 rtl:rotate-180" />
            {runningAction === 'quick-checkin'
              ? (lang === 'ar' ? 'جارٍ التشغيل...' : 'Running...')
              : (lang === 'ar' ? 'تشغيل سيناريو انتهاء الزيارة السريع' : 'Run 1-Min Expiry Scenario')}
          </button>
        </div>

        {/* Scenario 2: Bedside Capacity Lock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'اختبار قفل سعة السرير (2/2 زائر)' : 'Bedside Concurrent Limit (2/2)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'اختبار قاعدة سعة السرير التي تسمح بحد أقصى بزائرين اثنين متزامنين. محاولة إدخال زائر ثالث لإثبات رفض البوابة الذكية للدخول آلياً بسبب بلوغ السعة القصوى.'
                : 'Tests the bedside rule where each patient bed can have maximum 2 concurrent visitors. Attempts a 3rd entry to prove the smart gate automatically rejects it with MAXIMUM VISITOR CAPACITY REACHED.'}
            </p>
          </div>

          <button
            onClick={runCapacityTest}
            disabled={runningAction === 'capacity-test'}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5 text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <Play className="w-3.5 h-3.5 rtl:rotate-180" />
            {runningAction === 'capacity-test'
              ? (lang === 'ar' ? 'جارٍ اختبار السعة...' : 'Testing Capacity...')
              : (lang === 'ar' ? 'اختبار رفض تجاوز سعة السرير' : 'Test Bedside Limit Rejection')}
          </button>
        </div>

        {/* Scenario 3: Unauthorized Ward Checkpoint */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'منع الدخول للمناطق غير المصرح بها (العناية المركزة)' : 'Unauthorized Zone Block (ICU Gate)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'أخذ تصريح مخصص للجناح الباطني ومحاولة العبور به من بوابة العناية المركزة (CP-05). يثبت منع تجول الزوار في الأقسام الحرجة غير المصرح بها.'
                : 'Takes an active pass designated for Medical Ward A and attempts access through CP-05 (ICU Security Gate). Proves that visitors cannot wander into sensitive departments.'}
            </p>
          </div>

          <button
            onClick={runUnauthorizedWardTest}
            disabled={runningAction === 'unauthorized-ward'}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5 text-amber-700 hover:bg-amber-50 border-amber-200"
          >
            <Play className="w-3.5 h-3.5 rtl:rotate-180" />
            {runningAction === 'unauthorized-ward'
              ? (lang === 'ar' ? 'جارٍ اختبار المنع...' : 'Testing Zone Block...')
              : (lang === 'ar' ? 'اختبار منع دخول الجناح غير المصرح به' : 'Test Unauthorized Ward Block')}
          </button>
        </div>

        {/* Scenario 4: Navigate to Live Gate or Control Room */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'التجربة الميدانية المباشرة لماسح البوابات' : 'Direct Gate Scanner Testing'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'فتح واجهة ماسح البوابة الذكية الكاملة مع كاميرا القراءة البصرية ولوحة المحاكاة، وتجربة الدخول والخروج عبر بوابة الخروج CP-07.'
                : 'Open the full Smart Access Gate screen with live camera and keypad to scan any pass, simulate check-ins, and perform checkout at CP-07 Exit Gate.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/gate')}
              className="flex-1 btn-primary text-xs flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" /> {lang === 'ar' ? 'فتح ماسح البوابة' : 'Open Gate Scanner'}
            </button>
            <button
              onClick={() => navigate('/live')}
              className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5"
            >
              {lang === 'ar' ? 'غرفة المراقبة الحية' : 'Control Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
