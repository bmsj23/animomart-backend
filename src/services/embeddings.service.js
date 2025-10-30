import { GoogleGenAI } from '@google/genai';
import config from '../config/config.js';

const ai = new GoogleGenAI({
  apiKey: config.gemini.apiKey
});

export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('invalid text for embedding generation');
  }

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: [text.trim()],
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768
    });

    const fullEmbedding = response.embeddings[0].values;

    if (fullEmbedding.length > 768) {
      return fullEmbedding.slice(0, 768);
    }

    return fullEmbedding;
  } catch (error) {
    console.error('error generating embedding:', error);
    throw new Error(`embedding generation failed: ${error.message}`);
  }
}

export async function generateBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('invalid texts array for batch embedding generation');
  }

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: texts.map(text => text.trim()),
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768
    });

    return response.embeddings.map(emb => {

      const fullEmbedding = emb.values;

      return fullEmbedding.length > 768 ? fullEmbedding.slice(0, 768) : fullEmbedding;
    });
  } catch (error) {
    console.error('error generating batch embeddings:', error);
    throw new Error(`batch embedding generation failed: ${error.message}`);
  }
}