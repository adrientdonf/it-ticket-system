const groq = require('../config/groq');

// ── AI TICKET SUMMARY ─────────────────────────────────────────────────────────
// POST /api/ai/summarize
// Takes a ticket and generates a summary + suggested fix using Groq AI
const summarizeTicket = async (req, res) => {
  try {
    const { title, description, priority, status, comments } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const commentsText = comments && comments.length > 0
      ? comments.map(c => `${c.username}: ${c.content}`).join('\n')
      : 'No comments yet.';

    const prompt = `You are an IT support specialist. Analyze this support ticket and provide a concise summary and suggested fix.

Ticket Title: ${title}
Priority: ${priority}
Status: ${status}
Description: ${description}
Comments: ${commentsText}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence summary of the issue",
  "suggestedFix": "Step-by-step suggested resolution",
  "estimatedTime": "Estimated time to resolve (e.g. 15 minutes, 1 hour)",
  "category": "Category of issue (e.g. Hardware, Software, Network, Account)"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('AI summarize error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate AI summary.' });
  }
};

// ── AI INCIDENT DETECTION ─────────────────────────────────────────────────────
// POST /api/ai/detect-incidents
// Analyzes all open tickets and flags clusters that look like the same outage
const detectIncidents = async (req, res) => {
  try {
    const { tickets } = req.body;

    if (!tickets || tickets.length === 0) {
      return res.status(400).json({ success: false, message: 'No tickets provided.' });
    }

    const ticketList = tickets.map(t =>
      `#${t.id} [${t.priority}] ${t.title}: ${t.description}`
    ).join('\n');

    const prompt = `You are an IT operations specialist. Analyze these open IT support tickets and identify any clusters that might indicate a larger incident or outage.

Tickets:
${ticketList}

Respond in this exact JSON format:
{
  "incidents": [
    {
      "title": "Incident name",
      "severity": "critical|high|medium",
      "affectedTickets": [1, 2, 3],
      "description": "What the incident appears to be",
      "recommendedAction": "What IT should do immediately"
    }
  ],
  "summary": "Overall health summary of the IT environment"
}

If no incidents are detected, return an empty incidents array.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('AI incident detection error:', err);
    return res.status(500).json({ success: false, message: 'Failed to detect incidents.' });
  }
};

module.exports = { summarizeTicket, detectIncidents };