export interface QuestionScheme {
  id: string;
  number: number;
  questionText: string;
  questionType: 'short_answer' | 'math' | 'definition' | 'multiple_choice';
  correctAnswer: string;
  maxMarks: number;
  acceptableVariations?: string[];
  partialCreditCriteria?: string;
  topic?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  gradeClass: string;
  term: string;
  academicYear: string;
  passThreshold: number; // e.g. 50%
  questions: QuestionScheme[];
  createdAt: string;
}

export interface StudentDetails {
  studentName: string;
  studentId: string;
  gradeClass: string;
  examDate: string;
  examinerName: string;
  guardianContact?: string;
  notes?: string;
}

export interface MarkedQuestion {
  questionId: string;
  questionNumber: number;
  questionText: string;
  correctAnswer: string;
  transcribedAnswer: string;
  marksAwarded: number;
  originalAiMarks: number;
  maxMarks: number;
  confidence: 'high' | 'medium' | 'low';
  flagReason?: string;
  feedback: string;
  isOverriddenByTeacher: boolean;
  teacherNote?: string;
}

export interface StudentSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentId?: string;
  gradeClass?: string;
  examDate?: string;
  examinerName?: string;
  guardianContact?: string;
  notes?: string;
  imageUri: string;
  markedQuestions: MarkedQuestion[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallImpression?: string;
  status: 'ai_draft' | 'teacher_approved' | 'flagged';
  markedAt: string;
  reviewedAt?: string;
  teacherSignature?: string;
}

export interface QuestionStat {
  questionNumber: number;
  questionText: string;
  topic: string;
  averageScore: number;
  maxScore: number;
  accuracyRate: number; // 0 - 100
  lowConfidenceCount: number;
  commonMistakes: string[];
  needsRevision: boolean;
}

export interface ClassAnalytics {
  examId: string;
  examTitle: string;
  totalSubmissions: number;
  classAveragePercentage: number;
  passCount: number;
  failCount: number;
  highestPercentage: number;
  lowestPercentage: number;
  questionStats: QuestionStat[];
  topicsToRevise: string[];
}
