# AI-Powered Support Assistant

A full-stack AI-powered support assistant built with React.js, Node.js, SQLite, and OpenAI.

## 🌐 Live Demo

**GitHub Pages:** https://harish-2807.github.io/chatbox/

## 📂 Repository

**Main Repository:** https://github.com/harish-2807/harishAI.git

**Previous Repository:** https://github.com/harish-2807/chatbox.git

## Features

- 🤖 AI-powered responses based on product documentation
- 💬 Real-time chat interface with loading states
- 📝 Session-based conversation management
- 🗄️ SQLite database for storing conversations
- 🔄 Context-aware responses (last 5 message pairs)
- 🛡️ Rate limiting and error handling
- 📱 Fully responsive design for all devices
- 🎨 Modern UI with animations and stickers
- 💡 Suggested questions for quick help

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js (Express)
- **Database:** SQLite
- **LLM:** OpenAI GPT-3.5-turbo
- **Styling:** CSS3 with modern animations

## Project Structure

```
ai-chatbox/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── database.js
│   ├── docs.json
│   └── .env.example
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── index.js
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### POST /api/chat
Send a message to the AI assistant.

**Request:**
```json
{
  "sessionId": "abc123",
  "message": "How can I reset my password?"
}
```

**Response:**
```json
{
  "reply": "Users can reset password from Settings > Security.",
  "tokensUsed": 123
}
```

### GET /api/conversations/:sessionId
Retrieve all messages for a specific session.

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "created_at": "2024-01-01T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you today?",
      "created_at": "2024-01-01T12:00:01Z"
    }
  ]
}
```

### GET /api/sessions
List all sessions with their timestamps.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_123",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:30:00Z"
    }
  ]
}
```

## Database Schema

### sessions table
- `id` (TEXT, PRIMARY KEY): Session ID
- `created_at` (DATETIME): Session creation time
- `updated_at` (DATETIME): Last update time

### messages table
- `id` (INTEGER, PRIMARY KEY): Message ID
- `session_id` (TEXT): Foreign key to sessions
- `role` (TEXT): "user" or "assistant"
- `content` (TEXT): Message content
- `created_at` (DATETIME): Message creation time

## Documentation

The AI assistant responses are based on the `docs.json` file in the backend directory. This file contains product FAQs and information that the AI uses to answer questions.

**Important:** The assistant is configured to only answer questions based on the provided documentation. If a question is outside the scope of the docs, it will respond with: "Sorry, I don't have information about that."

## Features Implementation

### ✅ Frontend (React.js)
- Chat interface with input and send button
- Message list with user/assistant differentiation
- Loading states during AI response generation
- Session ID generation and localStorage storage
- "New Chat" button for fresh sessions
- Conversation timestamps

### ✅ Backend (Node.js)
- Express server with CORS support
- SQLite database integration
- OpenAI API integration
- Rate limiting (100 requests per 15 minutes per IP)
- Comprehensive error handling

### ✅ Database (SQLite)
- Sessions and messages tables
- Foreign key relationships
- Indexes for performance

### ✅ AI Integration
- Document-based answering
- Context awareness (last 5 message pairs)
- Fallback response for unknown queries
- Token usage tracking

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Backend server port (default: 5000)
- `REACT_APP_API_URL`: Frontend API URL (default: http://localhost:5000)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start  # React development server
```

## Production Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the built files with the backend or deploy separately

3. Set production environment variables

4. Start the backend:
   ```bash
   cd backend
   npm start
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend allows requests from your frontend domain
2. **Database Errors**: Check SQLite file permissions and disk space
3. **OpenAI API Errors**: Verify your API key is valid and has sufficient credits
4. **Port Conflicts**: Change the PORT environment variable if needed

### Logs

- Backend logs are displayed in the console
- Check browser console for frontend errors
- SQLite database file is created as `support_assistant.db` in the backend directory

## License

MIT License
