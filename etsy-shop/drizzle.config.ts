import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // TODO: Replace with your Supabase connection string
    // Get this from: Supabase Dashboard > Project Settings > Database > Connection string
    url: process.env.DATABASE_URL || 'postgresql://placeholder',
  },
} satisfies Config;
