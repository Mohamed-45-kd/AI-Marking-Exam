import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body size limit for exam photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client initialization with mandatory User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 35000, // 35 seconds per request
  },
});

// Helper to execute model requests with resilient fallback
async function generateContentWithFallback(params: any) {
  // Use fast, reliable flash models: gemini-3.5-flash primary, gemini-3.8-flash fallback
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`[Saxe Gemini] Calling model: ${modelName}`);
      const res = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return res;
    } catch (err: any) {
      console.warn(`[Saxe Gemini] Model ${modelName} encountered issue: ${err?.message || err}`);
      lastError = err;
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.5-flash',
    timestamp: new Date().toISOString(),
  });
});

// AI Sheet Marking Endpoint
app.post('/api/mark-sheet', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', markingScheme } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required (imageBase64).' });
    }

    if (!markingScheme || !markingScheme.questions || markingScheme.questions.length === 0) {
      return res.status(400).json({ error: 'Valid marking scheme with questions is required.' });
    }

    // Clean base64 if data URI prefix is included
    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const schemeDescription = markingScheme.questions.map((q: any) => {
      return `Question ${q.number} (Max ${q.maxMarks} marks):
Question: ${q.questionText}
Model / Correct Answer: ${q.correctAnswer}
Acceptable variations: ${q.acceptableVariations ? q.acceptableVariations.join('; ') : 'None specified'}
Partial credit guidance: ${q.partialCreditCriteria || 'Award partial marks for partial correctness or correct working'}`;
    }).join('\n\n');

    const systemPrompt = `You are Saxe, a fair, highly attentive, and pedagogical AI exam marker assisting teachers.
Your role is to carefully inspect handwritten student examination/quiz papers and evaluate them against the teacher's official marking scheme.

IMPORTANT PRINCIPLES:
1. Handwriting recognition: Transcribe what the student wrote for each question as faithfully as possible.
2. Unclear handwriting: NEVER guess unreadable handwriting. If text is blurry, illegible, or torn, transcribe it as "[Illegible / Unreadable]", award 0 or minimal marks, set confidence to "low", and note in flagReason: "Handwriting is illegible, please review manually".
3. Partial credit: If a student shows correct intermediate mathematical steps or a partially correct scientific definition/concept, award partial marks strictly up to the question maxMarks.
4. Constructive feedback: For any lost marks (or to praise full marks), provide a short, 1-2 sentence explanation clarifying what was missing or why credit was given, written in clear, encouraging, student-friendly English.
5. Student identification: Detect student name and ID if written on the paper header. If absent, use "Student".
6. Marking format: Adhere strictly to the requested JSON schema. Do not output conversational text or markdown codeblocks outside the JSON schema.
7. Language: All transcription notes, impressions, and feedback MUST be in English.`;

    const userPrompt = `Exam Title: ${markingScheme.title || 'Class Examination'}
Subject: ${markingScheme.subject || 'General'}
Grade / Class: ${markingScheme.gradeClass || 'Secondary'}

Marking Scheme:
${schemeDescription}

Please inspect the attached student answer sheet photo. Extract the student name, evaluate each question, award marks, write helpful feedback, and assess your recognition confidence.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: userPrompt,
    };

    const response = await generateContentWithFallback({
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1, // Low temperature for strict, consistent marking
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedStudentName: {
              type: Type.STRING,
              description: 'Student name found on paper header, or "Student"',
            },
            detectedStudentId: {
              type: Type.STRING,
              description: 'Student Roll/ID number if found, or empty string',
            },
            overallImpression: {
              type: Type.STRING,
              description: 'Brief overall note in English on student handwriting clarity and attempt',
            },
            markedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: {
                    type: Type.INTEGER,
                    description: 'Question number matching the marking scheme',
                  },
                  transcribedAnswer: {
                    type: Type.STRING,
                    description: 'Verbatim transcription of what the student wrote for this question',
                  },
                  marksAwarded: {
                    type: Type.NUMBER,
                    description: 'Score given based on correctness and partial credit (cannot exceed maxMarks)',
                  },
                  maxMarks: {
                    type: Type.NUMBER,
                    description: 'Max marks for this question',
                  },
                  confidence: {
                    type: Type.STRING,
                    description: 'Recognition confidence: "high", "medium", or "low"',
                  },
                  flagReason: {
                    type: Type.STRING,
                    description: 'Reason for flagging if confidence is low or medium (e.g., messy handwriting, ambiguous digit)',
                  },
                  feedback: {
                    type: Type.STRING,
                    description: 'Encouraging, constructive feedback sentence in English explaining mistakes or praising good work',
                  },
                },
                required: ['questionNumber', 'transcribedAnswer', 'marksAwarded', 'maxMarks', 'confidence', 'feedback'],
              },
            },
          },
          required: ['detectedStudentName', 'markedQuestions'],
        },
      },
    });

    const rawText = response?.text || '{}';
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawText.trim());
    } catch (parseError) {
      console.warn('JSON direct parse failed, attempting regex extraction:', rawText);
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI evaluation response.');
      }
    }

    // Programmatic Total Calculation (Guarantee 100% mathematical accuracy)
    let totalScore = 0;
    let maxScore = 0;

    const sanitizedQuestions = (parsedResult.markedQuestions || []).map((mq: any) => {
      // Find original question in scheme to enforce maxMarks constraint
      const schemeQ = markingScheme.questions.find((sq: any) => sq.number === mq.questionNumber);
      const allowedMax = schemeQ ? Number(schemeQ.maxMarks) : Number(mq.maxMarks || 1);
      
      // Clamp awarded marks between 0 and allowedMax
      let awarded = Number(mq.marksAwarded);
      if (isNaN(awarded) || awarded < 0) awarded = 0;
      if (awarded > allowedMax) awarded = allowedMax;
      
      // Round to 1 decimal place if needed
      awarded = Math.round(awarded * 10) / 10;

      totalScore += awarded;
      maxScore += allowedMax;

      const conf = String(mq.confidence || '').toLowerCase();
      const normalizedConfidence: 'high' | 'medium' | 'low' = 
        conf === 'high' ? 'high' : conf === 'low' ? 'low' : 'medium';

      return {
        questionId: schemeQ?.id || `q_${mq.questionNumber}`,
        questionNumber: mq.questionNumber,
        questionText: schemeQ?.questionText || `Question ${mq.questionNumber}`,
        correctAnswer: schemeQ?.correctAnswer || '',
        transcribedAnswer: mq.transcribedAnswer || '[No response provided / Blank]',
        marksAwarded: awarded,
        originalAiMarks: awarded,
        maxMarks: allowedMax,
        confidence: normalizedConfidence,
        flagReason: mq.flagReason || '',
        feedback: mq.feedback || '',
        isOverriddenByTeacher: false,
      };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

    res.json({
      success: true,
      detectedStudentName: parsedResult.detectedStudentName || 'Student',
      detectedStudentId: parsedResult.detectedStudentId || '',
      overallImpression: parsedResult.overallImpression || '',
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore,
      percentage,
      markedQuestions: sanitizedQuestions,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/mark-sheet:', error);
    res.status(500).json({
      error: error?.message || 'An error occurred during AI exam marking. Please try again.',
    });
  }
});

// AI Marking Scheme Assistant: Generate questions from notes/text/syllabus in English
app.post('/api/generate-scheme', async (req: Request, res: Response) => {
  try {
    const { promptText, subject, grade, numQuestions = 5 } = req.body;

    const systemPrompt = `You are Saxe, an educational curriculum assistant helping teachers structure clear exam marking schemes.
Create a high-quality exam marking scheme in English based on the teacher's instructions or topic.
Return JSON with questions, model answers, maximum marks, and partial credit criteria.
All questions and model answers must be in English.`;

    const userPrompt = `Topic / Input notes: ${promptText || 'Grade 8 General Science Quiz'}
Subject: ${subject || 'Science'}
Grade: ${grade || 'Grade 8'}
Number of questions: ${numQuestions}

Generate the questions and marking scheme now in English.`;

    const response = await generateContentWithFallback({
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            classGrade: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  questionText: { type: Type.STRING },
                  questionType: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  acceptableVariations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  maxMarks: { type: Type.NUMBER },
                  partialCreditCriteria: { type: Type.STRING },
                },
                required: ['number', 'questionText', 'correctAnswer', 'maxMarks'],
              },
            },
          },
          required: ['examTitle', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, scheme: parsed });
  } catch (error: any) {
    console.error('Error generating scheme:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate scheme' });
  }
});

// Text-to-Speech Endpoint for Audio Feedback in English
app.post('/api/speak-feedback', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: text.slice(0, 400) }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Could not generate audio response' });
    }

    res.json({
      success: true,
      audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('Error in speak-feedback:', err);
    res.status(500).json({ error: err?.message || 'TTS generation failed' });
  }
});

// Vite Middleware for Development / Static Serve for Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Saxe Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Saxe Server] Failed to start:', err);
});
