const cache = new Map();
const CACHE_TTL = 3600000;

function getCacheKey(text) {
  return `emb_${text.substring(0, 100).trim()}`;
}

export async function getCachedEmbedding(text, generator) {
  const key = getCacheKey(text);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.embedding;
  }

  const embedding = await generator(text);

  cache.set(key, {
    embedding,
    timestamp: Date.now()
  });

  return embedding;
}

export function clearCache() {
  cache.clear();
}

export function getCacheSize() {
  return cache.size;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);