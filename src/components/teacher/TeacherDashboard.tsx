import React from 'react';
import { ExamSettings, ExamSession, User } from '../../types/exam';
import { 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Play, 
  PlusCircle, 
  BarChart3, 
  Lock
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: User;
  exams: ExamSettings[];
  sessions: ExamSession[];
  onNavigateTab: (tab: 'dashboard' | 'exams' | 'questions' | 'live' | 'results' | 'audit') => void;
  onSelectExamForLive: (examId: string) => void;
  onCreateExam: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  exams,
  sessions,
  onNavigateTab,
  onSelectExamForLive,
  onCreateExam,
}) => {
  // Aggregate statistics
  const totalExams = exams.length;
  const totalSubmissions = sessions.filter(s => s.status === 'submitted').length;
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;
  const suspendedSessions = sessions.filter(s => s.status === 'suspended').length;
  
  // Total violations across all sessions
  const totalViolations = sessions.reduce((acc, s) => acc + s.violations.length, 0);

  // Calculate average score for submitted sessions
  const submittedWithScores = sessions.filter(s => s.status === 'submitted' && s.finalScore !== undefined);
  const averageScore = submittedWithScores.length > 0
    ? Math.round(submittedWithScores.reduce((sum, s) => sum + (s.finalScore || 0), 0) / submittedWithScores.length)
    : 0;

  // Passing rate
  const passedCount = submittedWithScores.filter(s => s.isPassed).length;
  const passRate = submittedWithScores.length > 0 ? Math.round((passedCount / submittedWithScores.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Panel Kendali Asesmen Digital</span>
            <span>·</span>
            <span>{currentUser.schoolName}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Selamat Datang, {currentUser.name}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
            Kelola ujian daring terproteksi, bank soal kurikulum, pengawasan kiosk real-time, dan audit integritas peserta dengan standar keamanan asesmen nasional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onCreateExam}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Ujian Baru</span>
          </button>
          <button
            onClick={() => onNavigateTab('live')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-950 hover:bg-blue-50 font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            <Play className="w-4 h-4 text-blue-600" />
            <span>Pantau Ujian Langsung</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Ujian Aktif</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalExams}</div>
          <div className="text-xs text-slate-500 mt-1">Tersedia untuk siswa</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sedang Mengerjakan</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{inProgressSessions}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Siswa aktif di Kiosk Mode</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pelanggaran Terdeteksi</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalViolations}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            {suspendedSessions > 0 ? `${suspendedSessions} sesi terkunci` : 'Audit log tercatat'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Rata-Rata Nilai</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{averageScore || '-'}</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            Ketuntasan KKM: {passRate}%
          </div>
        </div>
      </div>

      {/* Main Grid: Active Exams and Live Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Exams list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Daftar Paket Ujian & Asesmen</h2>
              <p className="text-xs text-slate-500">Ujian yang siap atau sedang dikerjakan siswa</p>
            </div>
            <button
              onClick={() => onNavigateTab('exams')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {exams.map(exam => {
              const examSessions = sessions.filter(s => s.examId === exam.id);
              const submittedCount = examSessions.filter(s => s.status === 'submitted').length;
              const activeCount = examSessions.filter(s => s.status === 'in_progress').length;
              const suspendedCount = examSessions.filter(s => s.status === 'suspended').length;

              return (
                <div key={exam.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 text-xs px-2 py-0.5 rounded font-mono">
                          TOKEN: {exam.code}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{exam.gradeLevel}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-500">{exam.subject}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-base">{exam.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1">{exam.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span>Durasi: <strong className="text-slate-700">{exam.durationMinutes} menit</strong></span>
                        <span>·</span>
                        <span>KKM: <strong className="text-slate-700">{exam.kkm}</strong></span>
                        <span>·</span>
                        <span>Total Soal: <strong className="text-slate-700">{exam.questions.length} Butir</strong></span>
                        <span>·</span>
                        <span>Maks Pelanggaran: <strong className="text-slate-700">{exam.maxViolations}x</strong></span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        {suspendedCount > 0 && (
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {suspendedCount} Ditangguhkan
                          </span>
                        )}
                        <span className="text-xs text-slate-600">
                          {activeCount} Mengerjakan · {submittedCount} Selesai
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => {
                            onSelectExamForLive(exam.id);
                            onNavigateTab('live');
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-md transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Monitor</span>
                        </button>
                        <button
                          onClick={() => onNavigateTab('results')}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-md transition-colors"
                        >
                          Hasil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Live Integrity Radar & Quick Actions */}
        <div className="space-y-6">
          {/* Security Alert Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Status Integritas Kiosk</h3>
              </div>
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sistem Aktif
              </span>
            </div>

            <div className="py-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Sesi Terkunci / Ditangguhkan:</span>
                <span className={`font-bold ${suspendedSessions > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {suspendedSessions} Siswa
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Siswa Aktif Terpantau:</span>
                <span className="font-bold text-slate-900">{inProgressSessions} Siswa</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Pelanggaran Tercatat:</span>
                <span className="font-bold text-slate-900">{totalViolations} Insiden</span>
              </div>
            </div>

            {suspendedSessions > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Ada siswa yang melebihi batas toleransi!
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Siswa tidak dapat melanjutkan sampai pengawas/guru memasukkan PIN atau membuka suspensi dari panel Live Monitoring.
                </p>
                <button
                  onClick={() => onNavigateTab('live')}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-xs text-center transition-colors"
                >
                  Buka Pengawasan Langsung
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Seluruh ujian berjalan tertib tanpa siswa yang tertahan.</span>
              </div>
            )}

            <button
              onClick={() => onNavigateTab('audit')}
              className="w-full mt-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Buka Seluruh Audit Log Integritas</span>
              <span>→</span>
            </button>
          </div>

          {/* Quick PIN Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>PIN Pengawas Default Ujian</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              PIN ini digunakan untuk membuka kunci jika ujian siswa ditangguhkan di perangkat mereka:
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-white px-2.5 py-1 border border-slate-300 rounded text-slate-900">
                1234
              </span>
              <span className="text-[11px] text-slate-500">(Bisa disesuaikan pada Pengaturan Ujian)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
