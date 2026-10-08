import React, { useState, useEffect } from 'react';
import { User, ExamSettings, ExamSession } from './types/exam';
import { StorageService } from './services/storageService';
import { Header } from './components/common/Header';
import { LoginView } from './components/auth/LoginView';

// Teacher components
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ExamManager } from './components/teacher/ExamManager';
import { QuestionBank } from './components/teacher/QuestionBank';
import { LiveMonitoring } from './components/teacher/LiveMonitoring';
import { ExamResults } from './components/teacher/ExamResults';
import { AuditLogViewer } from './components/teacher/AuditLogViewer';

// Student components
import { StudentPortal } from './components/student/StudentPortal';
import { ExamInstruction } from './components/student/ExamInstruction';
import { ExamRunner } from './components/student/ExamRunner';
import { ExamFinished } from './components/student/ExamFinished';

// Icons for teacher navigation
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  PlayCircle, 
  BarChart3, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [teachers, setTeachers] = useState<User[]>(() => StorageService.getTeachers());
  const [students, setStudents] = useState<User[]>(() => StorageService.getStudents());
  
  // App data
  const [exams, setExams] = useState<ExamSettings[]>(() => StorageService.getExams());
  const [questionBank, setQuestionBank] = useState(() => StorageService.getQuestionBank());
  const [sessions, setSessions] = useState<ExamSession[]>(() => StorageService.getSessions());

  // Teacher navigation tab
  const [teacherTab, setTeacherTab] = useState<'dashboard' | 'exams' | 'questions' | 'live' | 'results' | 'audit'>('dashboard');
  const [selectedExamIdForLive, setSelectedExamIdForLive] = useState<string>(() => exams[0]?.id || '');

  // Student flow state
  const [studentView, setStudentView] = useState<'portal' | 'instruction' | 'runner' | 'finished'>('portal');
  const [activeStudentExam, setActiveStudentExam] = useState<ExamSettings | null>(null);
  const [activeStudentSession, setActiveStudentSession] = useState<ExamSession | null>(null);

  // Sync state when storage changes
  const refreshData = () => {
    setExams(StorageService.getExams());
    setQuestionBank(StorageService.getQuestionBank());
    setSessions(StorageService.getSessions());
  };

  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };
    window.addEventListener('cbt-storage-update', handleUpdate);
    return () => window.removeEventListener('cbt-storage-update', handleUpdate);
  }, []);

  // Handle Login / Switch User
  const handleLogin = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    if (user.role === 'siswa') {
      setStudentView('portal');
      setActiveStudentExam(null);
      setActiveStudentSession(null);
    } else {
      setTeacherTab('dashboard');
    }
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setStudentView('portal');
    setActiveStudentExam(null);
    setActiveStudentSession(null);
  };

  // Student Actions
  const handleStartExamFlow = (exam: ExamSettings) => {
    if (!currentUser) return;
    const session = StorageService.getOrCreateSession(currentUser, exam);
    setActiveStudentExam(exam);
    setActiveStudentSession(session);

    if (session.status === 'submitted') {
      setStudentView('finished');
    } else {
      setStudentView('instruction');
    }
  };

  const handleProceedToRunner = () => {
    if (!activeStudentExam || !currentUser) return;

    // Start session if not started
    let session = StorageService.getSessionByStudentAndExam(currentUser.id, activeStudentExam.id);
    if (!session) {
      session = StorageService.getOrCreateSession(currentUser, activeStudentExam);
    }

    if (session.status === 'not_started') {
      session.status = 'in_progress';
      session.startedAt = new Date().toISOString();
      StorageService.saveSession(session);
    }

    setActiveStudentSession(session);
    setStudentView('runner');
  };

  const handleFinishExam = (submittedSession: ExamSession) => {
    setActiveStudentSession(submittedSession);
    setStudentView('finished');
    refreshData();
  };

  // IF USER IS IN EXAM RUNNER (KIOSK MODE), HIDE DEFAULT NAVBAR FOR PURITY
  if (currentUser?.role === 'siswa' && studentView === 'runner' && activeStudentExam && activeStudentSession) {
    return (
      <ExamRunner
        currentUser={currentUser}
        exam={activeStudentExam}
        session={activeStudentSession}
        onFinishExam={handleFinishExam}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleLogin}
        allTeachers={teachers}
        allStudents={students}
      />

      {/* Main Content Area */}
      {!currentUser ? (
        <LoginView
          onLogin={handleLogin}
          teachers={teachers}
          students={students}
        />
      ) : currentUser.role === 'guru' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">
          {/* Teacher Navigation Bar */}
          <nav className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
            <button
              onClick={() => setTeacherTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dasbor Utama</span>
            </button>

            <button
              onClick={() => setTeacherTab('exams')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'exams'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paket Ujian ({exams.length})</span>
            </button>

            <button
              onClick={() => setTeacherTab('questions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'questions'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Bank Soal ({questionBank.length})</span>
            </button>

            <button
              onClick={() => setTeacherTab('live')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'live'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>Live Monitoring & Kiosk</span>
            </button>

            <button
              onClick={() => setTeacherTab('results')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'results'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Rekap Nilai & Esai</span>
            </button>

            <button
              onClick={() => setTeacherTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                teacherTab === 'audit'
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Audit Log Integritas</span>
            </button>
          </nav>

          {/* Teacher Tab Views */}
          {teacherTab === 'dashboard' && (
            <TeacherDashboard
              currentUser={currentUser}
              exams={exams}
              sessions={sessions}
              onNavigateTab={tab => setTeacherTab(tab)}
              onSelectExamForLive={id => {
                setSelectedExamIdForLive(id);
                setTeacherTab('live');
              }}
              onCreateExam={() => setTeacherTab('exams')}
            />
          )}

          {teacherTab === 'exams' && (
            <ExamManager
              exams={exams}
              questionBank={questionBank}
              onRefresh={refreshData}
              onSelectExamForLive={id => {
                setSelectedExamIdForLive(id);
                setTeacherTab('live');
              }}
            />
          )}

          {teacherTab === 'questions' && (
            <QuestionBank
              questionBank={questionBank}
              onRefresh={refreshData}
            />
          )}

          {teacherTab === 'live' && (
            <LiveMonitoring
              exams={exams}
              sessions={sessions}
              selectedExamId={selectedExamIdForLive || exams[0]?.id || ''}
              onSelectExam={setSelectedExamIdForLive}
              onRefresh={refreshData}
            />
          )}

          {teacherTab === 'results' && (
            <ExamResults
              exams={exams}
              sessions={sessions}
              onRefresh={refreshData}
            />
          )}

          {teacherTab === 'audit' && (
            <AuditLogViewer
              exams={exams}
              sessions={sessions}
            />
          )}
        </div>
      ) : (
        // STUDENT VIEWS
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
          {studentView === 'portal' && (
            <StudentPortal
              currentUser={currentUser}
              exams={exams}
              sessions={sessions}
              onStartExamFlow={handleStartExamFlow}
            />
          )}

          {studentView === 'instruction' && activeStudentExam && (
            <ExamInstruction
              currentUser={currentUser}
              exam={activeStudentExam}
              session={activeStudentSession || undefined}
              onBack={() => setStudentView('portal')}
              onStartExam={handleProceedToRunner}
            />
          )}

          {studentView === 'finished' && activeStudentExam && activeStudentSession && (
            <ExamFinished
              currentUser={currentUser}
              exam={activeStudentExam}
              session={activeStudentSession}
              onBackToHome={() => {
                setStudentView('portal');
                setActiveStudentExam(null);
                setActiveStudentSession(null);
                refreshData();
              }}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SIMAS-CBT</strong> · Sistem Manajemen Asesmen & Ujian Terproteksi Kiosk Mode
          </div>
          <div className="text-[11px] text-slate-400">
            SMP Negeri 1 Nusantara · Mematuhi Standar Ujian Berbasis Komputer & Kebijakan Privasi Siswa
          </div>
        </div>
      </footer>
    </div>
  );
}
