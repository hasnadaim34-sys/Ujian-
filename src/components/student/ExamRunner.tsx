import React, { useState, useEffect, useRef } from 'react';
import { User, ExamSettings, ExamSession, Question, StudentAnswer, ViolationType, ViolationLog } from '../../types/exam';
import { StorageService } from '../../services/storageService';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Send, 
  Maximize2, 
  Wifi, 
  WifiOff, 
  Lock, 
  Check, 
  AlertOctagon, 
  KeyRound,
  FileText
} from 'lucide-react';

interface ExamRunnerProps {
  currentUser: User;
  exam: ExamSettings;
  session: ExamSession;
  onFinishExam: (submittedSession: ExamSession) => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  currentUser,
  exam,
  session: initialSession,
  onFinishExam,
}) => {
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [currentIndex, setCurrentIndex] = useState<number>(session.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(session.answers || {});
  
  // Autosave status animation
  const [lastSavedTime, setLastSavedTime] = useState<string>('Baru saja');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Timer: calculate remaining seconds based on exam duration + extraTimeMinutes
  const totalDurationMinutes = exam.durationMinutes + (session.extraTimeMinutes || 0);
  const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
  const endTime = startTime + totalDurationMinutes * 60 * 1000;
  
  const calculateSecondsLeft = () => {
    const diff = Math.floor((endTime - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateSecondsLeft);

  // Violation Alert Dialog state
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  // Suspension Modal state
  const isSuspended = session.status === 'suspended';
  const [proctorPinInput, setProctorPinInput] = useState<string>('');
  const [proctorPinError, setProctorPinError] = useState<string>('');

  // Submit Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Questions for this exam
  const questions = exam.questions;
  const currentQuestion: Question | undefined = questions[currentIndex];

  // Request fullscreen function
  const requestKioskFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request could not be completed:', err);
    }
  };

  // Try to enter fullscreen upon mounting
  useEffect(() => {
    requestKioskFullscreen();
  }, []);

  // Sync session from storage updates (e.g. if proctor unlocks from Teacher panel!)
  useEffect(() => {
    const handleStorageUpdate = () => {
      const updated = StorageService.getSession(session.id);
      if (updated) {
        setSession(updated);
        setAnswers(updated.answers || {});
      }
    };
    window.addEventListener('cbt-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('cbt-storage-update', handleStorageUpdate);
  }, [session.id]);

  // Online / Offline monitor
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

  // TIMER EFFECT
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Time is up -> Auto-submit
        handleTimeExpiredAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const handleTimeExpiredAutoSubmit = () => {
    alert('Waktu pengerjaan ujian telah habis! Sistem secara otomatis mengunci dan mengirimkan jawaban Anda.');
    const finalized = StorageService.calculateAndSubmitSession(session, exam);
    onFinishExam(finalized);
  };

  // INTEGRITY / SECURITY DETECTION LISTENERS
  const handleSecurityBreach = (type: ViolationType, description: string) => {
    // If already submitted or already suspended, skip
    if (session.status === 'submitted' || session.status === 'suspended') return;

    try {
      const result = StorageService.recordViolation(
        session.id,
        type,
        description,
        currentIndex + 1,
        exam
      );

      setSession({ ...result.session });

      if (result.newlySuspended) {
        setShowWarningModal(false);
      } else {
        setWarningMessage(description);
        setShowWarningModal(true);
      }
    } catch (e) {
      console.error('Error logging violation:', e);
    }
  };

  useEffect(() => {
    // 1. Page Visibility API listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSecurityBreach(
          'tab_switch',
          'Terdeteksi aktivitas meninggalkan halaman ujian (berpindah tab browser atau meminimalkan jendela).'
        );
      }
    };

    // 2. Window Blur listener
    const handleWindowBlur = () => {
      handleSecurityBreach(
        'window_blur',
        'Terdeteksi jendela ujian kehilangan fokus (berpindah ke aplikasi atau jendela lain).'
      );
    };

    // 3. Fullscreen exit detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && session.status === 'in_progress') {
        handleSecurityBreach(
          'fullscreen_exit',
          'Terdeteksi keluar dari mode layar penuh (Fullscreen Exited). Silakan segera kembali ke mode layar penuh.'
        );
      }
    };

    // 4. Keyboard Shortcuts Blocker (Ctrl+C, Ctrl+V, Ctrl+P, F12, Alt+Tab, Escape, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, Ctrl+U
      if (e.ctrlKey || e.metaKey) {
        const forbiddenKeys = ['c', 'v', 'x', 'p', 'u', 's', 'a', 'r'];
        if (forbiddenKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          handleSecurityBreach(
            'blocked_key',
            `Upaya penggunaan kombinasi tombol pintas terlarang (Ctrl+${e.key.toUpperCase()}).`
          );
          return;
        }
      }

      // Block F12, F5
      if (e.key === 'F12' || e.key === 'F5') {
        e.preventDefault();
        handleSecurityBreach('blocked_key', `Upaya penekanan tombol fungsi (${e.key}).`);
        return;
      }
    };

    // 5. Context Menu Blocker (Right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleSecurityBreach('right_click', 'Upaya klik kanan (Menu Konteks) dicegah.');
    };

    // 6. Prevent browser navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Ujian sedang berlangsung! Jawaban Anda tersimpan otomatis.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session.status, session.id, currentIndex, exam]);

  // ANSWER INPUT & AUTOSAVE HANDLERS
  const handleSaveAnswerValue = (value: any) => {
    if (!currentQuestion) return;

    setIsSaving(true);
    const existing = answers[currentQuestion.id];
    const isFlagged = existing?.isFlagged || false;

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        type: currentQuestion.type,
        value,
        isFlagged,
        updatedAt: new Date().toISOString(),
      },
    };

    setAnswers(updatedAnswers);

    // Persist immediately in StorageService
    StorageService.autosaveAnswer(
      session.id,
      currentQuestion.id,
      currentQuestion.type,
      value,
      isFlagged
    );

    setTimeout(() => {
      setIsSaving(false);
      setLastSavedTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 200);
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;

    const existing = answers[currentQuestion.id];
    const currentValue = existing ? existing.value : undefined;
    const newFlag = !existing?.isFlagged;

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        type: currentQuestion.type,
        value: currentValue,
        isFlagged: newFlag,
        updatedAt: new Date().toISOString(),
      },
    };

    setAnswers(updatedAnswers);
    StorageService.autosaveAnswer(
      session.id,
      currentQuestion.id,
      currentQuestion.type,
      currentValue,
      newFlag
    );
  };

  // UNLOCK SUSPENDED SESSION WITH PROCTOR PIN
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setProctorPinError('');

    if (proctorPinInput.trim() === exam.proctorPin) {
      StorageService.unlockSuspendedSession(session.id);
      const refreshed = StorageService.getSession(session.id);
      if (refreshed) {
        setSession(refreshed);
      }
      setProctorPinInput('');
      requestKioskFullscreen();
    } else {
      setProctorPinError('PIN Pengawas salah. Silakan hubungi guru pengawas ruang ujian.');
    }
  };

  // SUBMIT EXAM FINAL
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const submitted = StorageService.calculateAndSubmitSession(session, exam);
    // Exit fullscreen cleanly
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onFinishExam(submitted);
  };

  // FORMAT TIMER
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // QUESTIONS PROGRESS
  const answeredCount = Object.values(answers).filter(
    a => a.value !== undefined && a.value !== null && a.value !== ''
  ).length;
  const flaggedCount = Object.values(answers).filter(a => a.isFlagged).length;
  const emptyCount = questions.length - answeredCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* Top Header / Kiosk Status Bar */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                NISN: {currentUser.identifier}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {exam.title}
            </div>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm ${
              secondsLeft < 300
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Sisa Waktu: {formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Right: Autosave Status & Violations Counter */}
        <div className="flex items-center gap-3">
          {/* Autosave Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span className="text-[11px]">Autosave Aktif ({lastSavedTime})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px]">Mode Offline (Tersimpan Lokal)</span>
              </span>
            )}
          </div>

          {/* Violations Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs">
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                session.violations.length > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            />
            <span
              className={`font-mono font-bold ${
                session.violations.length > 0 ? 'text-rose-300' : 'text-slate-300'
              }`}
            >
              {session.violations.length}/{exam.maxViolations} Pelanggaran
            </span>
          </div>

          {/* Fullscreen restore button */}
          {!document.fullscreenElement && (
            <button
              onClick={requestKioskFullscreen}
              title="Aktifkan Layar Penuh"
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Question Canvas */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between">
            {currentQuestion ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  {/* Question Header Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {currentIndex + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Soal Nomor {currentIndex + 1} dari {questions.length}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Bentuk: <strong className="uppercase">{currentQuestion.type}</strong> · Bobot: {currentQuestion.points} Poin
                        </div>
                      </div>
                    </div>

                    {/* Flag button */}
                    <button
                      onClick={handleToggleFlag}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        answers[currentQuestion.id]?.isFlagged
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Flag
                        className={`w-3.5 h-3.5 ${
                          answers[currentQuestion.id]?.isFlagged ? 'fill-amber-600 text-amber-600' : ''
                        }`}
                      />
                      <span>{answers[currentQuestion.id]?.isFlagged ? 'Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed mb-6">
                    {currentQuestion.prompt}
                  </div>

                  {/* Render Question Inputs based on Type */}
                  {/* 1. Multiple Choice (PG) */}
                  {currentQuestion.type === 'pg' && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map(opt => {
                        const isSelected = answers[currentQuestion.id]?.value === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSaveAnswerValue(opt.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-sm font-medium text-slate-800 leading-normal pt-0.5">
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Isian Singkat */}
                  {currentQuestion.type === 'isian' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ketikkan Jawaban Singkat Anda di bawah ini:
                      </label>
                      <input
                        type="text"
                        value={answers[currentQuestion.id]?.value || ''}
                        onChange={e => handleSaveAnswerValue(e.target.value)}
                        placeholder="Ketik jawaban di sini..."
                        className="w-full text-sm font-semibold p-3.5 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                      />
                      <p className="text-[11px] text-slate-400">
                        Jawaban tersimpan otomatis saat Anda mengetik.
                      </p>
                    </div>
                  )}

                  {/* 3. Benar / Salah */}
                  {currentQuestion.type === 'bs' && currentQuestion.statements && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-500 font-medium">
                        Pilih Benar atau Salah untuk masing-masing pernyataan berikut:
                      </div>
                      {currentQuestion.statements.map((stmt, idx) => {
                        const currentMap = (answers[currentQuestion.id]?.value || {}) as Record<string, boolean>;
                        const currentChoice = currentMap[stmt.id];

                        return (
                          <div
                            key={stmt.id}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="text-xs sm:text-sm font-medium text-slate-800 flex-1">
                              <span className="font-bold text-slate-500 mr-2">#{idx + 1}</span>
                              {stmt.statement}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...currentMap, [stmt.id]: true };
                                  handleSaveAnswerValue(updated);
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                  currentChoice === true
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                BENAR
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...currentMap, [stmt.id]: false };
                                  handleSaveAnswerValue(updated);
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                  currentChoice === false
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                SALAH
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Uraian / Esai */}
                  {currentQuestion.type === 'uraian' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tuliskan Uraian / Jawaban Lengkap Anda:
                      </label>
                      <textarea
                        rows={6}
                        value={answers[currentQuestion.id]?.value || ''}
                        onChange={e => handleSaveAnswerValue(e.target.value)}
                        placeholder="Tuliskan argumen, langkah pengerjaan, atau penjelasan lengkap Anda..."
                        className="w-full text-sm p-4 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none bg-white leading-relaxed"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Jumlah Karakter: {(answers[currentQuestion.id]?.value || '').length}</span>
                        <span>Jawaban tersimpan otomatis secara berkala</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="pt-8 border-t border-slate-100 mt-8 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      currentIndex === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kumpulkan Jawaban</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </main>

        {/* Right Sidebar: Question Palette Grid */}
        <aside className="w-72 bg-white border-l border-slate-200 hidden lg:flex flex-col p-5 overflow-y-auto shrink-0">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Navigasi Nomor Soal</h3>
            <p className="text-[11px] text-slate-500">Klik nomor untuk melompat langsung</p>
          </div>

          {/* Grid Numbers */}
          <div className="grid grid-cols-4 gap-2 flex-1 content-start">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isCurrent = idx === currentIndex;
              const hasAnswer = ans && ans.value !== undefined && ans.value !== null && ans.value !== '';
              const isFlagged = ans?.isFlagged;

              let style = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isFlagged) {
                style = 'bg-amber-400 text-amber-950 border-amber-500 font-bold';
              } else if (hasAnswer) {
                style = 'bg-blue-600 text-white border-blue-700 font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-11 rounded-lg border text-xs flex flex-col items-center justify-center relative transition-all ${style} ${
                    isCurrent ? 'ring-2 ring-offset-2 ring-slate-900 shadow-sm' : ''
                  }`}
                >
                  <span className="font-mono">{idx + 1}</span>
                  {isFlagged && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-900 absolute top-1 right-1"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 shrink-0"></span>
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0"></span>
              <span>Ragu-Ragu ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0"></span>
              <span>Belum Dijawab ({emptyCount})</span>
            </div>
          </div>

          {/* Direct Submit Button from Sidebar */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kumpulkan Ujian</span>
          </button>
        </aside>
      </div>

      {/* MODAL 1: WARNING MODAL (TERDETEKSI AKTIVITAS MENINGGALKAN HALAMAN) */}
      {showWarningModal && !isSuspended && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95 border-2 border-rose-500">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Peringatan Integritas Ujian!
            </h3>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 mb-4 leading-relaxed font-medium">
              Terdeteksi aktivitas meninggalkan halaman ujian. Silakan kembali ke ujian.
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Pelanggaran ke-<strong>{session.violations.length}</strong> dari batas maksimal <strong>{exam.maxViolations}</strong> kali. Insiden ini telah dicatat dengan stempel waktu pada log pengawas.
            </p>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 mb-6 text-left">
              <strong>Catatan:</strong> Seluruh jawaban Anda tetap tersimpan utuh dan tidak terhapus. Segera kembali ke layar penuh agar ujian tidak terkunci otomatis.
            </div>

            <button
              onClick={() => {
                setShowWarningModal(false);
                requestKioskFullscreen();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Kembali ke Ujian & Aktifkan Layar Penuh</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: SUSPENSION SCREEN ("UJIAN DITANGGUHKAN" - BUTUH VERIFIKASI GURU / PIN) */}
      {isSuspended && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-in zoom-in-95 border-4 border-rose-600">
            <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-600/30">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-rose-600 tracking-tight mb-2 uppercase">
              Ujian Ditangguhkan
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 mb-4 leading-relaxed font-medium">
              Aktivitas Anda telah melebihi batas toleransi pelanggaran integritas Kiosk Mode (<strong>{session.violations.length} kali terdeteksi</strong>). Layar pengerjaan Anda telah dikunci oleh sistem.
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <strong>Jawaban Anda Aman:</strong> Seluruh progres jawaban telah tersimpan di server. Jawaban tidak hilang.
              </div>
            </div>

            {/* PIN verification box */}
            <form onSubmit={handleUnlockWithPin} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Minta Verifikasi Guru / Masukkan PIN Pengawas</span>
              </div>

              {proctorPinError && (
                <p className="text-xs text-rose-600 font-semibold">{proctorPinError}</p>
              )}

              <div className="flex justify-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={proctorPinInput}
                  onChange={e => setProctorPinInput(e.target.value)}
                  placeholder="PIN Pengawas"
                  className="font-mono text-center font-bold tracking-widest text-lg w-44 px-4 py-2 rounded-lg border-2 border-slate-300 focus:border-blue-600 focus:outline-none bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Buka Kunci
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Guru pengawas juga dapat membuka kunci ini langsung dari layar laptop mereka melalui menu <strong>Live Monitoring</strong>.
              </p>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Peserta: {currentUser.name}</span>
              <span>NISN: {currentUser.identifier}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FINISH CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Konfirmasi Pengumpulan Jawaban
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Periksa kembali rangkuman pengerjaan Anda sebelum mengumpulkan secara permanen:
            </p>

            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sudah Dijawab</span>
                <span className="text-lg font-bold text-blue-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ragu-Ragu</span>
                <span className="text-lg font-bold text-amber-600">{flaggedCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kosong</span>
                <span className="text-lg font-bold text-rose-600">{emptyCount}</span>
              </div>
            </div>

            {emptyCount > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Masih terdapat {emptyCount} butir soal yang belum Anda jawab. Yakin ingin mengumpulkan?</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Kembali ke Soal
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Kumpulkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
