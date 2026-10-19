import React, { useState } from 'react';
import { Printer, ArrowLeft, CheckCircle2, School, FileDown, Check } from 'lucide-react';
import { StudentSubmission, Exam } from '../types/exam';
import { translations as t } from '../translations/i18n';
import { downloadStudentPdf } from '../utils/pdfGenerator';

interface PrintSlipsProps {
  submissions: StudentSubmission[];
  exam: Exam;
  onBack: () => void;
}

export const PrintSlips: React.FC<PrintSlipsProps> = ({
  submissions,
  exam,
  onBack,
}) => {
  const examSubmissions = submissions.filter((s) => s.examId === exam.id);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSinglePdf = (sub: StudentSubmission) => {
    try {
      const studentDetails = {
        studentName: sub.studentName,
        studentId: sub.studentId || '',
        gradeClass: sub.gradeClass || exam.gradeClass,
        examDate: sub.examDate || new Date(sub.markedAt).toISOString().split('T')[0],
        examinerName: sub.examinerName || 'Mohamed Weli Jama (Mohaan)',
        guardianContact: sub.guardianContact,
        notes: sub.notes,
      };

      downloadStudentPdf({
        studentDetails,
        exam,
        imageUri: sub.imageUri,
        markedQuestions: sub.markedQuestions,
        totalScore: sub.totalScore,
        maxScore: sub.maxScore,
        percentage: sub.percentage,
        overallImpression: sub.overallImpression,
        isGraded: true,
      });

      setDownloadToast(`Saved PDF for ${sub.studentName}`);
      setTimeout(() => setDownloadToast(null), 2500);
    } catch (e) {
      console.error('Error saving PDF:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Controls Bar (Hidden during print) */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.navPrintSlips}: {exam.title}
            </h2>
            <p className="text-xs text-slate-500">
              Ready to print or save {examSubmissions.length} official student performance slips
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Slips</span>
          </button>
        </div>
      </div>

      {downloadToast && (
        <div className="no-print p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Slips Container */}
      <div className="space-y-8">
        {examSubmissions.map((sub) => {
          const isPass = sub.percentage >= exam.passThreshold;

          return (
            <div
              key={sub.id}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-xs break-inside-avoid print:border-slate-400 print:shadow-none print:p-6 print:mb-8 relative"
            >
              {/* Slip Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-slate-800" />
                    REGIONAL EDUCATION BOARD · OFFICIAL EXAMINATION REPORT
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {exam.title}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5 flex gap-3">
                    <span><strong>Class:</strong> {sub.gradeClass || exam.gradeClass}</span>
                    <span>·</span>
                    <span><strong>Term:</strong> {exam.term}</span>
                    <span>·</span>
                    <span><strong>Date:</strong> {new Date(sub.markedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Score</div>
                  <div className="text-2xl font-black text-slate-900">
                    {sub.totalScore} / {sub.maxScore}
                  </div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {sub.percentage}% ({isPass ? 'Passed' : 'Needs Support'})
                  </div>
                </div>
              </div>

              {/* Student Metadata Box & Download Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap justify-between items-center gap-2 text-xs">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-slate-500">{t.studentName}: </span>
                    <strong className="text-slate-900 text-sm">{sub.studentName}</strong>
                  </div>
                  {sub.studentId && (
                    <div>
                      <span className="text-slate-500">{t.studentId}: </span>
                      <strong className="font-mono text-slate-800">{sub.studentId}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Grading Authority: </span>
                    <strong className="text-emerald-800">Saxe AI & Teacher Verified</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadSinglePdf(sub)}
                  className="no-print inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Save Slip as PDF</span>
                </button>
              </div>

              {/* Question Feedback Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-2 w-10">#</th>
                      <th className="py-2 px-2">Question & Student Response</th>
                      <th className="py-2 px-2 w-24">Marks</th>
                      <th className="py-2 px-2">Teacher Feedback & Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sub.markedQuestions.map((q) => (
                      <tr key={q.questionId} className="align-top">
                        <td className="py-2.5 px-2 font-bold text-slate-900">
                          Q{q.questionNumber}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-semibold text-slate-800">{q.questionText}</div>
                          <div className="text-slate-500 italic mt-0.5 text-[11px]">
                            Student answer: "{q.transcribedAnswer}"
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-bold whitespace-nowrap">
                          {q.marksAwarded} / {q.maxMarks}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700">
                          {q.feedback || 'Full credit awarded'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Teacher Signature Stamp */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saxe - AI Exam Marker (Mohamed Weli Jama)</span>
                </div>

                <div className="text-right">
                  <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-signature text-slate-800 font-serif italic text-center">
                    {sub.teacherSignature || 'Mohamed Weli Jama (Mohaan)'}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">Teacher Signature & Verification</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
