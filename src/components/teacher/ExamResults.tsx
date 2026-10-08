import React, { useState } from 'react';
import { ExamSettings, ExamSession, Question } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  FileSpreadsheet, 
  Award, 
  BarChart2, 
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

interface ExamResultsProps {
  exams: ExamSettings[];
  sessions: ExamSession[];
  onRefresh: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exams,
  sessions,
  onRefresh,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradingSession, setGradingSession] = useState<ExamSession | null>(null);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [essayFeedbacks, setEssayFeedbacks] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const currentExam = exams.find(e => e.id === selectedExamId) || exams[0];
  const examSessions = currentExam ? sessions.filter(s => s.examId === currentExam.id && s.status === 'submitted') : [];

  const filteredSessions = examSessions.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentNis.includes(searchQuery) ||
    s.studentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const scores = examSessions.map(s => s.finalScore || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passedStudents = examSessions.filter(s => (s.finalScore || 0) >= (currentExam?.kkm || 75)).length;
  const passRate = examSessions.length > 0 ? Math.round((passedStudents / examSessions.length) * 100) : 0;

  // Essay questions in this exam
  const essayQuestions = currentExam?.questions.filter(q => q.type === 'uraian') || [];

  const handleOpenGrading = (session: ExamSession) => {
    setGradingSession(session);
    const initialScores: Record<string, number> = {};
    const initialFeedbacks: Record<string, string> = {};

    essayQuestions.forEach(q => {
      const ans = session.answers[q.id];
      initialScores[q.id] = ans?.scoreAwarded !== undefined ? ans.scoreAwarded : Math.round(q.points * 0.7);
      initialFeedbacks[q.id] = ans?.teacherFeedback || '';
    });

    setEssayScores(initialScores);
    setEssayFeedbacks(initialFeedbacks);
  };

  const handleSaveGrading = () => {
    if (!gradingSession) return;

    essayQuestions.forEach(q => {
      const score = essayScores[q.id] !== undefined ? essayScores[q.id] : 0;
      const feedback = essayFeedbacks[q.id] || '';
      StorageService.gradeEssayAnswer(gradingSession.id, q.id, score, feedback);
    });

    setGradingSession(null);
    onRefresh();
    showToast('Penilaian uraian berhasil disimpan dan nilai akhir diperbarui.');
  };

  const handleExportCSV = () => {
    if (!currentExam) return;

    const headers = [
      'No',
      'Nama Siswa',
      'NISN',
      'Kelas',
      'Status',
      'Nilai Akhir',
      'KKM',
      'Ketuntasan',
      'Jumlah Pelanggaran',
      'Waktu Mulai',
      'Waktu Selesai',
    ];

    const rows = examSessions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      s.studentNis,
      s.studentClass,
      s.status,
      s.finalScore || 0,
      currentExam.kkm,
      s.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
      s.violations.length,
      s.startedAt ? new Date(s.startedAt).toLocaleTimeString('id-ID') : '-',
      s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString('id-ID') : '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_${currentExam.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintBeritaAcara = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Rekapitulasi Hasil & Penilaian Asesmen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar skor siswa, koreksi jawaban uraian, status KKM, dan berita acara ujian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exam selector */}
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.code})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrintBeritaAcara}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Siswa Mengumpulkan</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{examSessions.length} Siswa</div>
          <span className="text-[11px] text-slate-400">Target KKM: {currentExam?.kkm}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Rata-Rata Nilai</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{avgScore}</div>
          <span className="text-[11px] text-slate-400">Skala 0 - 100</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Nilai Tertinggi / Terendah</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {maxScore} <span className="text-sm font-normal text-slate-400">/ {minScore}</span>
          </div>
          <span className="text-[11px] text-slate-400">Sebaran nilai kelas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Ketuntasan KKM</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{passRate}%</div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {passedStudents} dari {examSessions.length} Tuntas
          </span>
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
            placeholder="Cari siswa atau NISN..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Rekap: <strong>{filteredSessions.length} Peserta</strong>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Peserta Didik</th>
                <th className="py-3 px-4">NISN / Kelas</th>
                <th className="py-3 px-4">Waktu Pengerjaan</th>
                <th className="py-3 px-4 text-center">Pelanggaran</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Status KKM</th>
                <th className="py-3 px-4 text-right">Koreksi Esai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data pengerjaan selesai untuk ujian ini.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, idx) => {
                  const hasViolations = session.violations.length > 0;
                  const isPassed = (session.finalScore || 0) >= (currentExam?.kkm || 75);

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{session.studentName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {session.studentNis} · {session.studentClass}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {session.startedAt ? new Date(session.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        {' s/d '}
                        {session.submittedAt ? new Date(session.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            hasViolations ? 'bg-rose-50 text-rose-700' : 'text-slate-500'
                          }`}
                        >
                          {session.violations.length}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-bold text-slate-900">
                          {session.finalScore !== undefined ? session.finalScore : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isPassed ? 'TUNTAS' : 'BELUM TUNTAS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {essayQuestions.length > 0 ? (
                          <button
                            onClick={() => handleOpenGrading(session)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{session.essayGraded ? 'Nilai Ulang' : 'Periksa Esai'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Otomatis</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penilaian Jawaban Uraian / Esai */}
      {gradingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Koreksi Jawaban Uraian & Esai
                </h3>
                <p className="text-xs text-slate-500">
                  {gradingSession.studentName} ({gradingSession.studentNis})
                </p>
              </div>
              <button
                onClick={() => setGradingSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-6 overflow-y-auto flex-1">
              {essayQuestions.map((q, idx) => {
                const answerObj = gradingSession.answers[q.id];
                const studentText = answerObj ? answerObj.value : '(Siswa tidak mengisi jawaban)';

                return (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Soal Uraian #{idx + 1}</span>
                      <span className="text-slate-500">Maksimal: {q.points} Poin</span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">{q.prompt}</p>

                    {q.rubricGuide && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded text-[11px] text-blue-900">
                        <strong>Panduan Rubrik Guru:</strong> {q.rubricGuide}
                      </div>
                    )}

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Jawaban Siswa:
                      </span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {studentText || <span className="italic text-slate-400">Kosong</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Skor Diberikan (0 - {q.points}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={q.points}
                          value={essayScores[q.id] || 0}
                          onChange={e =>
                            setEssayScores({
                              ...essayScores,
                              [q.id]: Math.min(q.points, Math.max(0, Number(e.target.value))),
                            })
                          }
                          className="w-full text-xs font-bold px-3 py-2 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Catatan / Umpan Balik Guru (Opsional):
                        </label>
                        <input
                          type="text"
                          value={essayFeedbacks[q.id] || ''}
                          onChange={e =>
                            setEssayFeedbacks({
                              ...essayFeedbacks,
                              [q.id]: e.target.value,
                            })
                          }
                          placeholder="Penjelasan evaluasi..."
                          className="w-full text-xs px-3 py-2 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGradingSession(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveGrading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Nilai & Perbarui Rapor</span>
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
