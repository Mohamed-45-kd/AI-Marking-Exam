import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, AlertCircle, RefreshCw, CheckCircle2, 
  UserCheck, ArrowRight, FileDown, Check, User, Hash, Calendar, Phone, 
  FileText, ShieldCheck
} from 'lucide-react';
import { Exam, StudentSubmission, StudentDetails } from '../types/exam';
import { translations as t } from '../translations/i18n';
import { SAMPLE_STUDENT_PRESETS } from '../data/sampleExams';
import { generateSyntheticSheetDataUrl } from '../utils/sheetCanvasGenerator';
import { downloadStudentPdf } from '../utils/pdfGenerator';

interface PaperScannerProps {
  exams: Exam[];
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  onGradingComplete: (submission: StudentSubmission) => void;
}

export const PaperScanner: React.FC<PaperScannerProps> = ({
  exams,
  selectedExamId,
  setSelectedExamId,
  onGradingComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [pdfDownloadedToast, setPdfDownloadedToast] = useState(false);

  // Student Details State for intake and PDF collection
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    studentName: '',
    studentId: '',
    gradeClass: currentExam.gradeClass || 'Grade 8',
    examDate: new Date().toISOString().split('T')[0],
    examinerName: 'Mohamed Weli Jama (Mohaan)',
    guardianContact: '',
    notes: '',
  });

  // Keep gradeClass in sync when exam changes if studentDetails hasn't been custom modified
  React.useEffect(() => {
    if (currentExam) {
      setStudentDetails((prev) => ({
        ...prev,
        gradeClass: prev.gradeClass || currentExam.gradeClass,
      }));
    }
  }, [currentExam]);

  // Helper to downscale large camera images for fast, resilient uploads
  const downscaleImageForUpload = (dataUrl: string, maxDimension = 1400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension) {
          resolve(dataUrl);
          return;
        }
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Handle image upload from file or camera
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawUrl = e.target?.result as string;
        const optimized = await downscaleImageForUpload(rawUrl);
        setSelectedImage(optimized);
        setSelectedPresetIndex(null);
        setErrorMessage(null);
      } catch (err) {
        setSelectedImage(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load one of the realistic student answer sheet presets
  const handleSelectPreset = (index: number) => {
    const preset = SAMPLE_STUDENT_PRESETS[index];
    setSelectedPresetIndex(index);
    setErrorMessage(null);

    // Auto-fill student details from preset
    setStudentDetails({
      studentName: preset.name,
      studentId: preset.id,
      gradeClass: currentExam.gradeClass,
      examDate: new Date().toISOString().split('T')[0],
      examinerName: 'Mohamed Weli Jama (Mohaan)',
      guardianContact: '',
      notes: preset.handwritingStyle === 'messy'
        ? 'Messy handwriting paper - low confidence flag check'
        : 'Regular class examination paper',
    });

    // Generate high-resolution synthetic handwritten paper in English
    const dataUrl = generateSyntheticSheetDataUrl({
      name: preset.name,
      id: preset.id,
      examTitle: currentExam.title,
      date: preset.date,
      answers: preset.answers,
      handwritingStyle: preset.handwritingStyle,
    });

    setSelectedImage(dataUrl);
  };

  // Save student details & sheet image as PDF
  const handleSaveAsPdf = () => {
    try {
      const activeName = studentDetails.studentName.trim() || 'Student';
      const filename = `${activeName.replace(/\s+/g, '_')}_${currentExam.title.slice(0, 20).replace(/\s+/g, '_')}_Intake.pdf`;

      downloadStudentPdf(
        {
          studentDetails,
          exam: currentExam,
          imageUri: selectedImage,
          isGraded: false,
        },
        filename
      );

      setPdfDownloadedToast(true);
      setTimeout(() => setPdfDownloadedToast(false), 3000);
    } catch (e: any) {
      console.error('Error generating PDF:', e);
      setErrorMessage('Failed to generate PDF. Please try again.');
    }
  };

  // Run AI multimodal grading pipeline
  const handleStartMarking = async () => {
    if (!selectedImage) {
      setErrorMessage('Please capture or upload an answer sheet photo first.');
      return;
    }

    setIsProcessing(true);
    setProgressStep(1);
    setErrorMessage(null);

    // Step simulation timers for user engagement
    const timer1 = setTimeout(() => setProgressStep(2), 1200);
    const timer2 = setTimeout(() => setProgressStep(3), 2800);
    const timer3 = setTimeout(() => setProgressStep(4), 4500);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const optimizedImage = await downscaleImageForUpload(selectedImage);

      const response = await fetch('/api/mark-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: optimizedImage,
          mimeType: 'image/jpeg',
          markingScheme: currentExam,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark paper');
      }

      const result = await response.json();

      // Check if any question has low confidence to flag status
      const hasLowConfidence = result.markedQuestions.some((q: any) => q.confidence === 'low');

      // Resolve final student name & ID (prefer manual input, fallback to AI detection)
      const finalName = studentDetails.studentName.trim() || result.detectedStudentName || 'Student';
      const finalId = studentDetails.studentId.trim() || result.detectedStudentId || '';

      const submission: StudentSubmission = {
        id: `sub_${Date.now()}`,
        examId: currentExam.id,
        studentName: finalName,
        studentId: finalId,
        gradeClass: studentDetails.gradeClass || currentExam.gradeClass,
        examDate: studentDetails.examDate,
        examinerName: studentDetails.examinerName,
        guardianContact: studentDetails.guardianContact,
        notes: studentDetails.notes,
        imageUri: selectedImage,
        markedQuestions: result.markedQuestions,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        overallImpression: result.overallImpression,
        status: hasLowConfidence ? 'flagged' : 'ai_draft',
        markedAt: new Date().toISOString(),
      };

      setIsProcessing(false);
      onGradingComplete(submission);
    } catch (err: any) {
      console.error('Marking error:', err);
      setIsProcessing(false);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setErrorMessage('Evaluation request timed out. Please try again or select a clearer image.');
      } else if (err?.message && err.message.includes('Failed to fetch')) {
        setErrorMessage('Connection issue reached during upload. The image has been auto-optimized; please click Start AI Grading to retry.');
      } else {
        setErrorMessage(
          err.message || 'An error occurred during AI grading. Please try again.'
        );
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Title & Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>{t.scannerTitle}</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              {t.scannerSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentExam.subject} · {currentExam.gradeClass}
            </span>
          </div>
        </div>

        {/* Configuration Selectors */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.selectExamLabel}
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 bg-slate-50 p-2.5 font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
            >
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.questions.length} Questions · {exam.gradeClass})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Upload / Capture & Student Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Picker & Preview */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>1. Answer Sheet Photo</span>
              </span>
              {selectedImage && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Loaded
                </span>
              )}
            </div>

            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Answer Sheet Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Answer Sheet Ready</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedPresetIndex(null);
                    }}
                    className="flex-1 py-2.5 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>

                  <button
                    onClick={handleStartMarking}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Start AI Grading</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFile(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer min-h-[300px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                  }}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
                  <Camera className="w-7 h-7" />
                </div>

                <h3 className="font-bold text-slate-800 text-base mb-1">
                  {t.snapPhoto} / {t.uploadPhoto}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  {t.dropZoneText}
                </p>

                <div className="flex flex-wrap gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.snapPhoto}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.uploadPhoto}</span>
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.quickSampleLabel}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                1-Click Load
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_STUDENT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedPresetIndex === idx
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {preset.id} · {preset.handwritingStyle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Student Details Intake & PDF Save Section */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Student & Examination Details
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Collect and save intake data into an official PDF document
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                PDF Ready
              </span>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Student Name */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Full Name:</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Amina Watson"
                  value={studentDetails.studentName}
                  onChange={(e) => setStudentDetails({ ...studentDetails, studentName: e.target.value })}
                  className="w-full text-xs font-semibold rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Student ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student ID / Roll No:</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., ST-8041"
                  value={studentDetails.studentId}
                  onChange={(e) => setStudentDetails({ ...studentDetails, studentId: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Grade / Class */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Class / Section:</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grade 8A"
                  value={studentDetails.gradeClass}
                  onChange={(e) => setStudentDetails({ ...studentDetails, gradeClass: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exam Date:</span>
                </label>
                <input
                  type="date"
                  value={studentDetails.examDate}
                  onChange={(e) => setStudentDetails({ ...studentDetails, examDate: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Teacher / Examiner */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Examiner / Teacher:</span>
                </label>
                <input
                  type="text"
                  placeholder="Teacher Name"
                  value={studentDetails.examinerName}
                  onChange={(e) => setStudentDetails({ ...studentDetails, examinerName: e.target.value })}
                  className="w-full text-xs font-medium rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Guardian Contact */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guardian Contact / Phone (Optional):</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., +252 63... or parent@example.com"
                  value={studentDetails.guardianContact || ''}
                  onChange={(e) => setStudentDetails({ ...studentDetails, guardianContact: e.target.value })}
                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>

              {/* Intake Notes */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Intake Notes / Paper Condition (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., First sitting, clear ballpoint pen script, full attempt"
                  value={studentDetails.notes || ''}
                  onChange={(e) => setStudentDetails({ ...studentDetails, notes: e.target.value })}
                  className="w-full text-xs rounded-lg border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* PDF Export Action Card */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                <FileDown className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">
                    Save as PDF Record
                  </span>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Compiles student details, exam metadata, and the attached answer sheet image into an official downloadable PDF file.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsPdf}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>Save Intake as PDF</span>
                </button>

                {selectedImage && (
                  <button
                    type="button"
                    onClick={handleStartMarking}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Grade Sheet with AI</span>
                  </button>
                )}
              </div>

              {pdfDownloadedToast && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>PDF successfully created and saved to your Downloads!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal / Step Progress */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-25" />
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t.analyzingSheet}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Google Gemini 3.8 Flash Multimodal Vision
              </p>
            </div>

            {/* Step progress list */}
            <div className="space-y-2.5 text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className={`flex items-center gap-2 ${progressStep >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-4 h-4 ${progressStep >= 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{t.analyzingStep1}</span>
              </div>
              <div className={`flex items-center gap-2 ${progressStep >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-4 h-4 ${progressStep >= 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{t.analyzingStep2}</span>
              </div>
              <div className={`flex items-center gap-2 ${progressStep >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-4 h-4 ${progressStep >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{t.analyzingStep3}</span>
              </div>
              <div className={`flex items-center gap-2 ${progressStep >= 4 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-4 h-4 ${progressStep >= 4 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>{t.analyzingStep4}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Processing in seconds with full reasoning...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
