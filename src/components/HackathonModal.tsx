import React from 'react';
import { X, Award, CheckCircle2, ShieldCheck, Cpu, Clock, School, Sparkles } from 'lucide-react';

interface HackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonModal: React.FC<HackathonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              NYLP AI Hackathon 2026 · Build AI for Real-World Impact
            </span>
          </div>

          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <span>Saxe – AI Exam Marker</span>
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            Submitted by <strong className="text-white">Mohamed Weli Jama (Mohaan)</strong> · Category: Education
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* One-Line Pitch */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 text-base">One-Line Pitch</h4>
              <p className="text-emerald-800 font-medium mt-0.5">
                "Saxe turns hours of hand-marking into minutes, so students get their marks and real feedback the same day."
              </p>
            </div>
          </div>

          {/* Problem & Motivation */}
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-2 mb-3">
              <School className="w-4 h-4 text-emerald-600" />
              Problem: Why Hand-Marking Breaks Down
            </h3>
            <p className="text-slate-600 mb-2">
              Teachers mark every exam and quiz by hand, so students wait days or weeks for results and get little explanation of their mistakes:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">Overloaded Educators:</strong>
                Many teachers teach multiple large classes and mark papers late into their evenings and weekends.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">Thin Feedback:</strong>
                Under time pressure, papers only receive a tick, cross, and final number. Students learn they were wrong, not <em>why</em>.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">No Class-Level Insight:</strong>
                Teachers lack time to tally which questions most students missed; curriculum gaps carry into national examinations.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">Existing Tools Don't Fit:</strong>
                Most automated grading tools require typed text, online devices, and high-bandwidth internet. Real students write on paper.
              </li>
            </ul>
          </div>

          {/* AI Architecture & Methodology */}
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-2 mb-3">
              <Cpu className="w-4 h-4 text-emerald-600" />
              AI Methodology: Multimodal Vision + Pedagogical Reasoning
            </h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Model:</strong> Google Gemini 3.8 Flash via the Gemini API (vision + text) running on a secure Express backend server.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Handwriting Transcription:</strong> Multimodal recognition transcribes handwritten answers and associates them with question numbers.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Partial Credit:</strong> Accurately evaluates intermediate mathematical steps, scientific reasoning, and conceptual descriptions.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Constructive Feedback:</strong> Writes concise, student-friendly 1–2 sentence explanations for every mark deducted.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Code-Calculated Totals:</strong> To eliminate hallucination risks, totals and percentages are calculated in program code, not by the model.</span>
              </div>
            </div>
          </div>

          {/* Responsible AI & Privacy */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Responsible AI & Human-in-the-Loop Principles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-950">
              <p>• <strong>Teacher in Full Control:</strong> AI suggests marks; the teacher can override any score before saving.</p>
              <p>• <strong>No Guessing:</strong> Illegible or messy handwriting is flagged with "low confidence" rather than guessed.</p>
              <p>• <strong>Privacy by Design:</strong> Only student first name/ID is captured; no facial photos or sensitive records.</p>
              <p>• <strong>Secure Backend:</strong> API keys remain exclusively on the server and are never sent to the browser.</p>
            </div>
          </div>

          {/* Impact & Future Roadmap */}
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              Real-World Impact & Roadmap
            </h3>
            <p className="text-slate-600 text-xs leading-normal">
              Giving teachers back their evenings and giving students actionable, same-day feedback they can learn from.
              Next milestones include batch upload for entire classes, offline mobile photo queueing, and integration with school management grade books.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            NYLP AI Hackathon 2026 · Mohamed Weli Jama (Mohaan)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
