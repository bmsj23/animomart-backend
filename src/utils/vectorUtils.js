export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) {
    throw new Error('both vectors are required');
  }

  if (vecA.length !== vecB.length) {
    throw new Error('vectors must be same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

export function findSimilarProducts(targetEmbedding, products, topN = 10) {
  if (!targetEmbedding || !Array.isArray(products)) {
    throw new Error('invalid parameters for similarity search');
  }

  const scored = products
    .filter(product => product.embedding && product.embedding.length > 0)
    .map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      return {
        ...productObj,
        similarity: cosineSimilarity(targetEmbedding, product.embedding)
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);

  return scored;
}

export function calculateRelevanceScore(similarity, engagement = {}) {
  const {
    views = 0,
    wishlistCount = 0,
    orderCount = 0,
    averageRating = 0
  } = engagement;

  const engagementScore = (
    views * 0.1 +
    wishlistCount * 2.0 +
    orderCount * 5.0 +
    averageRating * 1.5
  );

  const normalizedEngagement = Math.min(engagementScore / 100, 1);

  const finalScore = similarity * 0.7 + normalizedEngagement * 0.3;

  return finalScore;
}