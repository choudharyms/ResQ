import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
  PORT:                      z.coerce.number().default(3001),
  DATABASE_URL:              z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL:              z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GEMINI_API_KEY:            z.string().min(1, 'GEMINI_API_KEY is required'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
