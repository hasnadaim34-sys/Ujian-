import React, { useState } from 'react';
import { User, ExamSettings, ExamSession } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  KeyRound, 
  ArrowRight, 
  Clock, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  exams: ExamSettings[];
  sessions: ExamSession[];
  onStartExamFlow: (exam: ExamSettings) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  exams,
  sessions,
  onStartExamFlow,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!tokenInput.trim()) {
      setErrorMessage('Silakan masukkan token / kode ujian');
      return;
    }

    const matchedExam = StorageService.getExamByCode(tokenInput);
    if (!matchedExam) {
      setErrorMessage(`Kode ujian "${tokenInput.toUpperCase()}" tidak ditemukan. Pastikan huruf dan angka sesuai.`);
      return;
    }

    onStartExamFlow(matchedExam);
  };

  // Find sessions for this student
  const studentSessions = sessions.filter(s => s.studentId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Student Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Kelas {currentUser.classGroup}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
              <span>NISN: <strong className="font-mono text-slate-700">{currentUser.identifier}</strong></span>
              <span>·</span>
              <span>{currentUser.schoolName}</span>
              <span>·</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Status Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Quick Token Entry Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-sm w-full">
          <form onSubmit={handleTokenSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Masukkan Kode / Token Ujian
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value.toUpperCase())}
                placeholder="CONTOH: SIMAS-IPA-2026"
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs transition-colors"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-rose-600 font-medium">{errorMessage}</p>
            )}
          </form>
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ujian & Asesmen Tersedia</h3>
            <p className="text-xs text-slate-500">Pilih ujian yang telah dijadwalkan oleh guru pengampu Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => {
            const session = studentSessions.find(s => s.examId === exam.id);
            const isCompleted = session?.status === 'submitted';
            const isInProgress = session?.status === 'in_progress';
            const isSuspended = session?.status === 'suspended';

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                      TOKEN: {exam.code}
                    </span>
                    {isCompleted ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sudah Selesai
                      </span>
                    ) : isSuspended ? (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        Terkunci / Ditangguhkan
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded animate-pulse">
                        Sedang Mengerjakan
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Siap Dikerjakan
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">{exam.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{exam.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mata Pelajaran</span>
                      <strong className="text-slate-800">{exam.subject}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Durasi & KKM</span>
                      <strong className="text-slate-800">{exam.durationMinutes} Menit · KKM {exam.kkm}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Jumlah Soal</span>
                      <strong className="text-slate-800">{exam.questions.length} Butir Soal</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Proteksi</span>
                      <strong className="text-slate-800">Exam Mode Kiosk</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isCompleted ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs">
                        <span className="text-slate-500">Nilai Anda: </span>
                        {exam.releaseResultsImmediately ? (
                          <strong className={`font-bold ${session?.isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {session?.finalScore} / 100 ({session?.isPassed ? 'TUNTAS' : 'BELUM TUNTAS'})
                          </strong>
                        ) : (
                          <span className="text-slate-600 italic">Menunggu Evaluasi Guru</span>
                        )}
                      </div>
                      <button
                        onClick={() => onStartExamFlow(exam)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Lihat Rincian →
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartExamFlow(exam)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>{isInProgress ? 'Lanjutkan Pengerjaan Ujian' : 'Masuk ke Halaman Petunjuk'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Rules and Security Notice */}
      <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Ketentuan Integritas Ujian Kiosk:</span>
          <p className="text-[11px] leading-relaxed text-blue-800">
            Aplikasi ini mendeteksi upaya meninggalkan jendela ujian (berpindah tab, meminimalisir layar, atau keluar mode layar penuh). Jawaban Anda akan tersimpan otomatis secara berkala (Autosave). Harap tidak menyentuh tombol pintas atau membuka jendela lain hingga selesai menekan tombol Kirim.
          </p>
        </div>
      </div>
    </div>
  );
};
