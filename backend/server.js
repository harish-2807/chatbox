const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const db = require('./database');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Load documentation
const docsPath = path.join(__dirname, 'docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

// Initialize OpenAI (you'll need to set OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
});

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});

app.use('/api/', limiter);

// Helper functions
function createSession(sessionId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO sessions (id) VALUES (?)');
    stmt.run(sessionId, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(sessionId);
      }
    });
    stmt.finalize();
  });
}

function saveMessage(sessionId, role, content) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
    stmt.run(sessionId, role, content, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

function getRecentMessages(sessionId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
      [sessionId, limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.reverse());
        }
      }
    );
  });
}

function updateSessionTimestamp(sessionId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

async function generateAIResponse(message, history) {
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // Return mock responses for testing
      const mockResponses = {
        'pricing': 'We offer three pricing plans: Basic ($9/month), Pro ($19/month), and Enterprise ($49/month). All plans include 24/7 support.',
        'password': 'Users can reset password from Settings > Security.',
        'refund': 'Refunds are allowed within 7 days of purchase.',
        'default': 'Sorry, I don\'t have information about that.'
      };
      
      const lowerMessage = message.toLowerCase();
      let response = mockResponses.default;
      
      if (lowerMessage.includes('pricing') || lowerMessage.includes('plan')) {
        response = mockResponses.pricing;
      } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
        response = mockResponses.password;
      } else if (lowerMessage.includes('refund')) {
        response = mockResponses.refund;
      }
      
      return {
        reply: response,
        tokensUsed: 50
      };
    }

    // Original OpenAI API code
    const docsContent = docs.map(doc => `${doc.title}: ${doc.content}`).join('\n');
    
    const historyContext = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const prompt = `You are a helpful customer support assistant. Answer questions ONLY based on the following documentation:

Documentation:
${docsContent}

Recent conversation history:
${historyContext}

Current user question: ${message}

Rules:
1. Answer ONLY using the provided documentation
2. If the answer is not in the documentation, respond exactly: "Sorry, I don't have information about that."
3. Be helpful and concise
4. Do not make up information

Response:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful customer support assistant that only answers based on provided documentation.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    return {
      reply: response.choices[0].message.content.trim(),
      tokensUsed: response.usage.total_tokens
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

// API Routes

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Check if session exists, create if not
    db.get('SELECT id FROM sessions WHERE id = ?', [sessionId], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        try {
          await createSession(sessionId);
        } catch (createErr) {
          return res.status(500).json({ error: 'Failed to create session' });
        }
      }

      // Save user message
      try {
        await saveMessage(sessionId, 'user', message);
      } catch (saveErr) {
        return res.status(500).json({ error: 'Failed to save message' });
      }

      // Get recent messages for context
      try {
        const history = await getRecentMessages(sessionId, 10);
        
        // Generate AI response
        const aiResponse = await generateAIResponse(message, history);
        
        // Save AI response
        await saveMessage(sessionId, 'assistant', aiResponse.reply);
        
        // Update session timestamp
        await updateSessionTimestamp(sessionId);

        res.json({
          reply: aiResponse.reply,
          tokensUsed: aiResponse.tokensUsed
        });
      } catch (aiErr) {
        console.error('AI generation error:', aiErr);
        res.status(500).json({ error: 'Failed to generate response' });
      }
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation history
app.get('/api/conversations/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  db.all(
    'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ messages: rows });
    }
  );
});

// List all sessions
app.get('/api/sessions', (req, res) => {
  db.all(
    'SELECT id, created_at, updated_at FROM sessions ORDER BY updated_at DESC',
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ sessions: rows });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
