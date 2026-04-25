# 🔍 NexusAI Search

> AI-powered search system with hybrid retrieval and real-time answer generation.

---

## 🚀 Overview

**NexusAI Search** is a modern AI search interface that combines traditional search techniques with large language models to deliver **relevant results and direct answers**.

Unlike traditional search engines, it focuses on **understanding intent and summarizing information**, not just matching keywords.

---

## 🧠 Core Idea

The system integrates:

* ⚡ Keyword-based retrieval (fast matching)
* 🧠 Semantic scoring (meaning-based relevance)
* 🤖 AI-generated answers (LLM)

This creates a **hybrid search pipeline**, similar to modern AI search systems.

---

## ⚙️ How It Works

1. User enters a query
2. API processes the query
3. Results are retrieved using:

   * keyword matching
   * semantic relevance scoring
4. Top results are selected
5. Context is sent to LLM
6. AI generates a clean answer

---

## ✨ Features

* 🔍 Hybrid Search (Keyword + Semantic)
* 🤖 AI Answer Generation (RAG-style)
* 💡 Smart Suggestions & Autocomplete
* 📊 Confidence Score
* 🔗 Source Attribution
* ⚡ Fast React UI

---

## 🏗️ Architecture

```text
User Query
   │
   ▼
Frontend (React)
   │
   ▼
API Layer
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

**Frontend**

* React + TypeScript
* Tailwind CSS
* Vite

**Backend**

* Node.js API routes

**AI**

* LLM API (Gemini / OpenAI)
* Custom hybrid ranking logic

---

## 📦 Installation

```bash
git clone https://github.com/adiux06/Nexus-AI-Search-Engine.git
cd Nexus-AI-Search-Engine
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

⚠️ Never push this file to GitHub.

---

## 🧪 Example

**Query:**
`What does "hi" mean?`

**Answer:**
"Hi is an informal greeting commonly used to say hello in casual conversations."

**Sources:** Merriam-Webster, Britannica
**Confidence:** 0.91

---

## 💼 Resume Description

> Built an AI-powered search system using hybrid retrieval and LLM-based answer generation with React, TypeScript, and API integration.

---

## 📌 Future Improvements

* Vector database integration (FAISS / Pinecone)
* Personalized search ranking
* Multi-modal search (image/video)
* Streaming AI responses

---

## 📜 License

MIT License
