const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are an expert Prompt Engineering Assistant focused on career-related tasks.
Your ONLY job is to convert user input into high-quality, structured prompts.
Generate prompts for: Resume Creation, Job Search, Interview Preparation, Cover Letter Writing.

ALWAYS produce exactly 3 levels:

LEVEL 1: Basic Prompt
One short simple sentence. No explanation.

LEVEL 2: Structured Prompt
Role:
Context:
Task:
Constraints:
Output Format:

LEVEL 3: Expert Prompt
Detailed, ATS-optimized, industry-level prompt with full instructions.

RULES: Start directly with LEVEL 1: — no intro text.`;

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key not set.' });
  }
  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: message.trim() }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    if (!groqResponse.ok) {
      const errData = await groqResponse.json();
      return res.status(groqResponse.status).json({
        error: errData?.error?.message || 'Groq API request failed.'
      });
    }
    const data  = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong: ' + err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n  ✦  Career Prompt Chatbot');
  console.log(`  🚀  http://localhost:${PORT}`);
  console.log('  🆓  Groq API (FREE)\n');
});
