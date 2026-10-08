import React, { useState } from 'react';
import { ExamSettings, ExamSession } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Eye, 
  Send, 
  PlusCircle,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

interface LiveMonitoringProps {
  exams: ExamSettings[];
  sessions: ExamSession[];
  selectedExamId: string;
  onSelectExam: (id: string) => void;
  onRefresh: () => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({
  exams,
  sessions,
  selectedExamId,
  onSelectExam,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForLogs, setSelectedStudentForLogs] = useState<ExamSession | null>(null);
  const [sessionToForceSubmit, setSessionToForceSubmit] = useState<ExamSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];
  const examSessions = currentExam ? sessions.filter(s => s.examId === currentExam.id) : [];

  const filteredSessions = examSessions.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentNis.includes(searchQuery) ||
    s.studentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = examSessions.filter(s => s.status === 'in_progress').length;
  const suspendedCount = examSessions.filter(s => s.status === 'suspended').length;
  const submittedCount = examSessions.filter(s => s.status === 'submitted').length;

  const handleUnlockSession = (session: ExamSession) => {
    StorageService.unlockSuspendedSession(session.id);
    onRefresh();
    setSelectedStudentForLogs(null);
    showToast(`Suspensi layar untuk ${session.studentName} berhasil dibuka.`);
  };

  const handleAddExtraTime = (session: ExamSession, minutes: number) => {
    StorageService.addExtraTime(session.id, minutes);
    onRefresh();
    showToast(`Berhasil menambahkan waktu +${minutes} menit untuk ${session.studentName}.`);
  };

  const handleConfirmForceSubmit = () => {
    if (sessionToForceSubmit && currentExam) {
      StorageService.calculateAndSubmitSession(sessionToForceSubmit, currentExam);
      setSessionToForceSubmit(null);
      onRefresh();
      showToast(`Ujian milik ${sessionToForceSubmit.studentName} telah berhasil dikumpulkan.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pengawasan Langsung (Live Proctoring Radar)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau pergerakan siswa di Exam Mode Kiosk secara real-time. Deteksi dini potensi kecurangan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Exam Selector */}
          <select
            value={currentExam?.id}
            onChange={e => onSelectExam(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.code})
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            title="Muat Ulang Status"
            className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview for this exam */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Terdaftar</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{examSessions.length} Siswa</div>
          <span className="text-[11px] text-slate-400">Di ruang ujian</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Sedang Berlangsung</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{activeCount} Siswa</div>
          <span className="text-[11px] text-emerald-600 font-medium">Layar terkunci normal</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Sesi Ditangguhkan</span>
          <div className={`text-2xl font-bold mt-1 ${suspendedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {suspendedCount} Siswa
          </div>
          <span className={`text-[11px] font-medium ${suspendedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {suspendedCount > 0 ? 'Melebihi batas pelanggaran' : 'Aman terkendali'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Sudah Selesai</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{submittedCount} Siswa</div>
          <span className="text-[11px] text-slate-400">Jawaban tersimpan aman</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa, NISN, atau kelas..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Token Ujian: <strong className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{currentExam?.code}</strong>
        </div>
      </div>

      {/* Student Proctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
            Tidak ada siswa ditemukan pada ujian ini.
          </div>
        ) : (
          filteredSessions.map(session => {
            const answeredCount = Object.keys(session.answers).length;
            const totalQuestions = currentExam?.questions.length || 1;
            const progressPct = Math.round((answeredCount / totalQuestions) * 100);
            const violationCount = session.violations.length;
            const isSuspended = session.status === 'suspended';
            const isSubmitted = session.status === 'submitted';

            return (
              <div
                key={session.id}
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isSuspended
                    ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : isSubmitted
                    ? 'border-slate-200 bg-slate-50/30'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {session.studentName}
                      </h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        NISN: {session.studentNis} · Kelas {session.studentClass}
                      </div>
                    </div>

                    {/* Status indicator */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSuspended
                          ? 'bg-rose-100 text-rose-800'
                          : isSubmitted
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSuspended ? 'Terkunci' : isSubmitted ? 'Selesai' : 'Mengerjakan'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 my-3">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Progres Jawaban</span>
                      <span className="font-medium">{answeredCount} dari {totalQuestions} Soal ({progressPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSuspended ? 'bg-rose-500' : isSubmitted ? 'bg-slate-400' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Violations notice */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-b border-slate-100 mb-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldAlert className={`w-3.5 h-3.5 ${violationCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span>Pelanggaran:</span>
                    </span>
                    <button
                      onClick={() => setSelectedStudentForLogs(session)}
                      className={`font-semibold hover:underline flex items-center gap-1 ${
                        violationCount > 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      <span>{violationCount} Kali Tercatat</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Extra time indicator if any */}
                  {session.extraTimeMinutes && session.extraTimeMinutes > 0 ? (
                    <div className="text-[11px] text-blue-700 bg-blue-50 p-1.5 rounded mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Diberi tambahan waktu +{session.extraTimeMinutes} menit</span>
                    </div>
                  ) : null}

                  {/* Score if submitted */}
                  {isSubmitted && session.finalScore !== undefined && (
                    <div className="text-xs text-slate-700 bg-slate-100 p-2 rounded mb-2 flex items-center justify-between">
                      <span>Nilai Akhir:</span>
                      <strong className={`text-sm ${session.isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {session.finalScore} / 100 ({session.isPassed ? 'TUNTAS' : 'BELUM TUNTAS'})
                      </strong>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  {isSuspended && (
                    <button
                      onClick={() => handleUnlockSession(session)}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Suspensi</span>
                    </button>
                  )}

                  {!isSubmitted && (
                    <>
                      <button
                        onClick={() => handleAddExtraTime(session, 5)}
                        title="Tambah 5 menit waktu pengerjaan"
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => setSessionToForceSubmit(session)}
                        title="Paksa kumpulkan ujian"
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                      >
                        Kirim
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedStudentForLogs(session)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded ml-auto"
                    title="Lihat Rincian Audit Log"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Audit Log Modal for a selected student */}
      {selectedStudentForLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Rincian Audit Log Integritas
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStudentForLogs.studentName} ({selectedStudentForLogs.studentNis})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForLogs(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
              {selectedStudentForLogs.violations.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Siswa ini bersih dari catatan pelanggaran selama ujian.</span>
                </div>
              ) : (
                selectedStudentForLogs.violations.map(viol => (
                  <div
                    key={viol.id}
                    className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-rose-800 font-bold">
                      <span className="uppercase">{viol.type.replace('_', ' ')}</span>
                      <span className="font-mono text-[11px] text-slate-600">{viol.formattedTime}</span>
                    </div>
                    <p className="text-slate-700">{viol.description}</p>
                    <div className="text-[11px] text-slate-500">
                      Terjadi saat membuka Soal #{viol.questionNumberAtTime}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedStudentForLogs.status === 'suspended' && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-rose-600 font-medium">Siswa saat ini terkunci di Kiosk Mode.</span>
                <button
                  onClick={() => handleUnlockSession(selectedStudentForLogs)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kunci Layar Siswa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Force Submit Confirmation Modal */}
      {sessionToForceSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Paksa Kumpulkan Ujian?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Yakin ingin mengumpulkan ujian milik <strong>"{sessionToForceSubmit.studentName}"</strong>? Siswa tidak akan dapat mengubah lembar jawaban lagi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSessionToForceSubmit(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmForceSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 text-xs flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
