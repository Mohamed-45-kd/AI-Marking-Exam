import React, { useState } from 'react';
import { 
  AlertOctagon, TrendingUp, CheckCircle, 
  Download, ArrowRight, Users, AlertTriangle, Eye 
} from 'lucide-react';
import { StudentSubmission, Exam, QuestionStat } from '../types/exam';
import { translations as t } from '../translations/i18n';

interface ClassInsightsProps {
  submissions: StudentSubmission[];
  exam: Exam;
  onSelectStudent: (id: string) => void;
  onNavigateToPrint: () => void;
}

export const ClassInsights: React.FC<ClassInsightsProps> = ({
  submissions,
  exam,
  onSelectStudent,
  onNavigateToPrint,
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed' | 'needs_review'>('all');

  // Filter submissions belonging to this exam
  const examSubmissions = submissions.filter((s) => s.examId === exam.id);
  const totalStudents = examSubmissions.length;

  if (totalStudents === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            No graded submissions for this exam yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please head over to "Scan & Mark" to evaluate student answer sheets first.
          </p>
        </div>
      </div>
    );
  }

  // Calculate overall metrics
  const totalPercentageSum = examSubmissions.reduce((acc, curr) => acc + curr.percentage, 0);
  const classAverage = Math.round((totalPercentageSum / totalStudents) * 10) / 10;

  const passedStudents = examSubmissions.filter((s) => s.percentage >= exam.passThreshold);
  const failedStudents = examSubmissions.filter((s) => s.percentage < exam.passThreshold);
  const passRate = Math.round((passedStudents.length / totalStudents) * 100);

  const highestScore = Math.max(...examSubmissions.map((s) => s.percentage));
  const lowestScore = Math.min(...examSubmissions.map((s) => s.percentage));

  // Compute question-by-question analytics
  const questionStats: QuestionStat[] = exam.questions.map((q) => {
    let questionTotalScore = 0;
    let lowConfidenceCount = 0;
    const mistakes: string[] = [];

    examSubmissions.forEach((sub) => {
      const studentQ = sub.markedQuestions.find((mq) => mq.questionNumber === q.number);
      if (studentQ) {
        questionTotalScore += studentQ.marksAwarded;
        if (studentQ.confidence === 'low') lowConfidenceCount++;
        if (studentQ.marksAwarded < q.maxMarks && studentQ.feedback) {
          mistakes.push(studentQ.feedback);
        }
      }
    });

    const averageScore = Math.round((questionTotalScore / totalStudents) * 10) / 10;
    const accuracyRate = q.maxMarks > 0
      ? Math.round((averageScore / q.maxMarks) * 100)
      : 0;

    return {
      questionNumber: q.number,
      questionText: q.questionText,
      topic: q.topic || `Question ${q.number}`,
      averageScore,
      maxScore: q.maxMarks,
      accuracyRate,
      lowConfidenceCount,
      commonMistakes: mistakes.slice(0, 2),
      needsRevision: accuracyRate < 60, // If less than 60% of class got it right, flag for revision
    };
  });

  // Topics that need class re-teaching
  const revisionQuestions = questionStats.filter((qs) => qs.needsRevision);

  // Filtered student list
  const filteredSubmissions = examSubmissions.filter((sub) => {
    if (filter === 'passed') return sub.percentage >= exam.passThreshold;
    if (filter === 'failed') return sub.percentage < exam.passThreshold;
    if (filter === 'needs_review') return sub.status === 'flagged' || sub.status === 'ai_draft';
    return true;
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Student Name', 'Student ID', 'Total Score', 'Max Score', 'Percentage', 'Status', 'Date'];
    const rows = examSubmissions.map((s) => [
      `"${s.studentName}"`,
      `"${s.studentId || ''}"`,
      s.totalScore,
      s.maxScore,
      `${s.percentage}%`,
      s.status,
      s.markedAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exam.title.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Title & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              {exam.subject} · {exam.gradeClass}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            {t.insightsTitle}: {exam.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t.insightsSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={onNavigateToPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <span>{t.printSlips}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Class Average */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t.statClassAverage}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{classAverage}%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {totalStudents} students
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, classAverage)}%` }}
            />
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t.passRate}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{passRate}%</span>
            <span className="text-xs font-medium text-slate-500">
              ({passedStudents.length}/{totalStudents})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${passRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, passRate)}%` }}
            />
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t.highestScore}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {highestScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Highest class score recorded
          </p>
        </div>

        {/* Lowest Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t.lowestScore}
          </span>
          <div className={`text-2xl sm:text-3xl font-black ${lowestScore < 50 ? 'text-rose-600' : 'text-slate-700'}`}>
            {lowestScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Candidate for targeted review
          </p>
        </div>
      </div>

      {/* Actionable Re-Teaching Alerts */}
      {revisionQuestions.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h3 className="font-extrabold text-amber-950 text-base">
                {t.topicsToReviseTitle}
              </h3>
              <p className="text-xs text-amber-900 mt-0.5 mb-3">
                {t.topicsToReviseDesc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {revisionQuestions.map((rq) => (
                  <div
                    key={rq.questionNumber}
                    className="bg-white/90 rounded-xl p-3.5 border border-amber-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs">
                        Question {rq.questionNumber}: {rq.topic}
                      </span>
                      <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {rq.accuracyRate}% Accuracy
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                      "{rq.questionText}"
                    </p>

                    {rq.commonMistakes.length > 0 && (
                      <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 p-2 rounded">
                        <strong>Common gap: </strong>
                        {rq.commonMistakes[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Accuracy Heatmap */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {t.questionDifficultyTitle}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Average marks earned by the class for each specific question:
        </p>

        <div className="space-y-3">
          {questionStats.map((qs) => {
            const isCritical = qs.accuracyRate < 50;
            const isMedium = qs.accuracyRate >= 50 && qs.accuracyRate < 75;
            const isGood = qs.accuracyRate >= 75;

            return (
              <div key={qs.questionNumber} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Q{qs.questionNumber}. {qs.topic}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">
                      {qs.averageScore} / {qs.maxScore} marks
                    </span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      isGood ? 'bg-emerald-100 text-emerald-800' : isMedium ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {qs.accuracyRate}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      isGood ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${qs.accuracyRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Graded Student Roster
            </h3>
            <span className="text-xs text-slate-500">
              {filteredSubmissions.length} of {totalStudents} students
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All ({totalStudents})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'passed' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {t.statusPass} ({passedStudents.length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'failed' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {t.statusFail} ({failedStudents.length})
            </button>
            <button
              onClick={() => setFilter('needs_review')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'needs_review' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {t.statNeedsReview}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">{t.studentName}</th>
                <th className="py-3 px-3">{t.studentId}</th>
                <th className="py-3 px-3">{t.totalScore}</th>
                <th className="py-3 px-3">{t.percentage}</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((sub) => {
                const isPass = sub.percentage >= exam.passThreshold;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sub.studentName}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {sub.studentId || '-'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {sub.totalScore} / {sub.maxScore}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full ${
                        isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {sub.status === 'teacher_approved' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      ) : sub.status === 'flagged' ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Needs Review
                        </span>
                      ) : (
                        <span className="text-blue-700 font-medium">
                          AI Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(sub.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
