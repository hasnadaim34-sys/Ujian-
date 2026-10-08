import React, { useState, useEffect } from 'react';
import { User, ExamSettings, ExamSession } from '../../types/exam';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Maximize2, 
  Wifi, 
  Laptop, 
  UserCheck, 
  ArrowLeft,
  Lock
} from 'lucide-react';

interface ExamInstructionProps {
  currentUser: User;
  exam: ExamSettings;
  session?: ExamSession;
  onBack: () => void;
  onStartExam: () => void;
}

export const ExamInstruction: React.FC<ExamInstructionProps> = ({
  currentUser,
  exam,
  session,
  onBack,
  onStartExam,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isResuming = session && session.status === 'in_progress';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in py-2">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda Siswa</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            <span>Petunjuk Pelaksanaan Asesmen</span>
            <span>·</span>
            <span>{exam.subject}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {exam.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 mt-2 font-mono">
            <span>TOKEN: {exam.code}</span>
            <span>·</span>
            <span>DURASI: {exam.durationMinutes} MENIT</span>
            <span>·</span>
            <span>TARGET KKM: {exam.kkm}</span>
            <span>·</span>
            <span>JUMLAH: {exam.questions.length} SOAL</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity Verification Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Verifikasi Data Peserta Ujian</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">NISN Siswa</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.identifier}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rombel / Kelas</span>
                <span className="font-bold text-slate-900">{currentUser.classGroup || 'IX-A'}</span>
              </div>
            </div>
          </div>

          {/* Device & Environment Readiness Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Kesiapan Perangkat & Sistem Ujian</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-lg flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-950">Mode Fullscreen</div>
                  <div className="text-[11px] text-emerald-800">Didukung oleh peramban</div>
                </div>
              </div>

              <div className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                isOnline
                  ? 'bg-emerald-50/70 border-emerald-200/70'
                  : 'bg-rose-50/70 border-rose-200/70'
              }`}>
                <Wifi className={`w-4 h-4 shrink-0 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`} />
                <div>
                  <div className={`font-bold ${isOnline ? 'text-emerald-950' : 'text-rose-950'}`}>
                    {isOnline ? 'Koneksi Online' : 'Koneksi Terputus'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {isOnline ? 'Autosave sinkron server' : 'Mode offline aktif'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-lg flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold text-blue-950">Kiosk Protector</div>
                  <div className="text-[11px] text-blue-800">Maks. toleransi {exam.maxViolations}x</div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Rules of Integrity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Tata Tertib & Protokol Integritas Ujian</span>
            </h3>

            <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 text-xs text-slate-700 space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600 shrink-0">1.</span>
                <span>
                  <strong>Layar Penuh Otomatis (Fullscreen):</strong> Ketika Anda menekan tombol "Mulai Ujian", layar akan otomatis masuk ke mode layar penuh. Dilarang menekan tombol Escape atau keluar dari layar penuh.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600 shrink-0">2.</span>
                <span>
                  <strong>Deteksi Perpindahan Halaman:</strong> Sistem menggunakan Page Visibility & Focus Detection. Setiap kali Anda berpindah tab, membuka jendela lain, atau membuka aplikasi di latar belakang, <strong>insiden akan langsung tercatat di log audit guru pengawas</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600 shrink-0">3.</span>
                <span>
                  <strong>Batas Pelanggaran:</strong> Jika Anda melakukan pelanggaran sebanyak <strong>{exam.maxViolations} kali</strong>, ujian akan <strong>DITANGGUHKAN/DIKUNCI</strong> dan Anda wajib melapor ke guru pengawas untuk verifikasi PIN pembuka.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600 shrink-0">4.</span>
                <span>
                  <strong>Autosave Real-Time:</strong> Seluruh jawaban yang Anda pilih atau ketik disimpan seketika. Jawaban tidak akan hilang meskipun terjadi kendala jaringan.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600 shrink-0">5.</span>
                <span>
                  <strong>Privasi Terjamin:</strong> Sistem ujian ini aman, tidak mengakses kamera atau mikrofon tanpa izin, dan hanya memantau fokus jendela peramban.
                </span>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-xs text-slate-800 leading-relaxed">
              Saya menyatakan bahwa saya telah membaca, memahami seluruh tata tertib di atas, dan bersedia mengerjakan ujian ini secara jujur dan mandiri.
            </span>
          </label>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={async () => {
                try {
                  const docEl = document.documentElement as any;
                  if (docEl.requestFullscreen) {
                    await docEl.requestFullscreen();
                  } else if (docEl.webkitRequestFullscreen) {
                    await docEl.webkitRequestFullscreen();
                  } else if (docEl.mozRequestFullScreen) {
                    await docEl.mozRequestFullScreen();
                  } else if (docEl.msRequestFullscreen) {
                    await docEl.msRequestFullscreen();
                  }
                } catch (err) {
                  // If running in restricted iframe or sandbox, continue gracefully
                  console.warn('Mode layar penuh dibatasi oleh peramban atau iframe:', err);
                }
                onStartExam();
              }}
              disabled={!agreed}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                agreed
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Maximize2 className="w-5 h-5" />
              <span>
                {isResuming ? 'LANJUTKAN PENGERJAAN UJIAN (FULLSCREEN)' : 'MULAI UJIAN SEKARANG (MASUK KIOSK FULLSCREEN)'}
              </span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Menekan tombol ini akan mengaktifkan mode layar penuh (Fullscreen) dan memicu pemantauan integritas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
