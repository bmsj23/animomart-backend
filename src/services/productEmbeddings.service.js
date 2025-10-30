import { generateEmbedding } from './embeddings.service.js';
import Product from '../models/Product.model.js';

export async function generateProductEmbedding(product) {
  const textToEmbed = [
    product.name,
    product.description,
    product.category,
    product.condition || '',
  ].filter(Boolean).join(' ');

  const embedding = await generateEmbedding(textToEmbed);
  return embedding;
}

export async function updateProductEmbedding(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('product not found');

  const embedding = await generateProductEmbedding(product);
  product.embedding = embedding;
  await product.save();

  return product;
}

export async function updateAllProductsEmbeddings(batchSize = 10) {
  const products = await Product.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null }
    ]
  });

  console.log(`updating embeddings for ${products.length} products...`);

  const results = {
    total: products.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    await Promise.allSettled(batch.map(async (product) => {
      try {
        const embedding = await generateProductEmbedding(product);
        product.embedding = embedding;
        await product.save();
        results.success++;
        console.log(`[${results.success + results.failed}/${products.length}] ✓ ${product.name}`);
      } catch (error) {
        results.failed++;
        results.errors.push({ productId: product._id, error: error.message });
        console.error(`[${results.success + results.failed}/${products.length}] ✗ ${product.name}: ${error.message}`);
      }
    }));

    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}