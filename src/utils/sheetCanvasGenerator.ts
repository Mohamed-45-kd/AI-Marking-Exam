/**
 * Generates realistic student handwritten answer sheet images
 * with notebook lines, margin, stamp, student header, and handwriting styles
 */
export function generateSyntheticSheetDataUrl(student: {
  name: string;
  id: string;
  examTitle: string;
  date: string;
  answers: Array<{ qNum: number; answer: string }>;
  handwritingStyle?: 'neat' | 'average' | 'messy';
}): string {
  const width = 900;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Aged slightly-warm notebook paper
  ctx.fillStyle = '#fbfbf7';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper texture / noise lines
  ctx.strokeStyle = '#e9e6dd';
  ctx.lineWidth = 1;

  // Blue notebook horizontal lines
  const lineHeight = 38;
  const startY = 160;
  ctx.strokeStyle = '#d4e1ed';
  for (let y = startY; y < height - 60; y += lineHeight) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }

  // Red margin line on the left (typical school notebook)
  ctx.strokeStyle = '#f2a8a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 40);
  ctx.lineTo(140, height - 40);
  ctx.stroke();

  // School Examination Board Header Stamp
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('REGIONAL EDUCATION BOARD · OFFICIAL EXAMINATION', 160, 60);
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('STUDENT HANDWRITTEN ANSWER SHEET', 160, 82);

  // Student Info Header Box
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(160, 100, width - 200, 44);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Student Name:', 170, 126);
  ctx.fillText('Roll / ID:', 520, 126);
  ctx.fillText('Date:', 720, 126);

  // Handwritten student name & info (Blue ink)
  ctx.fillStyle = student.handwritingStyle === 'messy' ? '#1d4ed8' : '#1e40af';
  ctx.font = 'italic bold 17px "Comic Sans MS", "Caveat", "Segoe Print", cursive, sans-serif';
  ctx.fillText(student.name, 280, 126);
  ctx.fillText(student.id, 600, 126);
  ctx.fillText(student.date, 765, 126);

  // Draw Answers
  let currentY = startY + 28;
  student.answers.forEach((ans) => {
    // Question number in the margin
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Q${ans.qNum}.`, 80, currentY);

    // Answer text in student handwriting ink (dark blue or blue-black pen)
    ctx.fillStyle = '#1a365d';
    
    // Choose font & slight jitter based on style
    if (student.handwritingStyle === 'neat') {
      ctx.font = 'italic 17px "Segoe Print", "Caveat", "Comic Sans MS", cursive, sans-serif';
    } else if (student.handwritingStyle === 'messy') {
      ctx.font = 'italic 16px "Comic Sans MS", "Chalkboard SE", cursive, sans-serif';
    } else {
      ctx.font = 'italic 16px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
    }

    // Split long text into multiple lines
    const words = ans.answer.split(' ');
    let currentLine = '';
    const maxWidth = width - 240;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(currentLine, 160, currentY);
        currentLine = words[i] + ' ';
        currentY += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, 160, currentY);
    currentY += lineHeight * 1.5; // spacing between questions
  });

  // Footer: Teacher verification signature line
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(width - 280, height - 70);
  ctx.lineTo(width - 60, height - 70);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Verified / Teacher Signature', width - 260, height - 50);

  return canvas.toDataURL('image/jpeg', 0.9);
}
