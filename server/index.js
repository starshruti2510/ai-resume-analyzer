const { GoogleGenAI } = require('@google/genai');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.send('Resume Analyzer API is running');
});

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription;

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file received.' });
    }

    const resumeBuffer = req.file.buffer;

    // --- debug logging ---
    console.log('Original filename:', req.file.originalname);
    console.log('Mimetype:', req.file.mimetype);
    console.log('File size:', resumeBuffer.length);
    console.log('First bytes:', resumeBuffer.slice(0, 10).toString());
    // ----------------------

    let resumeText;
    try {
      const parsed = await pdfParse(resumeBuffer);
      resumeText = parsed.text;
      if (!resumeText || !resumeText.trim()) {
        return res.status(400).json({ error: 'Could not extract text from this PDF. Try a different export (not scanned).' });
      }
    } catch (pdfErr) {
      console.error('PDF parse error:', pdfErr.message);
      return res.status(400).json({ error: 'This PDF could not be read. Please upload a valid, non-corrupted PDF.' });
    }

    const prompt = `Compare the following resume to the job description below.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a valid JSON object (no markdown, no extra text) in this exact format:
{
  "match_score": <number 0-100>,
  "missing_keywords": [<array of important skills/keywords missing from the resume>],
  "suggestions": [<array of 3-5 specific, actionable suggestions to improve the resume for this job>]
}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
    } catch (aiErr) {
      console.error('Gemini API error:', aiErr.message);
      return res.status(503).json({ error: 'AI service is busy right now. Please try again in a moment.' });
    }

    const responseText = response.text;
    const cleaned = responseText.replace(/```json|```/g, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', responseText);
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));