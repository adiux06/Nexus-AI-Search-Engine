<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NexusAI Search

Built a modern AI-powered search system with hybrid retrieval and LLM-based answer generation using React, TypeScript, and API integration.

## 🧠 What Makes This Different

Unlike traditional search engines, NexusAI:

- Uses hybrid retrieval (keyword + semantic)
- Generates answers using LLMs
- Provides context-aware results instead of simple matching

## ⚙️ How It Works

1. User enters query  
2. Query sent to backend API  
3. Results fetched (keyword + semantic logic)  
4. LLM generates answer  
5. UI displays results + AI response  

## 📸 Screenshots

*(Upload 2-3 images here: Search UI, Results page, AI answer)*
<!-- ![Search UI](path/to/search-ui.png) -->
<!-- ![Results page](path/to/results.png) -->
<!-- ![AI answer](path/to/ai-answer.png) -->

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the required API keys in `.env.local` (`GEMINI_API_KEY`, `EXA_API_KEY`)
3. Live search will use the primary provider first and automatically fall back to the backup provider if needed
4. Run the app:
   `npm run dev`
5. Open `http://localhost:3000`

Do not open `index.html` directly in the browser. This app relies on Vite to transform the React/TypeScript entrypoint and inject styles.
