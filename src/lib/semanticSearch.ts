// Simple semantic search using cosine similarity
export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// Generate mock embeddings for local data so the app can demonstrate real semantic math
export function generateMockEmbedding(text: string): number[] {
  const embedding = new Array(32).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash);
  for (let i = 0; i < 32; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    embedding[i] = (seed / 233280) * 2 - 1;
  }
  return embedding;
}
