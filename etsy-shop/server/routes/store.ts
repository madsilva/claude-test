import { Router } from 'express';
import { db } from '../../src/db';
import { stores, products, productVariants } from '../../src/db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Create store
router.post('/create', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId!;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const [newStore] = await db.insert(stores).values({
      name,
      description,
      ownerId: userId,
      admins: [],
    }).returning();

    res.status(201).json(newStore);
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get store by ID with pagination
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pageNum = parseInt(req.query.page as string) || 1;
    const pageSize = 50;
    const offset = (pageNum - 1) * pageSize;

    // Get store
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get products with pagination
    const storeProducts = await db
      .select()
      .from(products)
      .where(eq(products.storeId, id))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.storeId, id));

    const totalPages = Math.ceil(Number(count) / pageSize);

    res.json({
      store: {
        id: store.id,
        name: store.name,
        description: store.description,
      },
      products: storeProducts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        pageSize,
        totalProducts: Number(count),
      },
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all stores with preview images (for landing page)
router.get('/all', async (req, res) => {
  try {
    const allStores = await db.select({
      id: stores.id,
      name: stores.name,
      description: stores.description,
    }).from(stores);

    // For each store, get up to 4 product preview images
    const storesWithPreviews = await Promise.all(
      allStores.map(async (store) => {
        const previewProducts = await db
          .select({ mainImage: products.mainImage })
          .from(products)
          .where(eq(products.storeId, store.id))
          .limit(4);

        return {
          ...store,
          previewImages: previewProducts.map(p => p.mainImage),
        };
      })
    );

    res.json(storesWithPreviews);
  } catch (error) {
    console.error('Get all stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete store (owner only)
router.delete('/:storeId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.userId!;

    // Get store
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user is owner
    if (store.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the store owner can delete the store' });
    }

    // Delete store (cascade will handle products, variants, etc.)
    await db.delete(stores).where(eq(stores.id, storeId));

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add admin to store (owner only)
router.post('/:storeId/add-admin', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId } = req.params;
    const { adminUserId } = req.body;
    const userId = req.userId!;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get store
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user is owner
    if (store.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the store owner can add admins' });
    }

    // Add admin if not already in list
    const currentAdmins = store.admins as string[];
    if (!currentAdmins.includes(adminUserId)) {
      const updatedAdmins = [...currentAdmins, adminUserId];
      await db.update(stores)
        .set({ admins: updatedAdmins })
        .where(eq(stores.id, storeId));
    }

    res.json({ message: 'Admin added successfully' });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove admin from store (owner only)
router.post('/:storeId/remove-admin', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId } = req.params;
    const { adminUserId } = req.body;
    const userId = req.userId!;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin user ID is required' });
    }

    // Get store
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user is owner
    if (store.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the store owner can remove admins' });
    }

    // Remove admin
    const currentAdmins = store.admins as string[];
    const updatedAdmins = currentAdmins.filter(id => id !== adminUserId);
    await db.update(stores)
      .set({ admins: updatedAdmins })
      .where(eq(stores.id, storeId));

    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
