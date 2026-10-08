import { ExamSettings, ExamSession, Question, User, ViolationLog, ViolationType } from '../types/exam';
import { INITIAL_EXAMS, INITIAL_QUESTIONS_IPA, INITIAL_QUESTIONS_MATEMATIKA, INITIAL_SESSIONS, INITIAL_STUDENTS, INITIAL_TEACHERS } from '../data/mockInitialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'simas_cbt_current_user',
  EXAMS: 'simas_cbt_exams',
  QUESTION_BANK: 'simas_cbt_question_bank',
  SESSIONS: 'simas_cbt_sessions',
  STUDENTS: 'simas_cbt_students',
  TEACHERS: 'simas_cbt_teachers',
};

// Helper for local storage
function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger window event for reactive updates in same tab
    window.dispatchEvent(new CustomEvent('cbt-storage-update', { detail: { key } }));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

export class StorageService {
  // --- AUTHENTICATION ---
  static getCurrentUser(): User | null {
    return safeGetItem<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_TEACHERS[0]);
  }

  static setCurrentUser(user: User | null): void {
    safeSetItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static getTeachers(): User[] {
    return safeGetItem<User[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  }

  static getStudents(): User[] {
    return safeGetItem<User[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  // --- EXAMS ---
  static getExams(): ExamSettings[] {
    const exams = safeGetItem<ExamSettings[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    if (!exams || exams.length === 0) {
      safeSetItem(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
      return INITIAL_EXAMS;
    }
    return exams;
  }

  static getExamById(id: string): ExamSettings | undefined {
    return this.getExams().find(e => e.id === id);
  }

  static getExamByCode(code: string): ExamSettings | undefined {
    const clean = code.trim().toUpperCase();
    return this.getExams().find(e => e.code.toUpperCase() === clean);
  }

  static saveExam(exam: ExamSettings): void {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === exam.id);
    if (index >= 0) {
      exams[index] = { ...exam, updatedAt: new Date().toISOString() };
    } else {
      exams.unshift({ ...exam, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    safeSetItem(STORAGE_KEYS.EXAMS, exams);
  }

  static deleteExam(id: string): void {
    const exams = this.getExams().filter(e => e.id !== id);
    safeSetItem(STORAGE_KEYS.EXAMS, exams);
    // Also remove associated sessions
    const sessions = this.getSessions().filter(s => s.examId !== id);
    safeSetItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  // --- QUESTION BANK ---
  static getQuestionBank(): Question[] {
    const bank = safeGetItem<Question[]>(STORAGE_KEYS.QUESTION_BANK, [
      ...INITIAL_QUESTIONS_IPA,
      ...INITIAL_QUESTIONS_MATEMATIKA,
    ]);
    return bank;
  }

  static saveQuestionToBank(question: Question): void {
    const bank = this.getQuestionBank();
    const index = bank.findIndex(q => q.id === question.id);
    if (index >= 0) {
      bank[index] = question;
    } else {
      bank.unshift(question);
    }
    safeSetItem(STORAGE_KEYS.QUESTION_BANK, bank);
  }

  static deleteQuestionFromBank(id: string): void {
    const bank = this.getQuestionBank().filter(q => q.id !== id);
    safeSetItem(STORAGE_KEYS.QUESTION_BANK, bank);
  }

  // --- EXAM SESSIONS (AUTOSAVE & AUDIT LOGS) ---
  static getSessions(): ExamSession[] {
    const sessions = safeGetItem<ExamSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    if (!sessions || sessions.length === 0) {
      safeSetItem(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      return INITIAL_SESSIONS;
    }
    return sessions;
  }

  static getSessionsForExam(examId: string): ExamSession[] {
    return this.getSessions().filter(s => s.examId === examId);
  }

  static getSession(sessionId: string): ExamSession | undefined {
    return this.getSessions().find(s => s.id === sessionId);
  }

  static getSessionByStudentAndExam(studentId: string, examId: string): ExamSession | undefined {
    return this.getSessions().find(s => s.studentId === studentId && s.examId === examId);
  }

  static getOrCreateSession(student: User, exam: ExamSettings): ExamSession {
    let session = this.getSessionByStudentAndExam(student.id, exam.id);
    if (!session) {
      session = {
        id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        examId: exam.id,
        studentId: student.id,
        studentName: student.name,
        studentNis: student.identifier,
        studentClass: student.classGroup || 'Umum',
        status: 'not_started',
        answers: {},
        violations: [],
        currentQuestionIndex: 0,
        lastHeartbeat: new Date().toISOString(),
      };
      this.saveSession(session);
    }
    return session;
  }

  static saveSession(session: ExamSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    const updated = { ...session, lastHeartbeat: new Date().toISOString() };
    if (index >= 0) {
      sessions[index] = updated;
    } else {
      sessions.unshift(updated);
    }
    safeSetItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  // Autosave a specific question's answer
  static autosaveAnswer(
    sessionId: string,
    questionId: string,
    questionType: Question['type'],
    answerValue: any,
    isFlagged: boolean = false
  ): ExamSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    session.answers[questionId] = {
      questionId,
      type: questionType,
      value: answerValue,
      isFlagged,
      updatedAt: new Date().toISOString(),
    };
    session.lastHeartbeat = new Date().toISOString();
    this.saveSession(session);
    return session;
  }

  // Record a security violation in exam mode
  static recordViolation(
    sessionId: string,
    violationType: ViolationType,
    description: string,
    questionNumber: number,
    exam: ExamSettings
  ): { session: ExamSession; newlySuspended: boolean } {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Sesi ujian tidak ditemukan');
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';

    const log: ViolationLog = {
      id: `viol-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: now.toISOString(),
      formattedTime,
      type: violationType,
      description,
      questionNumberAtTime: questionNumber,
    };

    session.violations.push(log);
    let newlySuspended = false;

    // Check against exam violation limits
    if (session.violations.length >= exam.maxViolations && session.status === 'in_progress') {
      if (exam.violationAction === 'suspend') {
        session.status = 'suspended';
        newlySuspended = true;
      } else if (exam.violationAction === 'auto_submit') {
        this.calculateAndSubmitSession(session, exam);
        return { session, newlySuspended: false };
      }
    }

    this.saveSession(session);
    return { session, newlySuspended };
  }

  // Unlock suspended session (Teacher / Proctor PIN verified)
  static unlockSuspendedSession(sessionId: string): ExamSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    session.status = 'in_progress';
    this.saveSession(session);
    return session;
  }

  // Add extra time
  static addExtraTime(sessionId: string, minutes: number): ExamSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    session.extraTimeMinutes = (session.extraTimeMinutes || 0) + minutes;
    this.saveSession(session);
    return session;
  }

  // Update current question index for student
  static updateCurrentQuestionIndex(sessionId: string, index: number): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.currentQuestionIndex = index;
      this.saveSession(session);
    }
  }

  // Calculate score and submit exam
  static calculateAndSubmitSession(session: ExamSession, exam: ExamSettings): ExamSession {
    let totalScore = 0;
    let maxPossibleScore = 0;
    let hasEssay = false;

    exam.questions.forEach(q => {
      maxPossibleScore += q.points;
      const ans = session.answers[q.id];

      if (!ans || ans.value === undefined || ans.value === null || ans.value === '') {
        // Record zero score for unanswered questions
        session.answers[q.id] = {
          questionId: q.id,
          type: q.type,
          value: '',
          scoreAwarded: 0,
          updatedAt: new Date().toISOString(),
        };
        return;
      }

      if (q.type === 'pg') {
        if (ans.value === q.correctAnswerKey) {
          ans.scoreAwarded = q.points;
          totalScore += q.points;
        } else {
          ans.scoreAwarded = 0;
        }
      } else if (q.type === 'isian') {
        const studentText = String(ans.value).trim().toLowerCase();
        const matches = (q.acceptedAnswers || []).some(
          acceptable => acceptable.trim().toLowerCase() === studentText
        );
        if (matches) {
          ans.scoreAwarded = q.points;
          totalScore += q.points;
        } else {
          ans.scoreAwarded = 0;
        }
      } else if (q.type === 'bs') {
        const statements = q.statements || [];
        const studentMap = (ans.value || {}) as Record<string, boolean>;
        let correctCount = 0;
        statements.forEach(st => {
          if (studentMap[st.id] === st.correctAnswer) {
            correctCount++;
          }
        });
        const pointPerStmt = statements.length > 0 ? q.points / statements.length : 0;
        const awarded = Math.round(correctCount * pointPerStmt);
        ans.scoreAwarded = awarded;
        totalScore += awarded;
      } else if (q.type === 'uraian') {
        hasEssay = true;
        // Keep existing teacher-graded score if already given
        if (ans.scoreAwarded !== undefined) {
          totalScore += ans.scoreAwarded;
        }
      }
    });

    // Normalized score out of 100
    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    session.status = 'submitted';
    session.submittedAt = new Date().toISOString();
    session.finalScore = normalizedScore;
    session.totalPossibleScore = 100;
    session.isPassed = normalizedScore >= exam.kkm;
    session.essayGraded = !hasEssay;

    this.saveSession(session);
    return session;
  }

  // Teacher manual grading for essay / review
  static gradeEssayAnswer(
    sessionId: string,
    questionId: string,
    scoreAwarded: number,
    feedback?: string
  ): ExamSession | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    const exam = this.getExamById(session.examId);
    if (!exam) return undefined;

    if (!session.answers[questionId]) {
      session.answers[questionId] = {
        questionId,
        type: 'uraian',
        value: '',
        scoreAwarded,
        teacherFeedback: feedback,
        updatedAt: new Date().toISOString(),
      };
    } else {
      session.answers[questionId].scoreAwarded = scoreAwarded;
      if (feedback !== undefined) {
        session.answers[questionId].teacherFeedback = feedback;
      }
    }

    // Recalculate total score
    let totalScore = 0;
    let maxPossibleScore = 0;
    exam.questions.forEach(q => {
      maxPossibleScore += q.points;
      const ans = session.answers[q.id];
      if (ans && ans.scoreAwarded) {
        totalScore += ans.scoreAwarded;
      }
    });

    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    session.finalScore = normalizedScore;
    session.isPassed = normalizedScore >= exam.kkm;
    session.essayGraded = true;

    this.saveSession(session);
    return session;
  }

  // Reset entire application data back to default demo
  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.QUESTION_BANK);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    window.location.reload();
  }
}
