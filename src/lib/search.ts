import type { Document } from '../data/documents';

export interface SearchResult extends Partial<Document> {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content: string;
  date: string;
  category: any;
  score: number;
  semanticScore: number;
  keywordScore: number;
  isLive?: boolean;
  siteSummary?: string;
  favicon?: string;
}

export interface LiveSearchResponse {
  results: SearchResult[];
  answer: string;
  notice?: string;
  source: 'live' | 'local';
  provider: 'primary' | 'backup' | 'local';
}

export async function getLiveSearchResults(query: string): Promise<LiveSearchResponse> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    let message = 'Search request failed.';

    try {
      const errorBody = await response.json();
      message = typeof errorBody?.error === 'string' ? errorBody.error : JSON.stringify(errorBody);
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<LiveSearchResponse>;
}

export function getFavicon(url: string): string | undefined {
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
