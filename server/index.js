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
    const resumeBuffer = req.file.buffer;

    const parsed = await pdfParse(resumeBuffer);
    const resumeText = parsed.text;

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const responseText = response.text;
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));