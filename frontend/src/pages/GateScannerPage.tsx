import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { soundFX } from '../utils/audio';
import {
  QrCode, Camera, ShieldCheck, ShieldAlert, Sparkles,
  RefreshCw, CheckCircle2, XCircle, ArrowRight, Building, Radio
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanResult, Checkpoint } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const GateScannerPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [selectedCheckpointCode, setSelectedCheckpointCode] = useState<string>('CP-01');
  const [manualToken, setManualToken] = useState<string>('');
  const [isScanningCam, setIsScanningCam] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery<Checkpoint[]>({
    queryKey: ['checkpoints'],
    queryFn: () => api.getCheckpoints(),
  });

  // Fetch active passes for instant quick-testing
  const { data: activeVisits = [], refetch: refetchVisits } = useQuery({
    queryKey: ['active-visits-scanner'],
    queryFn: () => api.getVisits(),
    refetchInterval: 5000,
  });

  const selectedCheckpoint = checkpoints.find((c) => c.code === selectedCheckpointCode) || {
    id: 1,
    code: 'CP-01',
    name: 'Main Entrance Smart Gate',
    checkpoint_type: 'ENTRY_GATE',
    is_active: true,
  };

  // Perform Gate Scan
  const handleProcessScan = async (tokenVal: string) => {
    if (!tokenVal.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.scanGate(tokenVal.trim(), selectedCheckpointCode);
      setScanResult(res);

      if (res.result === 'GRANTED') {
        soundFX.playGranted();
      } else {
        soundFX.playDenied();
      }

      refetchVisits();
    } catch (err: any) {
      const errorResult: ScanResult = {
        result: 'DENIED',
        reason: 'SYSTEM SCAN ERROR',
        message: err.message || 'Verification failed',
        checkpoint_code: selectedCheckpointCode,
        checkpoint_name: selectedCheckpoint.name,
        scan_time: new Date().toISOString(),
        is_checkout: false,
      };
      setScanResult(errorResult);
      soundFX.playDenied();
    } finally {
      setIsSubmitting(false);
      setManualToken('');
    }
  };

  // Camera start/stop toggle
  const toggleCameraScanner = async () => {
    if (isScanningCam) {
      if (qrScannerRef.current) {
        try {
          await qrScannerRef.current.stop();
          qrScannerRef.current.clear();
        } catch (e) {
          console.error(e);
        }
      }
      setIsScanningCam(false);
    } else {
      setIsScanningCam(true);
      setTimeout(async () => {
        try {
          const html5Qr = new Html5Qrcode('qr-reader-video');
          qrScannerRef.current = html5Qr;
          await html5Qr.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleProcessScan(decodedText);
            },
            () => {}
          );
        } catch (err) {
          console.error('Camera access error', err);
          setIsScanningCam(false);
          alert('Camera could not be started. You can use manual entry or click the Quick Test passes below!');
        }
      }, 200);
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Gate Header & Checkpoint Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-hospital-300 uppercase tracking-wider">
              {lang === 'ar' ? 'بوابة وصل الذكية' : 'WESAL Smart Access Gate'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">{t('gate.title')}</h1>
          <p className="text-xs text-slate-400">
            {t('gate.subtitle')}
          </p>
        </div>

        {/* Checkpoint Location Switcher */}
        <div className="bg-slate-800 p-2 sm:p-2.5 rounded-xl border border-slate-700 flex items-center gap-2 w-full sm:w-auto">
          <Building className="w-4 h-4 text-hospital-400 shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('gate.current_cp')}</span>
            <select
              value={selectedCheckpointCode}
              onChange={(e) => {
                setSelectedCheckpointCode(e.target.value);
                setScanResult(null);
              }}
              aria-label={t('gate.current_cp')}
              className="bg-transparent text-xs sm:text-sm font-bold text-white border-none focus:ring-0 p-0 pr-6 cursor-pointer truncate"
            >
              {checkpoints.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanning Interface & Live Feedback (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scan Feedback Banner when a pass is scanned */}
          {scanResult && (
            <div
              className={`rounded-2xl p-6 border-2 shadow-xl transition-all duration-300 ${
                scanResult.result === 'GRANTED'
                  ? 'bg-emerald-950/20 border-emerald-500 text-emerald-900'
                  : 'bg-rose-950/20 border-rose-500 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    scanResult.result === 'GRANTED' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {scanResult.result === 'GRANTED' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xl font-black tracking-tight ${
                        scanResult.result === 'GRANTED' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {scanResult.result === 'GRANTED'
                        ? scanResult.is_checkout
                          ? t('gate.checkout_granted')
                          : t('gate.granted')
                        : t('gate.denied')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(scanResult.scan_time).toLocaleTimeString()}
                    </span>
                  </div>

                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      scanResult.result === 'GRANTED' ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {scanResult.reason || scanResult.message}
                  </p>
                </div>
              </div>

              {/* Detail fields if recognized */}
              {scanResult.visitor_name && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-500 block">{lang === 'ar' ? 'الزائر:' : 'Visitor:'}</span>
                    <span className="font-bold text-slate-900">{scanResult.visitor_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{lang === 'ar' ? 'المريض:' : 'Patient:'}</span>
                    <span className="font-bold text-slate-900">{scanResult.patient_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{lang === 'ar' ? 'الوجهة المصرح بها:' : 'Authorized Destination:'}</span>
                    <span className="font-bold text-hospital-700">
                      {scanResult.destination_ward} ({scanResult.destination_room})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{lang === 'ar' ? 'البوابة / الموقع:' : 'Gate / Location:'}</span>
                    <span className="font-bold text-slate-800">{scanResult.checkpoint_name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Central Camera / Optical Reader Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                <Camera className="w-4 h-4 text-hospital-600" />
                {t('gate.camera_title')}
              </span>
              <button
                type="button"
                onClick={toggleCameraScanner}
                className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                  isScanningCam
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                    : 'bg-hospital-50 text-hospital-700 border-hospital-300 hover:bg-hospital-100'
                }`}
              >
                {isScanningCam ? t('gate.camera_stop') : t('gate.camera_start')}
              </button>
            </div>

            {/* Video Preview Area */}
            <div className="relative w-full max-w-sm mx-auto h-64 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-300">
              <div id="qr-reader-video" className="w-full h-full" />
              {!isScanningCam && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 mb-2">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{t('gate.scan_prompt')}</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('gate.scan_hint')}
                  </p>
                </div>
              )}
            </div>

            {/* Manual Token / Pass Entry Form */}
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessScan(manualToken);
                }}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder={t('gate.manual_placeholder')}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-hospital-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !manualToken.trim()}
                  className="btn-primary text-xs px-4"
                >
                  {t('gate.verify_btn')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Demo Keypad & Active Passes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {t('gate.quick_keypad')}
                </h3>
                <p className="text-[11px] text-slate-500">{t('gate.quick_keypad_desc')}</p>
              </div>
              <button
                onClick={() => refetchVisits()}
                className="text-[11px] text-hospital-600 hover:underline font-semibold"
              >
                {t('btn.refresh')}
              </button>
            </div>

            {/* Active Passes List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {activeVisits.slice(0, 10).map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    const token = v.pass_obj?.secure_token || v.pass_obj?.pass_code || '';
                    handleProcessScan(token);
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-hospital-500 hover:bg-hospital-50/40 cursor-pointer transition-all text-left rtl:text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {v.pass_obj?.pass_code || v.visit_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        v.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-700'
                          : v.status === 'ENDING_SOON'
                          ? 'bg-amber-100 text-amber-700'
                          : v.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.status === 'ACTIVE' ? t('status.active') :
                       v.status === 'ENDING_SOON' ? t('status.ending_soon') :
                       v.status === 'OVERDUE' ? t('status.overdue') :
                       v.status === 'CHECKED_OUT' ? t('status.checked_out') : v.status}
                    </span>
                  </div>

                  <div className="mt-1 text-xs">
                    <span className="font-semibold text-slate-900">{v.visitor_name}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="text-slate-600">{v.patient_name}</span>
                  </div>

                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>{lang === 'ar' ? `الجناح: ${v.ward_name}` : `Ward: ${v.ward_name}`}</span>
                    <span className="text-hospital-700 font-semibold flex items-center gap-0.5">
                      {lang === 'ar' ? 'محاكاة المسح' : 'Simulate Scan'} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fake Invalid QR test button */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => handleProcessScan('INVALID-QR-FAKE-TOKEN')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold"
              >
                {t('gate.test_invalid')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
