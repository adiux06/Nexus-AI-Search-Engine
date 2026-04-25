# 🔍 NexusAI Search

> Modern AI-powered search system with hybrid retrieval and real-time answer generation.

---

## 🚀 Overview

**NexusAI Search** is a next-generation search system that goes beyond traditional keyword matching by combining:

* ⚡ Fast keyword-based retrieval
* 🧠 Semantic understanding of queries
* 🤖 AI-generated answers

Instead of just returning links, NexusAI provides **relevant results + a clear, human-readable answer**.

---

## 🧠 What Makes This Different

Unlike traditional search engines:

* ✅ Understands **meaning**, not just keywords
* ✅ Combines **keyword + semantic search (hybrid retrieval)**
* ✅ Generates **context-aware answers (RAG-style)**
* ✅ Provides **confidence and sources**

---

## ⚙️ How It Works

1. User enters a query
2. System retrieves results using:

   * keyword matching
   * semantic similarity
3. Results are ranked using hybrid scoring
4. Top results are used as context
5. AI generates a clean answer

---

## ✨ Features

* 🔍 Hybrid Search (Keyword + Semantic)
* 🤖 AI Answer Generation
* 💡 Smart Suggestions & Autocomplete
* 📊 Confidence Score
* 🔗 Source Attribution
* ⚡ Fast React-based UI

---

## 🏗️ Architecture

```text
User Query
   │
   ▼
Frontend (React)
   │
   ▼
API (/api/search)
   │
   ├── Keyword Matching
   ├── Semantic Scoring
   ▼
Hybrid Ranking
   ▼
Top Results
   ▼
LLM (Answer Generation)
   ▼
Final Answer + Sources
```

---

## ⚙️ Tech Stack

### Frontend

* React + TypeScript
* Tailwind CSS
* Vite

### Backend

* Node.js / API routes

### AI

* LLM API (Gemini / OpenAI)
* Semantic scoring logic

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone https://github.com/adiux06/Nexus-AI-Search-Engine.git
cd Nexus-AI-Search-Engine
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Do NOT commit this file

---

### 4. Run the App

```bash
npm run dev
```

👉 Open: http://localhost:3000

---

## 🧪 Example

**Query:**
`What does "hi" mean?`

**Output:**

> “'Hi' is an informal greeting commonly used to say hello in casual conversations. It is widely used in everyday communication and may also have other meanings depending on context.”

**Sources:** Merriam-Webster, Britannica
**Confidence:** 0.91

---

## 🔐 Security Note

API keys are stored using environment variables and are **not exposed in the codebase**.

---

## 💼 Resume Line

> Built a modern AI-powered search system with hybrid retrieval and LLM-based answer generation using React, TypeScript, and API integration.

---

## 📌 Future Improvements

* 🔹 Personalized search results
* 🔹 Voice-based search
* 🔹 Multi-modal search (images/videos)
* 🔹 Vector database integration

---

## 📜 License

MIT License
