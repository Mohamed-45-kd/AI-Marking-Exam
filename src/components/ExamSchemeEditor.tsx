import React, { useState } from 'react';
import { Plus, Trash2, Save, Sparkles, BookOpen, Check } from 'lucide-react';
import { Exam, QuestionScheme } from '../types/exam';
import { translations as t } from '../translations/i18n';

interface ExamSchemeEditorProps {
  exams: Exam[];
  selectedExamId: string;
  onSelectExam: (id: string) => void;
  onSaveExam: (exam: Exam) => void;
}

export const ExamSchemeEditor: React.FC<ExamSchemeEditorProps> = ({
  exams,
  selectedExamId,
  onSelectExam,
  onSaveExam,
}) => {
  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const [formData, setFormData] = useState<Exam>(activeExam);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Sync formData when selectedExam changes
  React.useEffect(() => {
    const ex = exams.find((e) => e.id === selectedExamId) || exams[0];
    setFormData(ex);
  }, [selectedExamId, exams]);

  // Handle Question Changes
  const handleQuestionUpdate = (index: number, field: keyof QuestionScheme, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQ: QuestionScheme = {
      id: `q_${Date.now()}`,
      number: formData.questions.length + 1,
      questionText: '',
      questionType: 'short_answer',
      correctAnswer: '',
      maxMarks: 2,
      partialCreditCriteria: 'Award partial mark for correct method or partial answer',
    };
    setFormData({ ...formData, questions: [...formData.questions, newQ] });
  };

  // Remove a question
  const handleRemoveQuestion = (index: number) => {
    const updated = formData.questions.filter((_, i) => i !== index).map((q, idx) => ({
      ...q,
      number: idx + 1,
    }));
    setFormData({ ...formData, questions: updated });
  };

  // Create a brand new exam
  const handleCreateNew = () => {
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: 'New Examination',
      subject: 'General Science',
      gradeClass: 'Grade 8',
      term: 'Term 1',
      academicYear: '2025/2026',
      passThreshold: 50,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: `q_1`,
          number: 1,
          questionText: '',
          questionType: 'short_answer',
          correctAnswer: '',
          maxMarks: 3,
        },
      ],
    };
    setFormData(newExam);
  };

  // Save Exam
  const handleSave = () => {
    onSaveExam(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // AI Scheme Generator in English
  const handleGenerateWithAi = async () => {
    if (!aiTopicInput.trim()) return;
    setIsAiGenerating(true);

    try {
      const response = await fetch('/api/generate-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: aiTopicInput,
          subject: formData.subject,
          grade: formData.gradeClass,
          numQuestions: 5,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate scheme');
      const data = await response.json();

      if (data.scheme && data.scheme.questions) {
        setFormData({
          ...formData,
          title: data.scheme.examTitle || formData.title,
          questions: data.scheme.questions.map((q: any, idx: number) => ({
            id: `q_ai_${idx + 1}`,
            number: idx + 1,
            questionText: q.questionText,
            questionType: q.questionType || 'short_answer',
            correctAnswer: q.correctAnswer,
            maxMarks: q.maxMarks || 2,
            acceptableVariations: q.acceptableVariations || [],
            partialCreditCriteria: q.partialCreditCriteria || '',
          })),
        });
        setShowAiModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>{t.examManagerTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Configure questions, model answers, points, and partial credit criteria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.aiSuggestScheme}</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createNewExam}</span>
          </button>
        </div>
      </div>

      {/* Select Active Exam Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {exams.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelectExam(ex.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
              ex.id === selectedExamId
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {ex.title} ({ex.questions.length} Questions)
          </button>
        ))}
      </div>

      {/* Exam Details Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.examTitleLabel}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-sm font-semibold rounded-lg border-slate-300 bg-slate-50 p-2.5 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.subjectLabel}
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full text-sm font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.gradeLabel}
            </label>
            <input
              type="text"
              value={formData.gradeClass}
              onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
              className="w-full text-sm font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.termLabel}
            </label>
            <input
              type="text"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              className="w-full text-sm font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              className="w-full text-sm font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Question Scheme Cards */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {formData.questions.length} {t.questionsCount}
            </h3>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Total Points Available:{' '}
              {formData.questions.reduce((sum, q) => sum + Number(q.maxMarks || 0), 0)} Marks
            </span>
          </div>

          {formData.questions.map((q, index) => (
            <div
              key={q.id || index}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {q.number}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Question {q.number}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span>{t.maxMarksLabel}:</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={q.maxMarks}
                      onChange={(e) => handleQuestionUpdate(index, 'maxMarks', parseFloat(e.target.value) || 1)}
                      className="w-16 text-center text-xs font-bold rounded border-slate-300 p-1 bg-white"
                    />
                  </div>

                  {formData.questions.length > 1 && (
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div>
                <input
                  type="text"
                  placeholder="Enter question text..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionUpdate(index, 'questionText', e.target.value)}
                  className="w-full text-xs font-medium rounded-lg border-slate-300 bg-white p-2.5 focus:border-emerald-500"
                />
              </div>

              {/* Model Answer */}
              <div>
                <textarea
                  rows={2}
                  placeholder="Enter model / correct answer..."
                  value={q.correctAnswer}
                  onChange={(e) => handleQuestionUpdate(index, 'correctAnswer', e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2.5 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Partial Credit Guideline */}
              <div>
                <input
                  type="text"
                  placeholder="Partial credit criteria (e.g., 1 mark for formula, 2 marks for working)..."
                  value={q.partialCreditCriteria || ''}
                  onChange={(e) => handleQuestionUpdate(index, 'partialCreditCriteria', e.target.value)}
                  className="w-full text-[11px] rounded-lg border-slate-200 bg-white/80 p-2 text-slate-600"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleAddQuestion}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors bg-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addQuestion}</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {saveToast && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Exam marking scheme successfully saved!
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveExam}</span>
          </button>
        </div>
      </div>

      {/* AI Scheme Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">
                Generate Marking Scheme with AI
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Enter any syllabus topic or lesson concept, and Gemini will automatically structure questions, model answers, and points:
            </p>

            <textarea
              rows={3}
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              placeholder="e.g., Grade 8 General Science - Photosynthesis, Cellular Respiration, and Plant Organelles"
              className="w-full text-xs rounded-xl border-slate-300 p-3 focus:border-emerald-500 focus:ring-emerald-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating || !aiTopicInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isAiGenerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Scheme</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
