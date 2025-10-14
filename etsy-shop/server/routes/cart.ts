import { Router } from 'express';
import { db } from '../../src/db';
import { carts, cartEntries, productVariants, products, stores } from '../../src/db/schema';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Create cart for a store
router.post('/create', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId } = req.body;
    const userId = req.userId!;

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Check if cart already exists for this user and store
    const existingCart = await db.select().from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.storeId, storeId)));

    if (existingCart.length > 0) {
      return res.json(existingCart[0]);
    }

    // Create new cart
    const [newCart] = await db.insert(carts).values({
      storeId,
      userId,
    }).returning();

    res.status(201).json(newCart);
  } catch (error) {
    console.error('Create cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to cart
router.post('/add', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId, productVariantId, quantity } = req.body;
    const userId = req.userId!;

    if (!storeId || !productVariantId || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get or create cart for this store
    let [cart] = await db.select().from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.storeId, storeId)));

    if (!cart) {
      [cart] = await db.insert(carts).values({
        storeId,
        userId,
      }).returning();
    }

    // Check if item already in cart
    const [existingEntry] = await db.select().from(cartEntries)
      .where(and(
        eq(cartEntries.cartId, cart.id),
        eq(cartEntries.productVariantId, productVariantId)
      ));

    if (existingEntry) {
      // Update quantity
      const [updated] = await db.update(cartEntries)
        .set({ quantity: existingEntry.quantity + parseInt(quantity) })
        .where(eq(cartEntries.id, existingEntry.id))
        .returning();
      return res.json(updated);
    }

    // Add new entry
    const [newEntry] = await db.insert(cartEntries).values({
      cartId: cart.id,
      productVariantId,
      quantity: parseInt(quantity),
    }).returning();

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's cart for a specific store
router.get('/:storeId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.userId!;

    // Get cart
    const [cart] = await db.select().from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.storeId, storeId)));

    if (!cart) {
      return res.json({ cart: null, items: [] });
    }

    // Get cart entries with product details
    const entries = await db
      .select({
        id: cartEntries.id,
        quantity: cartEntries.quantity,
        variant: productVariants,
        product: products,
      })
      .from(cartEntries)
      .innerJoin(productVariants, eq(cartEntries.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartEntries.cartId, cart.id));

    res.json({ cart, items: entries });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all user's carts
router.get('/all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get all carts for user with store info
    const userCarts = await db
      .select({
        cart: carts,
        store: stores,
      })
      .from(carts)
      .innerJoin(stores, eq(carts.storeId, stores.id))
      .where(eq(carts.userId, userId));

    res.json(userCarts);
  } catch (error) {
    console.error('Get all carts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart entry quantity
router.put('/entry/:entryId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { entryId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId!;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    // Verify this entry belongs to user's cart
    const [entry] = await db.select({
      entry: cartEntries,
      cart: carts,
    })
      .from(cartEntries)
      .innerJoin(carts, eq(cartEntries.cartId, carts.id))
      .where(eq(cartEntries.id, entryId));

    if (!entry || entry.cart.userId !== userId) {
      return res.status(404).json({ error: 'Cart entry not found' });
    }

    // Update quantity
    const [updated] = await db.update(cartEntries)
      .set({ quantity: parseInt(quantity) })
      .where(eq(cartEntries.id, entryId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Update cart entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/entry/:entryId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.userId!;

    // Verify this entry belongs to user's cart
    const [entry] = await db.select({
      entry: cartEntries,
      cart: carts,
    })
      .from(cartEntries)
      .innerJoin(carts, eq(cartEntries.cartId, carts.id))
      .where(eq(cartEntries.id, entryId));

    if (!entry || entry.cart.userId !== userId) {
      return res.status(404).json({ error: 'Cart entry not found' });
    }

    // Delete entry
    await db.delete(cartEntries).where(eq(cartEntries.id, entryId));

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Checkout cart
router.post('/:cartId/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.userId!;

    // Get cart and verify ownership
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId));
    if (!cart || cart.userId !== userId) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Get all cart entries with variant info
    const entries = await db
      .select({
        entry: cartEntries,
        variant: productVariants,
        product: products,
      })
      .from(cartEntries)
      .innerJoin(productVariants, eq(cartEntries.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartEntries.cartId, cartId));

    if (entries.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify all products are from the same store
    const storeIds = new Set(entries.map(e => e.product.storeId));
    if (storeIds.size > 1 || !storeIds.has(cart.storeId)) {
      return res.status(400).json({ error: 'Cart contains products from different stores' });
    }

    // Check stock and update quantities
    for (const { entry, variant } of entries) {
      if (variant.stockQuantity < entry.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product variant ${variant.id}. Available: ${variant.stockQuantity}, requested: ${entry.quantity}`
        });
      }

      // Decrease stock
      await db.update(productVariants)
        .set({ stockQuantity: variant.stockQuantity - entry.quantity })
        .where(eq(productVariants.id, variant.id));
    }

    // Clear cart entries
    await db.delete(cartEntries).where(eq(cartEntries.cartId, cartId));

    // In a real app, you'd process payment here

    res.json({ message: 'Checkout successful', orderId: cartId });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
