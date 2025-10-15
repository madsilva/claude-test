import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { db } from '../../src/db';
import { stores, products, productVariants } from '../../src/db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, and, isNull } from 'drizzle-orm';
import fs from 'fs';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Helper function to check if user is store admin or owner
async function isStoreAdmin(userId: string, storeId: string): Promise<boolean> {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
  if (!store) return false;

  const admins = store.admins as string[];
  return store.ownerId === userId || admins.includes(userId);
}

// Create product
router.post('/create', requireAuth, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req: AuthRequest, res) => {
  try {
    const { storeId, name, description, price } = req.body;
    const userId = req.userId!;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!storeId || !name || !description || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!files.mainImage || files.mainImage.length === 0) {
      return res.status(400).json({ error: 'Main image is required' });
    }

    // Check if user is admin of the store
    if (!(await isStoreAdmin(userId, storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to create products' });
    }

    // Get image URLs
    const mainImageUrl = `/uploads/products/${files.mainImage[0].filename}`;
    const additionalImages = files.images
      ? files.images.map(f => `/uploads/products/${f.filename}`)
      : [];

    // Create product
    const [newProduct] = await db.insert(products).values({
      storeId,
      name,
      description,
      price,
      mainImage: mainImageUrl,
      images: additionalImages.length > 0 ? additionalImages : null,
    }).returning();

    // Create default variant with size=null, color=null
    const stockQuantity = req.body.stockQuantity ? parseInt(req.body.stockQuantity) : 0;
    await db.insert(productVariants).values({
      productId: newProduct.id,
      size: null,
      color: null,
      stockQuantity,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product variant
router.post('/:productId/variant', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;
    const { size, color, stockQuantity } = req.body;
    const userId = req.userId!;

    if (stockQuantity === undefined || stockQuantity === null) {
      return res.status(400).json({ error: 'Stock quantity is required' });
    }

    // Get product and check store admin
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!(await isStoreAdmin(userId, product.storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to create variants' });
    }

    // Check if this is adding a size/color variant (not null/null)
    const isSpecificVariant = size || color;

    if (isSpecificVariant) {
      // Delete the default null/null variant if it exists
      const defaultVariants = await db.select().from(productVariants)
        .where(and(
          eq(productVariants.productId, productId),
          isNull(productVariants.size),
          isNull(productVariants.color)
        ));

      if (defaultVariants.length > 0) {
        await db.delete(productVariants).where(eq(productVariants.id, defaultVariants[0].id));
      }
    } else {
      // Trying to add null/null variant - check if specific variants exist
      const specificVariants = await db.select().from(productVariants)
        .where(eq(productVariants.productId, productId));

      const hasSpecificVariants = specificVariants.some(v => v.size !== null || v.color !== null);
      if (hasSpecificVariants) {
        return res.status(400).json({
          error: 'Cannot add default variant when specific size/color variants exist'
        });
      }
    }

    // Create variant
    const [newVariant] = await db.insert(productVariants).values({
      productId,
      size: size || null,
      color: color || null,
      stockQuantity: parseInt(stockQuantity),
    }).returning();

    res.status(201).json(newVariant);
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product details with all variants
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get all variants
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId));

    res.json({
      ...product,
      variants,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:productId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price } = req.body;
    const userId = req.userId!;

    // Get product and check store admin
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!(await isStoreAdmin(userId, product.storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to update products' });
    }

    // Update product
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product variant
router.put('/variant/:variantId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { variantId } = req.params;
    const { size, color, stockQuantity } = req.body;
    const userId = req.userId!;

    // Get variant and product
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const [product] = await db.select().from(products).where(eq(products.id, variant.productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!(await isStoreAdmin(userId, product.storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to update variants' });
    }

    // Update variant
    const updateData: any = {};
    if (size !== undefined) updateData.size = size;
    if (color !== undefined) updateData.color = color;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);

    const [updatedVariant] = await db.update(productVariants)
      .set(updateData)
      .where(eq(productVariants.id, variantId))
      .returning();

    res.json(updatedVariant);
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:productId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId!;

    // Get product and check store admin
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!(await isStoreAdmin(userId, product.storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to delete products' });
    }

    // Delete product (cascade will handle variants)
    await db.delete(products).where(eq(products.id, productId));

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product variant
router.delete('/variant/:variantId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { variantId } = req.params;
    const userId = req.userId!;

    // Get variant and product
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId));
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const [product] = await db.select().from(products).where(eq(products.id, variant.productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!(await isStoreAdmin(userId, product.storeId))) {
      return res.status(403).json({ error: 'You must be a store admin to delete variants' });
    }

    // Delete variant
    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
