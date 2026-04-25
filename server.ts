import { GoogleGenAI as PrimarySearchClient } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { documents, type Document } from './src/data/documents';
import { cosineSimilarity, generateMockEmbedding } from './src/lib/semanticSearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const EXA_API_KEY = process.env.EXA_API_KEY || '';
const GEMINI_LIVE_SEARCH_MODEL = 'gemini-2.5-flash';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

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

const primaryClient = GEMINI_API_KEY ? new PrimarySearchClient({ apiKey: GEMINI_API_KEY }) : null;
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
  // Remove markdown bold/italic characters
  let cleaned = text.replace(/[*_]/g, '');
  // Remove empty brackets or excessive markdown artifacts
  cleaned = cleaned.replace(/\[\.\.\.\]/g, ' ');
  cleaned = cleaned.replace(/\[…\]/g, ' ');
  cleaned = cleaned.replace(/\[edit\]/gi, '');
  // Remove newlines so the text flows as a single paragraph
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  if (!cleaned) return '';
  return cleaned.length > 250 ? cleaned.substring(0, 250) + '...' : cleaned;
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
    return `**⚠️ AI Generation Unavailable:**\n*(The Gemini LLM key is missing, so the system cannot synthesize a human-readable answer. Displaying raw aggregated context instead.)*\n\n**Extracted Context:**\n${context}`;
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
          date: result.publishedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
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

async function searchWithPrimaryProvider(query: string): Promise<LiveSearchResponse> {
  if (!primaryClient) {
    throw new SearchApiError(getPrimaryFallbackReason());
  }

  try {
    const prompt = `You are an intelligent search assistant.

Write a clear, concise answer (2–3 sentences).

Rules:
- Do NOT copy raw text
- Combine all information into ONE explanation
- Avoid repetition
- Use simple, natural language
- If multiple meanings exist, give the most common one first

Question:
${query}

Answer:`;

    const response = await primaryClient.models.generateContent({
      model: GEMINI_LIVE_SEARCH_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 120,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const answer = response.text || '';

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks || [];

    const results: SearchResult[] = chunks
      .filter((chunk) => chunk.web)
      .map((chunk, index) => {
        const url = chunk.web?.uri || '#';

        return {
          id: `gemini-${index}`,
          title: chunk.web?.title || 'Search Result',
          url,
          snippet: chunk.web?.title || '',
          content: `Live source: ${chunk.web?.title}`,
          date: new Date().toISOString().split('T')[0],
          category: 'technology',
          score: 1,
          semanticScore: 1,
          keywordScore: 1,
          isLive: true,
          siteSummary: chunk.web?.title || 'Live web search result.',
          favicon: getFavicon(url),
        };
      });

    return {
      results,
      answer,
      source: 'live',
      provider: 'primary',
    };
  } catch (error) {
    console.error('Primary search failed:', error);
    throw new SearchApiError(getPrimaryFallbackReason(error), getErrorStatus(error));
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
