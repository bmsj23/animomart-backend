import express from 'express';
import * as searchController from '../controllers/search.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// route   GET /api/search/semantic
// desc    semantic search using vector embeddings
// access  private
router.get('/semantic', searchController.semanticSearch);

// route   GET /api/search/hybrid
// desc    hybrid search (keyword + semantic)
// access  private
router.get('/hybrid', searchController.hybridSearch);

export default router;