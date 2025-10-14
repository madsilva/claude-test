import { pgTable, uuid, text, integer, jsonb, decimal, timestamp } from 'drizzle-orm/pg-core';

// User table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed password
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Store table
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  admins: jsonb('admins').$type<string[]>().notNull().default([]), // array of user UUIDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Product table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  mainImage: text('main_image').notNull(),
  images: jsonb('images').$type<string[]>(), // nullable array of image URLs
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Product Variant table
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  stockQuantity: integer('stock_quantity').notNull(),
  size: text('size'), // nullable
  color: text('color'), // nullable
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cart table
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cart Entry table
export const cartEntries = pgTable('cart_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productVariantId: uuid('product_variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
