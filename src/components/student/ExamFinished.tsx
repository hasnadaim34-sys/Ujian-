import React from 'react';
import { User, ExamSettings, ExamSession } from '../../types/exam';
import { 
  CheckCircle2, 
  Award, 
  Clock, 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  FileCheck2, 
  ShieldCheck, 
  AlertCircle,
  XCircle
} from 'lucide-react';

interface ExamFinishedProps {
  currentUser: User;
  exam: ExamSettings;
  session: ExamSession;
  onBackToHome: () => void;
}

export const ExamFinished: React.FC<ExamFinishedProps> = ({
  currentUser,
  exam,
  session,
  onBackToHome,
}) => {
  const isReleased = exam.releaseResultsImmediately;
  const isPassed = session.isPassed;
  const finalScore = session.finalScore ?? 0;
  
  // Format submission time
  const submitTimeStr = session.submittedAt
    ? new Date(session.submittedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    : '-';

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in">
      {/* Success Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded uppercase tracking-wider">
            Ujian Telah Selesai Dikerjakan
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Jawaban Berhasil Terkirim!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
            Terima kasih, <strong>{currentUser.name}</strong>. Seluruh lembar jawaban Anda telah diterima dan diarsipkan dengan aman oleh server ujian.
          </p>
        </div>

        {/* Recap Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Waktu Selesai</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{submitTimeStr}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Soal</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{exam.questions.length} Butir</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Soal Terjawab</span>
            <span className="font-bold text-blue-700 text-xs sm:text-sm">{Object.keys(session.answers).length} Butir</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Integritas</span>
            <span className={`font-bold text-xs sm:text-sm ${session.violations.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {session.violations.length === 0 ? 'Tertib (0 Pelanggaran)' : `${session.violations.length}x Pelanggaran`}
            </span>
          </div>
        </div>

        {/* Score section IF released */}
        {isReleased ? (
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center space-y-2 mt-4">
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Nilai Perolehan Ujian
            </div>
            <div className="text-5xl font-extrabold text-blue-900 tracking-tight">
              {finalScore}
              <span className="text-lg font-medium text-blue-600"> / 100</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-xs text-slate-600 font-medium">KKM: {exam.kkm}</span>
              <span className="text-slate-300">·</span>
              <span
                className={`font-bold text-xs px-2.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {isPassed ? 'TUNTAS KOMPETENSI' : 'BELUM TUNTAS'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Hasil Nilai Ditahan:</strong> Guru pengampu mengunci pengumuman nilai langsung untuk pemeriksaan manual soal uraian. Hasil akhir akan diumumkan kemudian.
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onBackToHome}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Asesmen</span>
          </button>
        </div>
      </div>

      {/* Review Questions Section if Released */}
      {isReleased && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Pembahasan & Tinjauan Butir Soal</span>
            </h3>
            <span className="text-xs text-slate-500">Evaluasi Mandiri</span>
          </div>

          <div className="space-y-4">
            {exam.questions.map((q, idx) => {
              const studentAns = session.answers[q.id];
              const scoreAwarded = studentAns?.scoreAwarded;

              return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Soal #{idx + 1} ({q.type.toUpperCase()})</span>
                    <span className="font-semibold text-slate-700">
                      Poin: {scoreAwarded !== undefined ? scoreAwarded : 0} / {q.points}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">{q.prompt}</p>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jawaban Anda:</span>
                    <div className="font-semibold mt-0.5">
                      {q.type === 'bs' 
                        ? JSON.stringify(studentAns?.value || {})
                        : String(studentAns?.value || '(Kosong)')}
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg text-blue-900 text-[11px]">
                      <strong>Pembahasan:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
