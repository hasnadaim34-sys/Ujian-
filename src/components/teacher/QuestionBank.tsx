import React, { useState } from 'react';
import { Question, QuestionType, MultipleChoiceOption, TrueFalseStatement } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Check, 
  X,
  FileCheck2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface QuestionBankProps {
  questionBank: Question[];
  onRefresh: () => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questionBank,
  onRefresh,
}) => {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<QuestionType>('pg');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState(10);
  const [subject, setSubject] = useState('IPA');
  const [gradeLevel, setGradeLevel] = useState('IX');
  const [explanation, setExplanation] = useState('');
  
  // PG options
  const [pgOptions, setPgOptions] = useState<MultipleChoiceOption[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [correctKey, setCorrectKey] = useState('A');

  // Isian answers
  const [acceptedAnswersText, setAcceptedAnswersText] = useState('');

  // BS statements
  const [bsStatements, setBsStatements] = useState<TrueFalseStatement[]>([
    { id: 's1', statement: '', correctAnswer: true },
    { id: 's2', statement: '', correctAnswer: false },
  ]);

  // Uraian rubric
  const [rubricGuide, setRubricGuide] = useState('');

  // Preview Modal
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Form validation & delete modal state
  const [formError, setFormError] = useState('');
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setType('pg');
    setPrompt('');
    setPoints(10);
    setSubject('IPA');
    setGradeLevel('IX');
    setExplanation('');
    setFormError('');
    setPgOptions([
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ]);
    setCorrectKey('A');
    setAcceptedAnswersText('');
    setBsStatements([
      { id: 's1', statement: '', correctAnswer: true },
      { id: 's2', statement: '', correctAnswer: false },
    ]);
    setRubricGuide('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingId(q.id);
    setType(q.type);
    setPrompt(q.prompt);
    setPoints(q.points);
    setSubject(q.subject);
    setGradeLevel(q.gradeLevel);
    setExplanation(q.explanation || '');
    setFormError('');

    if (q.type === 'pg' && q.options) {
      setPgOptions(q.options);
      setCorrectKey(q.correctAnswerKey || 'A');
    }
    if (q.type === 'isian' && q.acceptedAnswers) {
      setAcceptedAnswersText(q.acceptedAnswers.join(', '));
    }
    if (q.type === 'bs' && q.statements) {
      setBsStatements(q.statements);
    }
    if (q.type === 'uraian') {
      setRubricGuide(q.rubricGuide || '');
    }

    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!prompt.trim()) {
      setFormError('Teks stimulus / pertanyaan wajib diisi!');
      return;
    }

    if (type === 'pg') {
      const emptyOpt = pgOptions.find(o => !o.text.trim());
      if (emptyOpt) {
        setFormError(`Teks opsi ${emptyOpt.id} belum diisi.`);
        return;
      }
    }

    if (type === 'isian') {
      if (!acceptedAnswersText.trim()) {
        setFormError('Kunci jawaban isian singkat wajib diisi.');
        return;
      }
    }

    if (type === 'bs') {
      const validStmts = bsStatements.filter(s => s.statement.trim().length > 0);
      if (validStmts.length === 0) {
        setFormError('Minimal sediakan 1 pernyataan benar/salah.');
        return;
      }
    }

    const question: Question = {
      id: editingId || `q-${Date.now()}`,
      type,
      prompt: prompt.trim(),
      points: Number(points) || 10,
      subject: subject.trim(),
      gradeLevel: gradeLevel.trim(),
      explanation: explanation.trim() || undefined,
    };

    if (type === 'pg') {
      question.options = pgOptions;
      question.correctAnswerKey = correctKey;
    } else if (type === 'isian') {
      question.acceptedAnswers = acceptedAnswersText
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (type === 'bs') {
      question.statements = bsStatements.filter(s => s.statement.trim().length > 0);
    } else if (type === 'uraian') {
      question.rubricGuide = rubricGuide.trim() || undefined;
    }

    StorageService.saveQuestionToBank(question);
    setIsEditing(false);
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (questionToDelete) {
      StorageService.deleteQuestionFromBank(questionToDelete);
      setQuestionToDelete(null);
      onRefresh();
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questionBank, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bank_soal_simas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter questions
  const filteredQuestions = questionBank.filter(q => {
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (searchQuery.trim() && !q.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const subjects = Array.from(new Set(questionBank.map(q => q.subject)));

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bank Soal Multi-Tipe</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilihan Ganda (PG), Isian Singkat, Benar / Salah, dan Uraian / Esai terstandar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            title="Ekspor JSON"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          {!isEditing && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Soal</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Modal / Panel */}
      {isEditing && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <h3 className="font-bold text-slate-900 text-base">
              {editingId ? 'Edit Butir Soal' : 'Buat Butir Soal Baru'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bentuk / Tipe Soal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pg', label: 'Pilihan Ganda (PG)' },
                  { id: 'isian', label: 'Isian Singkat' },
                  { id: 'bs', label: 'Benar / Salah' },
                  { id: 'uraian', label: 'Uraian / Esai' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as QuestionType)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      type === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject, Grade, Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Kelas
                </label>
                <input
                  type="text"
                  required
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bobot Nilai (Poin)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pertanyaan / Stimulus Soal *
              </label>
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Tuliskan stimulus, teks bacaan, atau instruksi pertanyaan di sini..."
                className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Type-specific inputs */}
            {type === 'pg' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Opsi Jawaban & Kunci
                  </span>
                  <span className="text-[11px] text-slate-500">Pilih radio untuk menandai kunci jawaban benar</span>
                </div>
                {pgOptions.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="correctKey"
                        checked={correctKey === opt.id}
                        onChange={() => setCorrectKey(opt.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-xs text-slate-700 w-4">{opt.id}.</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={e => {
                        const updated = [...pgOptions];
                        updated[i].text = e.target.value;
                        setPgOptions(updated);
                      }}
                      placeholder={`Pilihan ${opt.id}`}
                      className="flex-1 text-xs px-3 py-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {type === 'isian' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kunci Jawaban Isian Singkat (Pisahkan dengan koma jika ada variasi)
                </label>
                <input
                  type="text"
                  required
                  value={acceptedAnswersText}
                  onChange={e => setAcceptedAnswersText(e.target.value)}
                  placeholder="Contoh: fotosintesis, fotosintesa, photosynthesis"
                  className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Pencocokan jawaban bersifat case-insensitive (huruf besar/kecil diabaikan otomatis).
                </p>
              </div>
            )}

            {type === 'bs' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Pernyataan Benar / Salah
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBsStatements([
                        ...bsStatements,
                        { id: `s${bsStatements.length + 1}`, statement: '', correctAnswer: true },
                      ]);
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Baris
                  </button>
                </div>
                {bsStatements.map((st, i) => (
                  <div key={st.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                    <input
                      type="text"
                      required
                      value={st.statement}
                      onChange={e => {
                        const copy = [...bsStatements];
                        copy[i].statement = e.target.value;
                        setBsStatements(copy);
                      }}
                      placeholder={`Tuliskan pernyataan #${i + 1}`}
                      className="flex-1 text-xs px-3 py-2 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...bsStatements];
                          copy[i].correctAnswer = true;
                          setBsStatements(copy);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded ${
                          st.correctAnswer
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Benar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...bsStatements];
                          copy[i].correctAnswer = false;
                          setBsStatements(copy);
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded ${
                          !st.correctAnswer
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Salah
                      </button>
                      {bsStatements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBsStatements(bsStatements.filter((_, idx) => idx !== i))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'uraian' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Panduan Rubrik Penilaian / Kunci Jawaban Acuan Guru
                </label>
                <textarea
                  rows={3}
                  value={rubricGuide}
                  onChange={e => setRubricGuide(e.target.value)}
                  placeholder="Kriteria penilaian, kata kunci, dan pembagian skor..."
                  className="w-full text-xs p-3 rounded-md border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pembahasan Soal (Ditampilkan jika hasil dirilis)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Penjelasan ilmiah atau rumus penyelesaian..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
                <span>Simpan Butir Soal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari teks pertanyaan..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Tipe Soal</option>
            <option value="pg">Pilihan Ganda</option>
            <option value="isian">Isian Singkat</option>
            <option value="bs">Benar / Salah</option>
            <option value="uraian">Uraian / Esai</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Tidak ada soal yang sesuai</h3>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau buat soal baru.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">#{idx + 1}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 font-mono">
                      {q.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{q.subject}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">Kelas {q.gradeLevel}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {q.points} Poin
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {q.prompt}
                  </p>

                  {/* Summary of options/answer */}
                  {q.type === 'pg' && q.options && (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      {q.options.map(opt => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded border text-xs flex items-center gap-2 ${
                            opt.id === q.correctAnswerKey
                              ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="font-bold">{opt.id}.</span>
                          <span>{opt.text}</span>
                          {opt.id === q.correctAnswerKey && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Kunci
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'isian' && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      <span className="text-slate-400">Kunci Jawaban: </span>
                      <strong className="text-slate-800">{q.acceptedAnswers?.join(' / ')}</strong>
                    </div>
                  )}

                  {q.type === 'bs' && q.statements && (
                    <div className="space-y-1 text-xs pt-1">
                      {q.statements.map(st => (
                        <div key={st.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                          <span className="text-slate-700">{st.statement}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            st.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {st.correctAnswer ? 'BENAR' : 'SALAH'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'uraian' && q.rubricGuide && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded">
                      <span className="text-slate-400 block mb-0.5 font-semibold">Rubrik Penilaian Acuan:</span>
                      <p className="text-slate-700 italic">{q.rubricGuide}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    title="Ubah Soal"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQuestionToDelete(q.id)}
                    title="Hapus Soal"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Question Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hapus Butir Soal?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Butir soal ini akan dihapus dari Bank Soal utama. Paket ujian yang sudah menggunakan soal ini tidak akan terpengaruh.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
