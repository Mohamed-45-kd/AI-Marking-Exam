import { jsPDF } from 'jspdf';
import { StudentDetails, Exam, MarkedQuestion, StudentSubmission } from '../types/exam';

interface GeneratePdfOptions {
  studentDetails: StudentDetails;
  exam: Exam;
  imageUri?: string | null;
  markedQuestions?: MarkedQuestion[];
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  overallImpression?: string;
  isGraded?: boolean;
}

/**
 * Generates an official, beautifully structured PDF document
 * with examination board styling, student metadata, embedded answer sheet,
 * question breakdown, and signature block.
 */
export function generateStudentSheetPdf(options: GeneratePdfOptions): jsPDF {
  const {
    studentDetails,
    exam,
    imageUri,
    markedQuestions,
    totalScore,
    maxScore,
    percentage,
    overallImpression,
    isGraded = false,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner (Navy / Emerald gradient feel)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 22, 'F');

  // Decorative Emerald line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, margin + 21, contentWidth, 1.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL EXAMINATION BOARD · STUDENT RECORD', margin + 6, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('SAXE AI EXAM MARKER SYSTEM · VERIFIED ASSESSMENT DOCKET', margin + 6, margin + 14);

  const docTypeLabel = isGraded ? 'ASSESSMENT & GRADE REPORT' : 'EXAM INTAKE & ANSWER SHEET';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 231, 183); // emerald-300
  doc.text(docTypeLabel, pageWidth - margin - 6, margin + 14, { align: 'right' });

  let currentY = margin + 28;

  // Exam Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(exam.title, margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${exam.subject} · ${studentDetails.gradeClass || exam.gradeClass} · ${exam.term}`, margin, currentY);

  currentY += 6;

  // Student Details Box (Card)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

  const col1 = margin + 4;
  const col2 = margin + 55;
  const col3 = margin + 115;

  let rowY = currentY + 6;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('STUDENT FULL NAME:', col1, rowY);
  doc.text('STUDENT ID / ROLL NO:', col2, rowY);
  doc.text('EXAMINATION DATE:', col3, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(studentDetails.studentName || 'Not Specified', col1, rowY);
  doc.text(studentDetails.studentId || 'N/A', col2, rowY);
  doc.text(studentDetails.examDate || new Date().toISOString().split('T')[0], col3, rowY);

  // Row 2
  rowY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLASS / SECTION:', col1, rowY);
  doc.text('EXAMINER / TEACHER:', col2, rowY);
  doc.text(isGraded ? 'TOTAL SCORE / RESULT:' : 'CONTACT / PHONE:', col3, rowY);

  rowY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(studentDetails.gradeClass || exam.gradeClass, col1, rowY);
  doc.text(studentDetails.examinerName || 'Mohamed Weli Jama (Mohaan)', col2, rowY);

  if (isGraded && totalScore !== undefined && maxScore !== undefined) {
    const isPass = (percentage ?? 0) >= exam.passThreshold;
    doc.setTextColor(isPass ? 5 : 225, isPass ? 150 : 29, isPass ? 105 : 72);
    doc.text(`${totalScore} / ${maxScore} (${percentage}%) - ${isPass ? 'PASSED' : 'NEEDS SUPPORT'}`, col3, rowY);
  } else {
    doc.text(studentDetails.guardianContact || 'None provided', col3, rowY);
  }

  currentY += 33;

  // Notes if available
  if (studentDetails.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Intake Notes: "${studentDetails.notes}"`, margin, currentY);
    currentY += 5;
  }

  // If Graded Assessment: Render Results Summary Table
  if (isGraded && markedQuestions && markedQuestions.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('QUESTION-BY-QUESTION EVALUATION BREAKDOWN', margin + 3, currentY + 4.2);

    currentY += 7;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Q#', margin + 2, currentY + 3.8);
    doc.text('Question & Transcribed Student Answer', margin + 12, currentY + 3.8);
    doc.text('Score', margin + 115, currentY + 3.8);
    doc.text('Teacher / AI Feedback', margin + 132, currentY + 3.8);

    currentY += 6;

    markedQuestions.forEach((q) => {
      // Check page break
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = margin + 10;
      }

      const qBoxHeight = 12;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + qBoxHeight, margin + contentWidth, currentY + qBoxHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${q.questionNumber}`, margin + 2, currentY + 4);

      // Question snippet
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const qText = doc.splitTextToSize(q.questionText, 98);
      doc.text(qText[0] || '', margin + 12, currentY + 4);

      // Student Answer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      const ansText = doc.splitTextToSize(`Ans: "${q.transcribedAnswer}"`, 98);
      doc.text(ansText[0] || '', margin + 12, currentY + 8);

      // Score
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(q.marksAwarded === q.maxMarks ? 5 : 15, q.marksAwarded === q.maxMarks ? 150 : 23, q.marksAwarded === q.maxMarks ? 105 : 42);
      doc.text(`${q.marksAwarded} / ${q.maxMarks}`, margin + 115, currentY + 5);

      // Feedback snippet
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const fbText = doc.splitTextToSize(q.feedback || 'Good work', 48);
      doc.text(fbText[0] || '', margin + 132, currentY + 4);
      if (fbText[1]) doc.text(fbText[1], margin + 132, currentY + 7.5);

      currentY += qBoxHeight;
    });

    currentY += 4;
  }

  // Answer Sheet Image Section
  if (imageUri) {
    // If not much space left, start a new page for clean presentation
    if (currentY > pageHeight - 110) {
      doc.addPage();
      currentY = margin + 10;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('ATTACHED STUDENT HANDWRITTEN ANSWER SHEET IMAGE', margin + 3, currentY + 4);

    currentY += 7;

    try {
      const maxImgHeight = Math.min(130, pageHeight - currentY - 32);
      const imgWidth = contentWidth;
      const imgHeight = maxImgHeight;

      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, currentY, imgWidth, imgHeight);
      doc.addImage(imageUri, 'JPEG', margin + 1, currentY + 1, imgWidth - 2, imgHeight - 2, undefined, 'FAST');
      currentY += imgHeight + 6;
    } catch (e) {
      console.warn('Could not render image inside PDF:', e);
    }
  }

  // Footer: Signatures and Verification
  if (currentY > pageHeight - 25) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, pageHeight - 22, margin + contentWidth, pageHeight - 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Document Reference: SAXE-DOC-${Date.now().toString().slice(-6)} · Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Examiner Signature: ${studentDetails.examinerName || 'Mohamed Weli Jama (Mohaan)'}`, pageWidth - margin, pageHeight - 17, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Saxe AI Exam Marker System · AI Assistance with Human-in-the-Loop Authority', margin, pageHeight - 12);

  return doc;
}

/**
 * Convenience helper to immediately trigger PDF download in the browser
 */
export function downloadStudentPdf(options: GeneratePdfOptions, filename?: string) {
  const doc = generateStudentSheetPdf(options);
  const safeName = (options.studentDetails.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeExam = options.exam.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const defaultFilename = filename || `${safeName}_${safeExam}_Record.pdf`;
  doc.save(defaultFilename);
}
