# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Implementation Status (as of conversation ending)

### ✅ COMPLETED
- **Backend (100% complete)**:
  - Express server with TypeScript (`server/index.ts`)
  - Authentication with JWT (`server/routes/auth.ts`, `server/middleware/auth.ts`)
  - Store management routes (`server/routes/store.ts`)
  - Product management with image uploads (`server/routes/product.ts`)
  - Cart and checkout routes (`server/routes/cart.ts`)
  - Drizzle ORM schema (`src/db/schema.ts`, `src/db/index.ts`)
  - Database config for Supabase with placeholders

- **Frontend (80% complete)**:
  - React + Vite + TypeScript setup
  - React Router routing (`src/App.tsx`)
  - API client (`src/api/client.ts`)
  - Auth context (`src/contexts/AuthContext.tsx`)
  - shadcn/ui components installed (button, card, input, label, form)
  - Navbar component (`src/components/Navbar.tsx`)
  - Core pages created:
    - HomePage (all stores listing) ✅
    - LoginPage / SignupPage ✅
    - CreateStorePage ✅
    - StorePage (with pagination) ✅
    - ProductPage (product details + add to cart) ✅
    - CartPage (view cart + checkout) ✅
    - CreateProductPage (with image upload) ✅

### ❌ TODO (Next Session)
1. **Test the application end-to-end**:
   - Set up Supabase database and update .env
   - Run `npm run db:push` to create tables
   - Start backend: `npm run server` (port 3000)
   - Start frontend: `npm run dev` (port 5173)
   - Test signup/login flow
   - Test creating stores and products
   - Test adding to cart and checkout

2. **Missing features** (optional enhancements):
   - Admin product management page (edit/delete products)
   - Product variant creation UI (currently only default variant created)
   - Store admin management (add/remove admins)
   - "My Stores" page for users to see their stores
   - Image preview before upload
   - Better error handling and loading states
   - Form validation

3. **Styling** (user requested):
   - Apply retro pink/blue/clouds/stars theme
   - Currently using default shadcn/ui styling

## Project Overview

This is an Etsy-like e-commerce platform with the following core features:
- Multi-store marketplace where users can create and manage their own stores
- Product management with variants (size/color) and inventory tracking
- Shopping cart system (one cart per store per user)
- Store admin capabilities for product and inventory management

## Architecture

**Client-Server-Database** architecture:
- Frontend: React + Vite + TypeScript + shadcn/ui (port 5173)
- Backend: Express + TypeScript (port 3000)
- Database: PostgreSQL via Supabase + Drizzle ORM
- Auth: JWT tokens stored in localStorage
- Images: Local file storage in `uploads/products/`

## Data Model

### Core Entities

**Store**
- id (UUID), name, description
- Each store has one admin (the creator)

**Product**
- id (UUID), name, description, price, mainImage, images (array)
- Belongs to a store
- Has one or more variants

**ProductVariant**
- id (UUID), productId, stockQuantity, size (nullable), color (nullable)
- Products without size/color variations have one variant with both fields null

**User**
- id (UUID), name, email, password (hashed)

**Cart & CartEntry**
- Cart: id, storeId, userId (one cart per store per user)
- CartEntry: id, cartId, productVariantId, quantity

## API Endpoints

### Store Management
- `POST /store/create` - Create new store (requires auth)
- `DELETE /store/:store_id` - Delete store (admin only)
- `GET /store/:id/:page` - Browse store products with pagination (public)

### Product Management
- `POST /store/:id/create_product` - Add product with images (admin only)
- `POST /store/:store_id/:product_id/create_product_variant` - Add variant (admin only)
- `POST /store/:store_id/:product_id/update_product` - Update product/variants (admin only)
- `DELETE /store/:store_id/:product_id` - Delete product and all variants (admin only)
- `DELETE /store/:store_id/:product_id/:product_variant_id` - Delete specific variant (admin only)
- `GET /store/:id/:product_id` - Get product details with all variants (public)

### Cart & Checkout
- `POST /cart/create` - Create cart for a store (requires auth)
- `POST /cart/add/:store_id/:product_id` - Add product variant to cart
- `POST /cart/:cart_id/checkout` - Process checkout, update inventory

## Key Business Logic

**Product Creation Flow**:
1. Upload and store images first
2. If successful, create product record with image URLs
3. Create product variants with size/color/stock info

**Checkout Flow**:
1. Verify user owns the cart
2. Validate all items (sufficient stock, all from same store)
3. Update stock quantities for each product variant
4. Process payment (stub implementation)

**Authorization Rules**:
- Store admins can only manage their own stores
- Users can only checkout their own carts
- Public endpoints: browsing stores and products
