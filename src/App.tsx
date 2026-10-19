import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PaperScanner } from './components/PaperScanner';
import { MarkingStudio } from './components/MarkingStudio';
import { ClassInsights } from './components/ClassInsights';
import { ExamSchemeEditor } from './components/ExamSchemeEditor';
import { PrintSlips } from './components/PrintSlips';
import { HackathonModal } from './components/HackathonModal';
import { DEFAULT_EXAMS, INITIAL_SUBMISSIONS } from './data/sampleExams';
import { Exam, StudentSubmission } from './types/exam';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'scanner' | 'review' | 'insights' | 'schemes' | 'print'>('scanner');
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState(false);

  // Exams State (stored in localStorage)
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('saxe_exams_en');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_EXAMS;
  });

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    return exams[0]?.id || DEFAULT_EXAMS[0].id;
  });

  // Submissions State (stored in localStorage)
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const saved = localStorage.getItem('saxe_submissions_en');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SUBMISSIONS;
  });

  // Active submission for the Review & Override Studio
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(() => {
    return submissions[0]?.id || null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('saxe_exams_en', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('saxe_submissions_en', JSON.stringify(submissions));
  }, [submissions]);

  // Current active exam object
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Active submission object
  const activeSubmission = submissions.find((s) => s.id === activeSubmissionId) || submissions[0];

  // Global Statistics
  const examSubmissions = submissions.filter((s) => s.examId === currentExam?.id);
  const totalMarked = examSubmissions.length;
  // Estimated 15 minutes (0.25 hrs) saved per paper compared to manual hand marking
  const hoursSaved = totalMarked * 0.25;
  const classAverage = totalMarked > 0
    ? examSubmissions.reduce((sum, s) => sum + s.percentage, 0) / totalMarked
    : 0;
  const needsReviewCount = examSubmissions.filter((s) => s.status === 'flagged' || s.status === 'ai_draft').length;

  // Handler when Gemini finishes marking a new sheet in PaperScanner
  const handleGradingComplete = (newSubmission: StudentSubmission) => {
    setSubmissions((prev) => [newSubmission, ...prev]);
    setActiveSubmissionId(newSubmission.id);
    setCurrentTab('review');
  };

  // Handler when teacher modifies scores/feedback in MarkingStudio
  const handleUpdateSubmission = (updated: StudentSubmission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  // Handler when teacher approves & saves submission
  const handleSaveAndApprove = (approvedSubmission: StudentSubmission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === approvedSubmission.id ? approvedSubmission : s))
    );
  };

  // Handler to save or update exam scheme
  const handleSaveExam = (savedExam: Exam) => {
    setExams((prev) => {
      const exists = prev.some((e) => e.id === savedExam.id);
      if (exists) {
        return prev.map((e) => (e.id === savedExam.id ? savedExam : e));
      }
      return [savedExam, ...prev];
    });
    setSelectedExamId(savedExam.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Navigation & Stats Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenHackathon={() => setIsHackathonModalOpen(true)}
        stats={{
          totalMarked,
          hoursSaved,
          classAverage,
          needsReviewCount,
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'scanner' && (
          <PaperScanner
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            onGradingComplete={handleGradingComplete}
          />
        )}

        {currentTab === 'review' && activeSubmission && (
          <MarkingStudio
            submission={activeSubmission}
            exam={currentExam}
            onUpdateSubmission={handleUpdateSubmission}
            onSaveAndApprove={handleSaveAndApprove}
            allSubmissions={examSubmissions}
            onSelectSubmission={(id) => setActiveSubmissionId(id)}
            onBackToScanner={() => setCurrentTab('scanner')}
          />
        )}

        {currentTab === 'insights' && currentExam && (
          <ClassInsights
            submissions={submissions}
            exam={currentExam}
            onSelectStudent={(id) => {
              setActiveSubmissionId(id);
              setCurrentTab('review');
            }}
            onNavigateToPrint={() => setCurrentTab('print')}
          />
        )}

        {currentTab === 'schemes' && (
          <ExamSchemeEditor
            exams={exams}
            selectedExamId={selectedExamId}
            onSelectExam={setSelectedExamId}
            onSaveExam={handleSaveExam}
          />
        )}

        {currentTab === 'print' && currentExam && (
          <PrintSlips
            submissions={submissions}
            exam={currentExam}
            onBack={() => setCurrentTab('insights')}
          />
        )}
      </main>

      {/* Hackathon Submission Modal */}
      <HackathonModal
        isOpen={isHackathonModalOpen}
        onClose={() => setIsHackathonModalOpen(false)}
      />
    </div>
  );
}
