export type UserRole = 'guru' | 'siswa';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  identifier: string; // NIP / Email for guru, NISN for siswa
  schoolName: string;
  classGroup?: string; // e.g., 'IX-A'
  avatar?: string;
}

export type QuestionType = 'pg' | 'isian' | 'bs' | 'uraian';

export interface MultipleChoiceOption {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface TrueFalseStatement {
  id: string;
  statement: string;
  correctAnswer: boolean; // true = Benar, false = Salah
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  subject: string;
  gradeLevel: string;
  // For 'pg'
  options?: MultipleChoiceOption[];
  correctAnswerKey?: string; // 'A', 'B', etc.
  // For 'isian'
  acceptedAnswers?: string[]; // list of accepted answers (case-insensitive)
  // For 'bs'
  statements?: TrueFalseStatement[];
  // For 'uraian'
  rubricGuide?: string;
  // Shared
  explanation?: string;
  imageUrl?: string;
}

export type ViolationAction = 'suspend' | 'auto_submit';

export interface ExamSettings {
  id: string;
  code: string; // e.g., "PAS-IPA-2026"
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  durationMinutes: number;
  kkm: number; // e.g., 75
  startTime: string; // ISO string
  endTime: string; // ISO string
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  releaseResultsImmediately: boolean;
  proctorPin: string; // PIN Pengawas to unlock, e.g. "1234"
  maxViolations: number; // e.g. 3
  violationAction: ViolationAction;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type ViolationType = 
  | 'tab_switch' 
  | 'fullscreen_exit' 
  | 'window_blur' 
  | 'blocked_key' 
  | 'right_click'
  | 'offline_detected';

export interface ViolationLog {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string; // "14:23:05 WIB"
  type: ViolationType;
  description: string;
  questionNumberAtTime: number;
}

export type SessionStatus = 'not_started' | 'in_progress' | 'suspended' | 'submitted';

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  value: any; // string for 'pg' & 'isian' & 'uraian', Record<string, boolean> for 'bs'
  isFlagged?: boolean; // Ragu-ragu
  scoreAwarded?: number; // Calculated or teacher-assigned
  teacherFeedback?: string;
  updatedAt: string;
}

export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  status: SessionStatus;
  startedAt?: string;
  submittedAt?: string;
  answers: Record<string, StudentAnswer>;
  violations: ViolationLog[];
  currentQuestionIndex: number;
  finalScore?: number;
  totalPossibleScore?: number;
  isPassed?: boolean;
  extraTimeMinutes?: number;
  lastHeartbeat: string;
  essayGraded?: boolean;
}
