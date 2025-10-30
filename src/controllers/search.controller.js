import { generateEmbedding } from '../services/embeddings.service.js';
import { getCachedEmbedding } from '../utils/embeddingCache.js';
import { findSimilarProducts } from '../utils/vectorUtils.js';
import Product from '../models/Product.model.js';

export async function semanticSearch(req, res) {
  try {
    const { q: query, limit = 20, minSimilarity = 0.5, category = null } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'query parameter q is required'
      });
    }

    const startTime = Date.now();
    const queryEmbedding = await getCachedEmbedding(query, generateEmbedding);
    const parsedLimit = parseInt(limit);
    const parsedMinSimilarity = parseFloat(minSimilarity);

    let results = [];

    try {
      // atlas vector search as the first resort
      const filter = {
        status: { $eq: 'active' },
        stock: { $gt: 0 }
      };

      if (category) {
        filter.category = { $eq: category };
      }

      // ensure limit <= numCandidates constraint
      // numCandidates: how many to scan, limit: how many to return
      // cap searchLimit to reasonable number (semantic search should be selective)
      const numCandidates = Math.min(parsedLimit * 3, 300);
      const searchLimit = Math.min(parsedLimit, 50);

      const vectorSearchResults = await Product.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: numCandidates,
            limit: searchLimit,
            filter: filter
          }
        },
        {
          $addFields: {
            relevanceScore: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $match: {
            relevanceScore: { $gte: parsedMinSimilarity }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'sellerInfo'
          }
        },
        {
          $unwind: '$sellerInfo'
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            stock: 1,
            images: 1,
            category: 1,
            condition: 1,
            status: 1,
            views: 1,
            averageRating: 1,
            totalReviews: 1,
            createdAt: 1,
            relevanceScore: 1,
            'seller': {
              _id: '$sellerInfo._id',
              name: '$sellerInfo.name',
              profilePicture: '$sellerInfo.profilePicture',
              sellerInfo: '$sellerInfo.sellerInfo'
            }
          }
        },
        {
          $limit: parsedLimit
        }
      ]);

      results = vectorSearchResults;
      const duration = Date.now() - startTime;
      console.log(`atlas vector search completed in ${duration}ms (${results.length} results)`);

    } catch (vectorError) {
      // fallback to manual similarity calculation (slow path)
      console.warn('atlas vector search not available, falling back to manual calculation:', vectorError.message);

      const query = {
        embedding: { $exists: true, $ne: null },
        status: 'active',
        stock: { $gt: 0 }
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .select('+embedding')
        .populate('seller', '_id name profilePicture sellerInfo');

      const similarProducts = findSimilarProducts(queryEmbedding, products, parsedLimit * 2)
        .filter(product => product.similarity >= parsedMinSimilarity);

      results = similarProducts.map(({ embedding, similarity, ...product }) => ({
        ...product,
        relevanceScore: similarity
      })).slice(0, parsedLimit);

      const duration = Date.now() - startTime;
      console.log(`manual similarity search completed in ${duration}ms (${results.length} results)`);
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('semantic search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function hybridSearch(req, res) {
  try {
    const { q: query, limit = 20, category = null, minSimilarity = 0.5 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'query parameter q is required'
      });
    }

    const startTime = Date.now();
    const parsedLimit = parseInt(limit);
    const parsedMinSimilarity = parseFloat(minSimilarity);

    console.log(`hybrid search request: query="${query}", limit=${parsedLimit}, minSimilarity=${parsedMinSimilarity}`);

    // step 1: keyword search (fast, uses text index)
    // split multi-word queries to match individual words (e.g., "study materials" matches "Study Guides")
    const queryWords = query.trim().split(/\s+/).filter(w => w.length > 2);
    const hasMultipleWords = queryWords.length > 1;
    
    const keywordQuery = {
      $or: hasMultipleWords ? [
        // multi-word: match full phrase OR individual words
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        ...queryWords.map(word => ({ name: { $regex: word, $options: 'i' } })),
        ...queryWords.map(word => ({ category: { $regex: word, $options: 'i' } }))
      ] : [
        // single word: match as is
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ],
      status: 'active',
      stock: { $gt: 0 }
    };

    if (category) {
      keywordQuery.category = category;
    }

    // fetch keyword results in parallel with embedding generation
    const [keywordResults, queryEmbedding] = await Promise.all([
      Product.find(keywordQuery)
        .select('_id name description price stock images category condition status views averageRating totalReviews createdAt seller')
        .populate('seller', '_id name profilePicture sellerInfo')
        .limit(parsedLimit)
        .lean(),
      getCachedEmbedding(query, generateEmbedding)
    ]);

    console.log(`keyword search found ${keywordResults.length} results`);

    let semanticResults = [];

    try {
      // step 2: atlas vector search
      const filter = {
        status: { $eq: 'active' },
        stock: { $gt: 0 }
      };

      if (category) {
        filter.category = { $eq: category };
      }

      // ensure limit <= numCandidates constraint
      // numCandidates: how many to scan, limit: how many to return
      // cap searchLimit to reasonable number (semantic search should be selective)
      const numCandidates = Math.min(parsedLimit * 3, 300);
      const searchLimit = Math.min(parsedLimit, 50);

      const vectorSearchResults = await Product.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: numCandidates,
            limit: searchLimit,
            filter: filter
          }
        },
        {
          $addFields: {
            similarity: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $match: {
            similarity: { $gte: parsedMinSimilarity }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'sellerInfo'
          }
        },
        {
          $unwind: '$sellerInfo'
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            stock: 1,
            images: 1,
            category: 1,
            condition: 1,
            status: 1,
            views: 1,
            averageRating: 1,
            totalReviews: 1,
            createdAt: 1,
            similarity: 1,
            'seller': {
              _id: '$sellerInfo._id',
              name: '$sellerInfo.name',
              profilePicture: '$sellerInfo.profilePicture',
              sellerInfo: '$sellerInfo.sellerInfo'
            }
          }
        }
      ]);

      // take top results with good relative scores
      const topScore = vectorSearchResults[0]?.similarity || 0;
      const adaptiveThreshold = Math.max(parsedMinSimilarity, topScore * 0.96);

      semanticResults = vectorSearchResults.filter(r => r.similarity >= adaptiveThreshold);
      console.log(`atlas vector search: ${vectorSearchResults.length} raw results, ${semanticResults.length} after adaptive filter (threshold: ${adaptiveThreshold.toFixed(3)})`);

    } catch (vectorError) {
      // fallback to manual calculation (slow af...)
      console.warn('atlas vector search not available, using fallback');
      console.error('vector search error details:', vectorError.message);

      const query = {
        embedding: { $exists: true, $ne: null },
        status: 'active',
        stock: { $gt: 0 }
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .select('+embedding')
        .populate('seller', '_id name profilePicture sellerInfo')
        .lean();

      const similarProducts = findSimilarProducts(queryEmbedding, products, parsedLimit * 2)
        .filter(product => product.similarity >= parsedMinSimilarity);

      semanticResults = similarProducts.map(({ embedding, ...product }) => product);
    }

    // step 3: combine and score results
    console.log(`combining results: ${keywordResults.length} keyword, ${semanticResults.length} semantic`);

    const combined = new Map();

    // add keyword results with high score (prioritize exact matches)
    keywordResults.forEach(product => {
      combined.set(product._id.toString(), {
        ...product,
        score: 1.0,
        matchType: 'keyword'
      });
    });

    // merge or add semantic results
    semanticResults.forEach(product => {
      const id = product._id.toString();
      if (combined.has(id)) {
        // found in both keyword and semantic: boost score
        const existing = combined.get(id);
        existing.score = existing.score * 0.7 + product.similarity * 0.3;
        existing.matchType = 'hybrid';
      } else {
        // semantic only: add with lower score than keyword matches
        combined.set(id, {
          ...product,
          score: product.similarity * 0.7,
          matchType: 'semantic'
        });
      }
    });

    // step 4: separate exact matches from semantic suggestions
    const allResults = Array.from(combined.values());

    // exact matches: keyword or hybrid results
    const exactMatches = allResults
      .filter(r => r.matchType === 'keyword' || r.matchType === 'hybrid')
      .sort((a, b) => b.score - a.score)
      .slice(0, parsedLimit);

    // semantic suggestions: semantic-only results
    const suggestions = allResults
      .filter(r => r.matchType === 'semantic')
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(10, parsedLimit)); // max 10 suggestions

    const duration = Date.now() - startTime;
    console.log(`hybrid search completed in ${duration}ms (${exactMatches.length} exact, ${suggestions.length} suggestions)`);

    res.json({
      success: true,
      exactMatches: exactMatches,
      suggestions: suggestions,
      count: exactMatches.length,
      suggestionsCount: suggestions.length,
      timing: `${duration}ms`
    });
  } catch (error) {
    console.error('hybrid search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}