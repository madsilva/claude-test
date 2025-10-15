# Setup Guide for Etsy Shop Project

This guide will walk you through setting up and running the Etsy Shop application locally.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works fine)

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase Database

### Create a Supabase account and project:

1. Go to https://supabase.com and sign up (free tier is fine)
2. Create a new project
3. Wait for it to finish setting up (takes ~2 minutes)
4. Go to **Project Settings** > **Database**
5. Scroll down to **Connection string** > **URI** tab
6. Copy the connection string

The connection string looks like:
```
postgresql://postgres.[ref]:[password]@[region].pooler.supabase.com:5432/postgres
```

## 3. Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Required: Your Supabase connection string
DATABASE_URL=your-supabase-connection-string-here

# Optional: Can be any random string for development
JWT_SECRET=any-random-string-you-want

# Optional: BetterAuth configuration (not currently used)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:5173
```

**Note:** For development, `JWT_SECRET` can be any string. For production, use a secure random string.

## 4. Push Database Schema to Supabase

This creates all the required tables (users, stores, products, carts, etc.):

```bash
npm run db:push
```

You should see output confirming the tables were created successfully.

## 5. Start the Development Servers

You'll need **two terminal windows/tabs**:

### Terminal 1 - Backend Server (Express on port 3000):
```bash
npm run server
```

You should see: `Server running on http://localhost:3000`

### Terminal 2 - Frontend Dev Server (Vite on port 5173):
```bash
npm run dev
```

You should see: `Local: http://localhost:5173/`

## 6. Open the Application

Open your browser to: **http://localhost:5173**

## 7. Test the Application

Follow these steps to test all major features:

1. **Sign Up**
   - Click "Sign Up" in the navbar
   - Create a new account with name, email, and password

2. **Create a Store**
   - After logging in, click "Create Store"
   - Enter store name and description
   - Submit to create your store

3. **Add a Product**
   - On your store page, click "Add Product"
   - Fill in product details (name, description, price, stock quantity)
   - Upload a main image (and optional additional images)
   - Submit to create the product

4. **Browse and Shop**
   - Go back to the homepage to see all stores
   - Click on a store to view its products
   - Click on a product to see details
   - Select a variant (if available) and quantity
   - Add to cart

5. **Checkout**
   - Go to your cart (from the product page after adding)
   - Review your items
   - Click "Checkout" to complete the order

---

## Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server (Vite) |
| `npm run server` | Start backend server with hot reload (Express) |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate migration files |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
etsy-shop/
├── server/               # Backend (Express + TypeScript)
│   ├── index.ts         # Server entry point
│   ├── routes/          # API routes (auth, store, product, cart)
│   └── middleware/      # Auth middleware
├── src/                 # Frontend (React + TypeScript)
│   ├── api/            # API client
│   ├── components/     # Reusable components (Navbar, UI components)
│   ├── contexts/       # React contexts (Auth)
│   ├── pages/          # Page components
│   ├── db/             # Database schema and config
│   └── lib/            # Utility functions
├── uploads/            # Local file storage for product images
└── .env                # Environment variables (create this!)
```

---

## Troubleshooting

### Database Connection Errors

**Error:** "Connection refused" or "could not connect to server"

**Solution:**
- Verify your `DATABASE_URL` in `.env` is correct
- Make sure you copied the full connection string from Supabase
- Check that your Supabase project is running (not paused)

### Tables Don't Exist

**Error:** "relation does not exist" or "table not found"

**Solution:**
- Run `npm run db:push` to create the tables
- Check the output for any errors

### Port Already in Use

**Error:** "EADDRINUSE: address already in use :::3000"

**Solution:**
- Kill the process using that port:
  ```bash
  # On macOS/Linux
  lsof -ti:3000 | xargs kill -9

  # On Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- Or change the port in `server/index.ts`

### Images Not Showing

**Issue:** Product images return 404

**Solution:**
- The `uploads/products` directory is created automatically on first upload
- Make sure the backend server is running
- Check that images are being uploaded (check `uploads/products` folder)

### TypeScript Errors

**Error:** TypeScript compilation errors

**Solution:**
- Make sure all dependencies are installed: `npm install`
- Try deleting `node_modules` and reinstalling: `rm -rf node_modules && npm install`

### Authentication Issues

**Error:** "No token provided" or "Invalid token"

**Solution:**
- Make sure you're logged in
- Check browser console for errors
- Try logging out and logging back in
- Clear localStorage and try again

---

## Features Implemented

✅ User authentication (signup/login with JWT)
✅ Store creation and management
✅ Product creation with image uploads
✅ Product variants (size/color with stock tracking)
✅ Shopping cart (one cart per store per user)
✅ Checkout functionality
✅ Store browsing with pagination
✅ Retro pink/blue/clouds/stars theme
✅ Responsive design with shadcn/ui components

---

## Next Steps / Optional Enhancements

- Add admin product management page (edit/delete products)
- Add UI for creating/managing product variants
- Add "My Stores" page to view stores you own/admin
- Add better error handling and user feedback
- Add order history page
- Add search functionality
- Deploy to production (Vercel/Railway + Supabase)

---

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Check the browser console for errors (F12)
3. Check the terminal output for server errors
4. Verify your `.env` file is configured correctly

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, React Router
- **Backend:** Express, TypeScript, JWT authentication
- **Database:** PostgreSQL (via Supabase), Drizzle ORM
- **File Storage:** Local filesystem (multer)
- **Styling:** TailwindCSS with custom retro pink/blue theme
