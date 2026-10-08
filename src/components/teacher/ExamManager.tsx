import React, { useState } from 'react';
import { ExamSettings, Question, ViolationAction } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  KeyRound, 
  BookOpen, 
  Shuffle, 
  Lock, 
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';

interface ExamManagerProps {
  exams: ExamSettings[];
  questionBank: Question[];
  onRefresh: () => void;
  onSelectExamForLive: (examId: string) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  exams,
  questionBank,
  onRefresh,
  onSelectExamForLive,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Ilmu Pengetahuan Alam');
  const [gradeLevel, setGradeLevel] = useState('IX (Sembilan)');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [kkm, setKkm] = useState(75);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [releaseResultsImmediately, setReleaseResultsImmediately] = useState(true);
  const [maxViolations, setMaxViolations] = useState(3);
  const [violationAction, setViolationAction] = useState<ViolationAction>('suspend');
  const [proctorPin, setProctorPin] = useState('1234');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(res);
  };

  const handleOpenCreate = () => {
    setEditingExamId(null);
    setTitle('');
    setSubject('Ilmu Pengetahuan Alam');
    setGradeLevel('IX (Sembilan)');
    generateRandomCode();
    setDescription('Kerjakan dengan jujur dan teliti. Seluruh perpindahan jendela dan aktivitas mencurigakan diawasi.');
    setDurationMinutes(60);
    setKkm(75);
    setShuffleQuestions(false);
    setShuffleOptions(true);
    setReleaseResultsImmediately(true);
    setMaxViolations(3);
    setViolationAction('suspend');
    setProctorPin('1234');
    setSelectedQuestionIds(questionBank.map(q => q.id)); // default select all
    setIsEditing(true);
  };

  const handleOpenEdit = (exam: ExamSettings) => {
    setEditingExamId(exam.id);
    setTitle(exam.title);
    setSubject(exam.subject);
    setGradeLevel(exam.gradeLevel);
    setCode(exam.code);
    setDescription(exam.description);
    setDurationMinutes(exam.durationMinutes);
    setKkm(exam.kkm);
    setShuffleQuestions(exam.shuffleQuestions);
    setShuffleOptions(exam.shuffleOptions);
    setReleaseResultsImmediately(exam.releaseResultsImmediately);
    setMaxViolations(exam.maxViolations);
    setViolationAction(exam.violationAction);
    setProctorPin(exam.proctorPin);
    setSelectedQuestionIds(exam.questions.map(q => q.id));
    setIsEditing(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      alert('Judul dan Kode Ujian wajib diisi');
      return;
    }

    const assignedQuestions = questionBank.filter(q => selectedQuestionIds.includes(q.id));
    if (assignedQuestions.length === 0) {
      alert('Pilih minimal 1 butir soal untuk dimasukkan ke dalam paket ujian!');
      return;
    }

    const now = new Date();
    const examData: ExamSettings = {
      id: editingExamId || `exam-${Date.now()}`,
      title: title.trim(),
      code: code.trim().toUpperCase(),
      subject,
      gradeLevel,
      description,
      durationMinutes: Number(durationMinutes),
      kkm: Number(kkm),
      startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      shuffleQuestions,
      shuffleOptions,
      releaseResultsImmediately,
      maxViolations: Number(maxViolations),
      violationAction,
      proctorPin: proctorPin.trim() || '1234',
      questions: assignedQuestions,
      createdAt: editingExamId ? (StorageService.getExamById(editingExamId)?.createdAt || now.toISOString()) : now.toISOString(),
      updatedAt: now.toISOString(),
    };

    StorageService.saveExam(examData);
    setFormSuccessMessage('Paket Ujian berhasil disimpan!');
    setTimeout(() => {
      setFormSuccessMessage('');
      setIsEditing(false);
      onRefresh();
    }, 1000);
  };

  const handleDeleteExam = (id: string, examTitle: string) => {
    if (confirm(`Hapus paket ujian "${examTitle}"? Data hasil dan sesi yang terkait akan ikut dihapus.`)) {
      StorageService.deleteExam(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Paket Ujian</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur jadwal, token akses, durasi, KKM, serta parameter keamanan Kiosk Mode.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket Ujian Baru</span>
          </button>
        )}
      </div>

      {/* Editor Modal / Panel */}
      {isEditing && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingExamId ? 'Ubah Pengaturan Paket Ujian' : 'Buat Paket Ujian & Asesmen Baru'}
              </h3>
              <p className="text-xs text-slate-500">Konfigurasi lengkap aturan ujian dan keamanan kiosk</p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveExam} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Ujian / Asesmen *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Asesmen Sumatif Akhir Semester: IPA"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode / Token Ujian (PIN Akses) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: PAS-IPA"
                    className="w-full font-mono font-bold text-sm px-3.5 py-2 rounded-lg border border-slate-300 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/30"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    title="Acak Token"
                    className="px-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
                  >
                    Acak
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Kelas / Rombel
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  placeholder="Contoh: IX (Sembilan)"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Pengerjaan (Menit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 shrink-0">menit</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai KKM (Kriteria Ketuntasan)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={kkm}
                  onChange={e => setKkm(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pengacakan Urutan
                </label>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={e => setShuffleQuestions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Acak Nomor Soal Tiap Siswa</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={e => setShuffleOptions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Acak Pilihan Jawaban (A, B, C, D)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterbukaan Nilai
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={releaseResultsImmediately}
                    onChange={e => setReleaseResultsImmediately(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Tampilkan Skor & Pembahasan Langsung ke Siswa setelah Kirim</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Jika tidak dicentang, siswa hanya melihat tanda telah selesai.
                </p>
              </div>
            </div>

            {/* Exam Mode / Kiosk Security Settings Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Integritas & Kiosk Mode (Anti-Curang)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Batas Maksimal Pelanggaran
                  </label>
                  <select
                    value={maxViolations}
                    onChange={e => setMaxViolations(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={1}>1 Kali (Sangat Ketat)</option>
                    <option value={2}>2 Kali (Ketat)</option>
                    <option value={3}>3 Kali (Standar Rekomendasi)</option>
                    <option value={5}>5 Kali (Toleransi Tinggi)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hitungan meninggalkan tab / keluar fullscreen / copy-paste.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tindakan Saat Melebihi Batas
                  </label>
                  <select
                    value={violationAction}
                    onChange={e => setViolationAction(e.target.value as ViolationAction)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="suspend">Tangguhkan Ujian (Butuh PIN Pengawas)</option>
                    <option value="auto_submit">Kirim Otomatis Jawaban Apa Adanya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PIN Pengawas Pembuka Suspensi
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      value={proctorPin}
                      onChange={e => setProctorPin(e.target.value)}
                      placeholder="1234"
                      className="w-full font-mono text-center font-bold text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    PIN rahasia guru untuk membuka layar siswa yang terkunci.
                  </p>
                </div>
              </div>
            </div>

            {/* Select Questions from Bank */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Pilih Butir Soal dari Bank Soal ({selectedQuestionIds.length} dipilih)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Centang soal yang ingin dimasukkan ke dalam paket ujian ini.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuestionIds(questionBank.map(q => q.id))}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuestionIds([])}
                    className="text-xs font-medium text-slate-500 hover:underline"
                  >
                    Batal Semua
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                {questionBank.map((q, idx) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-100 transition-colors ${
                        isChecked ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                          } else {
                            setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                          }
                        }}
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-700">Soal #{idx + 1}</span>
                          <span className="text-[10px] uppercase font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {q.type.toUpperCase()}
                          </span>
                          <span className="text-slate-500 font-medium">({q.points} Poin)</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{q.subject}</span>
                        </div>
                        <p className="text-slate-800 line-clamp-2">{q.prompt}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Paket Ujian</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map(exam => (
          <div
            key={exam.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                  TOKEN: {exam.code}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    title="Ubah Pengaturan"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id, exam.title)}
                    title="Hapus Ujian"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1">{exam.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{exam.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg mb-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mata Pelajaran</span>
                  <span className="font-semibold text-slate-800">{exam.subject}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tingkat / Kelas</span>
                  <span className="font-semibold text-slate-800">{exam.gradeLevel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Durasi & KKM</span>
                  <span className="font-semibold text-slate-800">{exam.durationMinutes} Menit · KKM {exam.kkm}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Butir Soal</span>
                  <span className="font-semibold text-slate-800">{exam.questions.length} Soal</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Maks Pelanggaran: <strong>{exam.maxViolations}x</strong></span>
                <span>·</span>
                <span>PIN: <strong className="font-mono">{exam.proctorPin}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {exam.releaseResultsImmediately ? 'Hasil Langsung Rilis' : 'Hasil Ditahan'}
              </span>
              <button
                onClick={() => onSelectExamForLive(exam.id)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Buka Pengawasan</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
