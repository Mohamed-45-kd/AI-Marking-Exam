import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Volume2, ZoomIn, ZoomOut, 
  RotateCw, Plus, Minus, ChevronLeft, ChevronRight,
  BookOpen, Sparkles, Check, HelpCircle, FileDown, Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentSubmission, MarkedQuestion, Exam } from '../types/exam';
import { translations as t } from '../translations/i18n';
import { downloadStudentPdf } from '../utils/pdfGenerator';

interface MarkingStudioProps {
  submission: StudentSubmission;
  exam: Exam;
  onUpdateSubmission: (updated: StudentSubmission) => void;
  onSaveAndApprove: (submission: StudentSubmission) => void;
  allSubmissions: StudentSubmission[];
  onSelectSubmission: (id: string) => void;
  onBackToScanner: () => void;
}

export const MarkingStudio: React.FC<MarkingStudioProps> = ({
  submission,
  exam,
  onUpdateSubmission,
  onSaveAndApprove,
  allSubmissions,
  onSelectSubmission,
  onBackToScanner,
}) => {
  // Image controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const [activeAudioQuestionId, setActiveAudioQuestionId] = useState<string | null>(null);
  const [isEditingStudentInfo, setIsEditingStudentInfo] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);

  // Recalculate totals strictly in code (guaranteed 100% precision)
  const computeTotals = (questions: MarkedQuestion[]) => {
    let score = 0;
    let max = 0;
    questions.forEach((q) => {
      score += Number(q.marksAwarded) || 0;
      max += Number(q.maxMarks) || 0;
    });
    score = Math.round(score * 10) / 10;
    const pct = max > 0 ? Math.round((score / max) * 1000) / 10 : 0;
    return { score, max, pct };
  };

  // Handle Mark Override by Teacher (+/- or direct input)
  const handleMarkChange = (questionId: string, newScore: number) => {
    const updatedQuestions = submission.markedQuestions.map((q) => {
      if (q.questionId === questionId) {
        const clampedScore = Math.max(0, Math.min(q.maxMarks, Math.round(newScore * 10) / 10));
        return {
          ...q,
          marksAwarded: clampedScore,
          isOverriddenByTeacher: clampedScore !== q.originalAiMarks,
        };
      }
      return q;
    });

    const { score, max, pct } = computeTotals(updatedQuestions);

    onUpdateSubmission({
      ...submission,
      markedQuestions: updatedQuestions,
      totalScore: score,
      maxScore: max,
      percentage: pct,
    });
  };

  // Handle Feedback Text Edit
  const handleFeedbackChange = (questionId: string, newFeedback: string) => {
    const updatedQuestions = submission.markedQuestions.map((q) => {
      if (q.questionId === questionId) {
        return { ...q, feedback: newFeedback };
      }
      return q;
    });

    onUpdateSubmission({
      ...submission,
      markedQuestions: updatedQuestions,
    });
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    try {
      const studentDetails = {
        studentName: submission.studentName,
        studentId: submission.studentId || '',
        gradeClass: submission.gradeClass || exam.gradeClass,
        examDate: submission.examDate || new Date(submission.markedAt).toISOString().split('T')[0],
        examinerName: submission.examinerName || 'Mohamed Weli Jama (Mohaan)',
        guardianContact: submission.guardianContact,
        notes: submission.notes,
      };

      downloadStudentPdf({
        studentDetails,
        exam,
        imageUri: submission.imageUri,
        markedQuestions: submission.markedQuestions,
        totalScore: submission.totalScore,
        maxScore: submission.maxScore,
        percentage: submission.percentage,
        overallImpression: submission.overallImpression,
        isGraded: true,
      });

      setPdfToast(true);
      setTimeout(() => setPdfToast(false), 2500);
    } catch (e) {
      console.error('PDF generation error:', e);
    }
  };

  // Play Audio Narration of Student Feedback
  const handlePlayAudio = async (questionId: string, text: string) => {
    if (activeAudioQuestionId === questionId) {
      setActiveAudioQuestionId(null);
      return;
    }

    setIsAudioLoading(questionId);

    try {
      const response = await fetch('/api/speak-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioDataUrl) {
          const audio = new Audio(data.audioDataUrl);
          audio.onended = () => setActiveAudioQuestionId(null);
          audio.onerror = () => {
            fallbackSpeechSynthesis(text);
            setActiveAudioQuestionId(null);
          };
          setActiveAudioQuestionId(questionId);
          await audio.play();
          setIsAudioLoading(null);
          return;
        }
      }
      fallbackSpeechSynthesis(text);
    } catch (e) {
      fallbackSpeechSynthesis(text);
    } finally {
      setIsAudioLoading(null);
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = 'en-US';
      utterance.onend = () => setActiveAudioQuestionId(null);
      utterance.onerror = () => setActiveAudioQuestionId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Final Teacher Approval ("Approved")
  const handleApprove = () => {
    // Celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#34d399', '#f59e0b'],
    });

    onSaveAndApprove({
      ...submission,
      status: 'teacher_approved',
      reviewedAt: new Date().toISOString(),
      teacherSignature: 'Mohamed Weli Jama (Mohaan)',
    });
  };

  // Find index in class list for quick next/prev navigation
  const currentIndex = allSubmissions.findIndex((s) => s.id === submission.id);
  const prevSubmission = currentIndex > 0 ? allSubmissions[currentIndex - 1] : null;
  const nextSubmission = currentIndex < allSubmissions.length - 1 ? allSubmissions[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto py-5 px-4 space-y-5">
      {/* Top Banner & Student Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToScanner}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors shrink-0 cursor-pointer"
            title="Back to Scanner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              {isEditingStudentInfo ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submission.studentName}
                    onChange={(e) => onUpdateSubmission({ ...submission, studentName: e.target.value })}
                    className="text-base font-bold text-slate-900 border border-slate-300 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder="Roll / ID"
                    value={submission.studentId || ''}
                    onChange={(e) => onUpdateSubmission({ ...submission, studentId: e.target.value })}
                    className="text-xs font-mono text-slate-700 border border-slate-300 rounded px-2 py-1 w-24"
                  />
                  <button
                    onClick={() => setIsEditingStudentInfo(false)}
                    className="px-2 py-1 text-xs bg-emerald-600 text-white rounded font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {submission.studentName}
                  </h2>
                  {submission.studentId && (
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                      {submission.studentId}
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditingStudentInfo(true)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Edit student details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {submission.status === 'teacher_approved' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {t.statusApproved}
                </span>
              ) : submission.status === 'flagged' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {t.statusFlagged}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {t.statusDraft}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {submission.overallImpression || 'Graded with Saxe AI Handwriting Engine'}
            </p>
          </div>
        </div>

        {/* Score Card, PDF Export, & Quick Next Student buttons */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Quick PDF Export Button */}
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title="Download official graded PDF report card"
          >
            <FileDown className="w-4 h-4 text-emerald-700" />
            <span>Save as PDF</span>
          </button>

          {/* Tally Pill */}
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2 flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {t.totalScore}
              </div>
              <div className="text-xl font-black text-emerald-400">
                {submission.totalScore}
                <span className="text-xs font-normal text-slate-300"> / {submission.maxScore}</span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-700" />

            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {t.percentage}
              </div>
              <div className={`text-xl font-black ${
                submission.percentage >= 50 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {submission.percentage}%
              </div>
            </div>
          </div>

          {/* Student Carousel Navigation */}
          {allSubmissions.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                disabled={!prevSubmission}
                onClick={() => prevSubmission && onSelectSubmission(prevSubmission.id)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                title="Previous Student"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 text-slate-600">
                {currentIndex + 1} / {allSubmissions.length}
              </span>
              <button
                disabled={!nextSubmission}
                onClick={() => nextSubmission && onSelectSubmission(nextSubmission.id)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                title="Next Student"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfToast && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Official Graded Assessment PDF downloaded successfully!</span>
        </div>
      )}

      {/* Split View: Left = Answer Sheet Viewer, Right = Question Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sheet Photo Viewer with Pan & Zoom */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs lg:sticky lg:top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Original Handwritten Answer Sheet
            </span>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
                className="p-1 rounded text-slate-600 hover:bg-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 font-bold text-slate-600">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1 rounded text-slate-600 hover:bg-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 rounded text-slate-600 hover:bg-white transition-colors ml-1 cursor-pointer"
                title="Rotate 90deg"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Image Container */}
          <div className="relative rounded-xl overflow-auto bg-slate-950 max-h-[580px] flex items-center justify-center p-2 border border-slate-800">
            {submission.imageUri ? (
              <img
                src={submission.imageUri}
                alt="Student Answer Sheet"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full h-auto rounded object-contain shadow-lg"
              />
            ) : (
              <div className="py-24 text-center text-slate-400 text-xs">
                No answer sheet image attached
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Tip: Use the zoom and rotate controls above to inspect messy handwriting.
          </p>
        </div>

        {/* Right Column: Question-by-Question Marking Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Question Breakdown & Teacher Override
            </h3>
            <span className="text-xs text-slate-500">
              {submission.markedQuestions.length} Questions
            </span>
          </div>

          {submission.markedQuestions.map((q) => {
            const isFullScore = q.marksAwarded === q.maxMarks;
            const isZero = q.marksAwarded === 0;
            const isLowConfidence = q.confidence === 'low';

            return (
              <div
                key={q.questionId}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isLowConfidence
                    ? 'border-amber-300 bg-amber-50/20 shadow-xs ring-1 ring-amber-200'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Header: Question Number, Confidence badge, Score override controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      Q{q.questionNumber}
                    </span>

                    {/* Confidence Indicator */}
                    {q.confidence === 'high' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {t.highConfidence}
                      </span>
                    ) : q.confidence === 'medium' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                        <HelpCircle className="w-3 h-3 text-blue-600" />
                        {t.mediumConfidence}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        {t.lowConfidence}
                      </span>
                    )}

                    {q.isOverriddenByTeacher && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        Teacher Override
                      </span>
                    )}
                  </div>

                  {/* Score Tally & Increment/Decrement */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleMarkChange(q.questionId, q.marksAwarded - 0.5)}
                        disabled={q.marksAwarded <= 0}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Minus 0.5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="px-2 py-1 text-xs font-bold text-slate-900 min-w-[50px] text-center">
                        <span className={isFullScore ? 'text-emerald-700' : isZero ? 'text-rose-700' : 'text-slate-900'}>
                          {q.marksAwarded}
                        </span>
                        <span className="text-slate-400 font-normal"> / {q.maxMarks}</span>
                      </div>

                      <button
                        onClick={() => handleMarkChange(q.questionId, q.marksAwarded + 0.5)}
                        disabled={q.marksAwarded >= q.maxMarks}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Plus 0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flag Warning Reason if any */}
                {q.flagReason && (
                  <div className="mt-2.5 p-2 bg-amber-100/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span><strong>Review Note:</strong> {q.flagReason}</span>
                  </div>
                )}

                {/* Question Text */}
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-800">
                    {q.questionText}
                  </p>
                </div>

                {/* What AI Transcribed from Student Handwriting */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t.transcribedHandwriting}</span>
                  </div>
                  <p className="text-xs text-blue-900 font-serif italic bg-white p-2 rounded border border-blue-100">
                    "{q.transcribedAnswer}"
                  </p>
                </div>

                {/* Teacher's Model Answer */}
                <div className="mt-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">{t.modelAnswer} </span>
                  <span className="text-slate-600">{q.correctAnswer}</span>
                </div>

                {/* AI / Teacher Feedback */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.feedbackGiven}</span>
                    </span>

                    {/* Audio Listen Button */}
                    <button
                      onClick={() => handlePlayAudio(q.questionId, q.feedback)}
                      disabled={isAudioLoading === q.questionId}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        activeAudioQuestionId === q.questionId
                          ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>
                        {isAudioLoading === q.questionId
                          ? 'Loading Audio...'
                          : activeAudioQuestionId === q.questionId
                          ? 'Playing Audio...'
                          : t.listenFeedback}
                      </span>
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={q.feedback}
                    onChange={(e) => handleFeedbackChange(q.questionId, e.target.value)}
                    placeholder={t.editFeedbackPlaceholder}
                    className="w-full text-xs rounded-lg border-slate-200 bg-emerald-50/30 p-2.5 text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                  />
                </div>
              </div>
            );
          })}

          {/* Sticky Bottom Save / Approval Action Bar */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">
                Final Teacher Mark & Verification:
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {submission.studentName} · {submission.totalScore} / {submission.maxScore} ({submission.percentage}%)
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-700" />
                <span>Save as PDF</span>
              </button>

              <button
                onClick={handleApprove}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{t.approveAndSave}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
