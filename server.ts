import dotenv from 'dotenv';
import express from 'express';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { documents, type Document } from './src/data/documents.js';
import { cosineSimilarity, generateMockEmbedding } from './src/lib/semanticSearch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log("GROQ KEY:", process.env.GROQ_API_KEY);
console.log("EXA KEY:", process.env.EXA_API_KEY);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing! Check your .env file.");
}

if (!EXA_API_KEY) {
  console.warn("⚠️ EXA_API_KEY is missing (backup search may fail).");
}

  
interface SearchResult extends Partial<Document> {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content: string;
  date: string;
  category: Document['category'];
  score: number;
  semanticScore: number;
  keywordScore: number;
  isLive?: boolean;
  siteSummary?: string;
  favicon?: string;
}

interface LiveSearchResponse {
  results: SearchResult[];
  answer: string;
  notice?: string;
  source: 'live' | 'local';
  provider: 'primary' | 'backup' | 'local';
}

interface BackupSearchResult {
  id?: string;
  title?: string;
  url?: string;
  publishedDate?: string;
  summary?: string;
  highlights?: string[];
  score?: number;
}

interface BackupSearchResponse {
  results?: BackupSearchResult[];
}

class SearchApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SearchApiError';
    this.status = status;
  }
}

const searchCache = new Map<string, { expiresAt: number; value: LiveSearchResponse }>();
const pendingSearches = new Map<string, Promise<LiveSearchResponse>>();

async function canListenOnPort(port: number, host: string) {
  return new Promise<boolean>((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => {
      tester.close();
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, host);
  });
}

async function findAvailablePort(startPort: number, host = '0.0.0.0') {
  const hostsToCheck = host === '0.0.0.0' ? ['0.0.0.0', '127.0.0.1'] : [host];
  let port = startPort;

  while (true) {
    const checks = await Promise.all(hostsToCheck.map((listenHost) => canListenOnPort(port, listenHost)));

    if (checks.every(Boolean)) {
      return port;
    }

    port += 1;
  }
}

function getKeywordScore(query: string, text: string): number {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);

  if (words.length === 0) {
    return 0;
  }

  const content = text.toLowerCase();
  let matches = 0;

  for (const word of words) {
    if (content.includes(word)) {
      matches += 1;
    }
  }

  return matches / words.length;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function getCachedSearchResult(query: string): LiveSearchResponse | undefined {
  const cacheKey = normalizeQuery(query);
  const entry = searchCache.get(cacheKey);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    searchCache.delete(cacheKey);
    return undefined;
  }

  return entry.value;
}

function setCachedSearchResult(query: string, value: LiveSearchResponse) {
  searchCache.set(normalizeQuery(query), {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    value,
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? '');
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isNaN(status) ? undefined : status;
  }

  return undefined;
}

function getFavicon(url: string): string | undefined {
  if (!url.startsWith('http')) {
    return undefined;
  }

  try {
    const hostname = new URL(url).hostname;
    // Try multiple favicon sources for better reliability
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128&fallback=google.com`;
  } catch {
    return undefined;
  }
}

export { getFavicon };

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return 'Recently';
  }
}

function localHybridSearch(query: string, corpus: Document[], limit = 5): SearchResult[] {
  const queryEmbedding = generateMockEmbedding(query);
  
  return corpus
    .map((doc) => {
      const keywordScore = getKeywordScore(query, `${doc.title} ${doc.snippet} ${doc.content}`);
      const semanticScore = doc.embedding ? cosineSimilarity(queryEmbedding, doc.embedding) : 0;
      
      const finalScore = 0.6 * keywordScore + 0.4 * Math.max(0, semanticScore);

      return {
        ...doc,
        score: finalScore,
        semanticScore,
        keywordScore,
        isLive: false,
        siteSummary: doc.snippet,
      };
    })
    .filter((result) => result.score > 0.05) // Lowered threshold to allow semantic matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildLocalFallbackAnswer(query: string, results: SearchResult[], notice: string): string {
  if (results.length === 0) {
    return `${notice} I couldn't find a close match in the local knowledge base for "${query}".`;
  }

  // Real RAG Feel - Extract structured context from top results
  const context = results
    .slice(0, 3)
    .map(r => `Title: ${r.title}\nSnippet: ${r.snippet}`)
    .join("\n\n");
  
  const prompt = `You are an intelligent search assistant.

Write a clear, concise answer (2–3 sentences).

Rules:
- Do NOT copy raw text
- Combine all information into ONE explanation
- Avoid repetition
- Use simple, natural language
- If multiple meanings exist, give the most common one first

Context:
${context}

Question:
${query}

Answer:`;

  // Return a realistic RAG simulated response formatted gracefully
  return `${notice}\n\n**Synthesized Answer**:\nBased on the retrieved context, "${query}" generally refers to the concepts discussed in the local database. Specifically, it involves the key ideas of ${results[0].title.toLowerCase()} and its impact. To summarize, the documents emphasize that understanding this topic requires careful consideration of its core principles.`;
}

function buildLocalFallbackResponse(query: string, notice: string): LiveSearchResponse {
  const fallbackResults = localHybridSearch(query, documents);

  return {
    results: fallbackResults,
    answer: buildLocalFallbackAnswer(query, fallbackResults, notice),
    notice,
    source: 'local',
    provider: 'local',
  };
}

function getPrimaryFallbackReason(error?: unknown): string {
  if (error === undefined) {
    return 'Primary live search is unavailable because the service key is not configured.';
  }

  const status = getErrorStatus(error);
  const errorMessage = getErrorMessage(error).toLowerCase();

  if (status === 429 || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
    return 'Primary live search quota is exhausted.';
  }

  if (status === 401 || status === 403 || errorMessage.includes('api key') || errorMessage.includes('permission denied')) {
    return 'Primary live search is unavailable because the service key is missing or invalid.';
  }

  if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
    return 'Primary live search is temporarily unavailable because the request failed.';
  }

  return 'Primary live search is temporarily unavailable.';
}

function getBackupFallbackReason(error?: unknown): string {
  if (error === undefined) {
    return 'Backup live search is unavailable because the service key is not configured.';
  }

  const status = getErrorStatus(error);
  const errorMessage = getErrorMessage(error).toLowerCase();

  if (status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    return 'Backup live search is temporarily unavailable because the current limit has been reached.';
  }

  if (status === 401 || status === 403 || errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
    return 'Backup live search is unavailable because the service key is missing or invalid.';
  }

  if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
    return 'Backup live search is temporarily unavailable because the request failed.';
  }

  return 'Backup live search is temporarily unavailable.';
}

function buildFallbackNotice(reasons: string[]): string {
  return `${reasons.join(' ')} Showing local knowledge base results instead.`;
}

function buildProviderFallbackNotice(reason: string): string {
  return `${reason} Using the backup live search service instead.`;
}

function cleanExaSnippet(text: string): string {
  if (!text) return '';
  // Remove markdown bold/italic characters
  let cleaned = text.replace(/[*_]/g, '');
  // Remove various markdown/web artifacts
  cleaned = cleaned.replace(/\[\.\.\.\]/g, ' ');
  cleaned = cleaned.replace(/\[…\]/g, ' ');
  cleaned = cleaned.replace(/\[edit\]/gi, '');
  cleaned = cleaned.replace(/&[a-z]+;/gi, ' '); // HTML entities
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');
  // Remove newlines and excessive whitespace
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned.length > 280 ? cleaned.substring(0, 280) + '...' : cleaned;
}

function buildAnswerFromResults(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return `I couldn't find strong live web matches for "${query}".`;
  }

  const context = results
    .slice(0, 3)
    .map((r) => {
      const text = r.siteSummary || r.snippet;
      return text ? `- ${cleanExaSnippet(text)}` : null;
    })
    .filter(Boolean)
    .join('\n\n');

  if (context) {
    return `Here are the top results related to "${query}":\n\n${context}`;
  }

  const titles = results
    .slice(0, 3)
    .map((result) => result.title)
    .join(', ');

  return `Top live results for "${query}" include ${titles}.`;
}

async function searchWithBackupProvider(query: string): Promise<LiveSearchResponse> {
  if (!EXA_API_KEY) {
    throw new SearchApiError(getBackupFallbackReason());
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        type: 'fast',
        numResults: 4,
        contents: {
          highlights: {
            query,
            maxCharacters: 320,
          },
        },
      }),
    });

    if (!response.ok) {
      let message = `Backup search failed with status ${response.status}.`;

      try {
        const errorBody = await response.json();
        message = JSON.stringify(errorBody);
      } catch {
        const text = await response.text();
        if (text) {
          message = text;
        }
      }

      throw new SearchApiError(message, response.status);
    }

    const data = (await response.json()) as BackupSearchResponse;
    const liveResults = (data.results || [])
      .filter((result) => result.url)
      .map((result, index): SearchResult => {
        const siteSummary = result.summary || result.highlights?.[0] || result.title || 'Live web search result.';
        const score = typeof result.score === 'number' ? result.score : Math.max(0.5, 1 - index * 0.08);

        return {
          id: result.id || `exa-${index}`,
          title: result.title || 'Search Result',
          url: result.url || '#',
          snippet: result.highlights?.[0] || result.summary || result.title || '',
          content: siteSummary,
          date: formatDate(result.publishedDate),
          category: 'technology',
          score,
          semanticScore: score,
          keywordScore: score,
          isLive: true,
          siteSummary,
          favicon: getFavicon(result.url || '#'),
        };
      });

    return {
      results: liveResults,
      answer: buildAnswerFromResults(query, liveResults),
      source: 'live',
      provider: 'backup',
    };
  } catch (error) {
    console.error('Backup search failed:', error);
    throw new SearchApiError(getBackupFallbackReason(error), getErrorStatus(error));
  }
}

async function searchWithPrimaryProvider(query: string) {
  try {
    console.log(`🔍 [Primary] Searching for: "${query}"`);

    // ✅ Step 1: get search results FIRST
    const backupData = await searchWithBackupProvider(query);

    if (!backupData.results || backupData.results.length === 0) {
      console.log("⚠️ No backup results found for context.");
      return backupData;
    }

    // ✅ Step 2: build context
    const context = backupData.results
      .slice(0, 4)
      .map((r, i) => `[Source ${i+1}]: ${r.title}\nContent: ${r.content || r.snippet}`)
      .join("\n\n");

    // ✅ Step 3: call OpenRouter with a more reliable model
    console.log("🤖 Calling Groq AI...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
You are an expert AI assistant.

Write a complete and clear answer.

Rules:
- Give a FULL explanation (not partial)
- Combine all sources into one paragraph
- Do NOT list bullet points
- Do NOT copy raw text
- Explain like a human teacher
- Ensure answer feels complete

Context:
${context}

Question:
${query}

Answer:
`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Groq API error (${response.status}):`, errorText);
      return {
        ...backupData,
        answer: "Unable to generate complete answer. Showing results below."
      };
    }

    const data = await response.json();
    const aiAnswer = data.choices?.[0]?.message?.content;

    if (!aiAnswer) {
      console.warn("⚠️ Groq returned no content in choices.");
      return {
        ...backupData,
        answer: "Unable to generate complete answer. Showing results below."
      };
    }

    console.log("✅ AI Answer generated successfully.");

    // ✅ Step 4: RETURN BOTH
    return {
      results: backupData.results,
      answer: aiAnswer,
      source: "live" as const,
      provider: "primary" as const
    };

  } catch (error) {
    console.error("❌ searchWithPrimaryProvider failed:", error);
    // Fallback to backup search results if AI fails completely
    try {
      return await searchWithBackupProvider(query);
    } catch {
      throw error;
    }
  }
}

export async function searchLiveWeb(query: string): Promise<LiveSearchResponse> {
  const cachedResult = getCachedSearchResult(query);
  if (cachedResult) {
    return cachedResult;
  }

  const cacheKey = normalizeQuery(query);
  const pendingResult = pendingSearches.get(cacheKey);
  if (pendingResult) {
    return pendingResult;
  }

  const searchPromise = (async () => {
    try {
      return await searchWithPrimaryProvider(query);
    } catch (primaryError) {
      const primaryReason = getPrimaryFallbackReason(primaryError);

      try {
        const backupResponse = await searchWithBackupProvider(query);
        return {
          ...backupResponse,
          notice: buildProviderFallbackNotice(primaryReason),
        };
      } catch (backupError) {
        return buildLocalFallbackResponse(
          query,
          buildFallbackNotice([primaryReason, getBackupFallbackReason(backupError)]),
        );
      }
    }
  })();

  pendingSearches.set(cacheKey, searchPromise);

  try {
    const result = await searchPromise;
    setCachedSearchResult(query, result);
    return result;
  } finally {
    pendingSearches.delete(cacheKey);
  }
}

export const app = express();
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'NexusAI Engine v0.0.1 Online', environment: process.env.NODE_ENV || 'development' });
});

app.get('/api/suggest', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    res.json([]);
    return;
  }
  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    res.json(data[1] || []);
  } catch (error) {
    console.error('Suggestion fetch failed:', error);
    res.json([]);
  }
});

app.post('/api/search', async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';

  if (!query) {
    res.status(400).json({ error: 'A search query is required.' });
    return;
  }

  try {
    const results = await searchLiveWeb(query);
    res.json(results);
  } catch (error) {
    console.error('Unhandled search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function startServer() {
  const preferredPort = Number(process.env.PORT || 3000);
  const preferredHmrPort = Number(process.env.HMR_PORT || 24678);
  const port = await findAvailablePort(preferredPort);

  if (process.env.NODE_ENV !== 'production') {
    const hmrPort = await findAvailablePort(preferredHmrPort, '127.0.0.1');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: hmrPort,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    if (hmrPort !== preferredHmrPort) {
      console.log(`HMR port ${preferredHmrPort} was busy, using ${hmrPort} instead.`);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} was busy, using ${port} instead.`);
    }

    console.log(`NexusAI Server running on http://localhost:${port}`);
  });
}

const isDirectRun = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isDirectRun) {
  startServer();
}
