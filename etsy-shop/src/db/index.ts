import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// TODO: Replace with your Supabase connection string
// Get this from: Supabase Dashboard > Project Settings > Database > Connection string
// Format: postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder';

// Create postgres connection
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });
