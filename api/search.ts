import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { documents, type Document } from '../src/data/documents.js';
import { cosineSimilarity, generateMockEmbedding } from '../src/lib/semanticSearch.js';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

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

function getFavicon(url: string): string | undefined {
  if (!url.startsWith('http')) return undefined;
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128&fallback=google.com`;
  } catch {
    return undefined;
  }
}

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function cleanExaSnippet(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/[*_]/g, '');
  cleaned = cleaned.replace(/\[\.\.\.\]/g, ' ').replace(/\[…\]/g, ' ').replace(/\[edit\]/gi, '');
  cleaned = cleaned.replace(/&[a-z]+;/gi, ' ').replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 280 ? cleaned.substring(0, 280) + '...' : cleaned;
}

function buildAnswerFromResults(query: string, results: SearchResult[]): string {
  if (results.length === 0) return `I couldn't find strong live web matches for "${query}".`;
  const context = results.slice(0, 3).map((r) => {
    const text = r.siteSummary || r.snippet;
    return text ? `- ${cleanExaSnippet(text)}` : null;
  }).filter(Boolean).join('\n\n');
  return context ? `Here are the top results related to "${query}":\n\n${context}` : `Top live results for "${query}" include ${results.slice(0, 3).map(r => r.title).join(', ')}.`;
}

async function searchWithBackupProvider(query: string): Promise<LiveSearchResponse> {
  if (!EXA_API_KEY) throw new Error('Backup search unavailable (key missing).');
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': EXA_API_KEY },
    body: JSON.stringify({
      query,
      type: 'fast',
      numResults: 4,
      contents: { highlights: { query, maxCharacters: 320 } },
    }),
  });
  if (!response.ok) throw new Error(`Backup search failed: ${response.status}`);
  const data = (await response.json()) as BackupSearchResponse;
  const liveResults = (data.results || []).filter(r => r.url).map((result, index): SearchResult => {
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
  return { results: liveResults, answer: buildAnswerFromResults(query, liveResults), source: 'live', provider: 'backup' };
}

async function searchWithPrimaryProvider(query: string): Promise<LiveSearchResponse> {
  try {
    const backupData = await searchWithBackupProvider(query);
    if (!backupData.results || backupData.results.length === 0) return backupData;
    const context = backupData.results.slice(0, 4).map((r, i) => `[Source ${i+1}]: ${r.title}\nContent: ${r.content || r.snippet}`).join("\n\n");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexusai.search",
        "X-Title": "NexusAI"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{
          role: "user",
          content: `You are an expert AI assistant.\n\nWrite a complete and clear answer.\n\nRules:\n- Give a FULL explanation (not partial)\n- Combine all sources into one paragraph\n- Do NOT list bullet points\n- Do NOT copy raw text\n- Explain like a human teacher\n- Ensure answer feels complete\n\nContext:\n${context}\n\nQuestion:\n${query}\n\nAnswer:\n`
        }],
        temperature: 0.5,
        max_tokens: 200
      })
    });
    if (!response.ok) return { ...backupData, answer: "Unable to generate complete answer. Showing results below." };
    const data = await response.json();
    const aiAnswer = data.choices?.[0]?.message?.content;
    if (!aiAnswer) return { ...backupData, answer: "Unable to generate complete answer. Showing results below." };
    return { results: backupData.results, answer: aiAnswer, source: "live", provider: "primary" };
  } catch (error) {
    console.error("Primary search failed:", error);
    return await searchWithBackupProvider(query);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const query = req.body?.query?.trim();
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const result = await searchWithPrimaryProvider(query);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Search API error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
