import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
  PORT:                      z.coerce.number().default(3001),
  DATABASE_URL:              z.string().default('postgresql://postgres:postgres@localhost:5432/postgres'),
  SUPABASE_URL:              z.string().url().default('https://mock-resq.supabase.co'),
  SUPABASE_ANON_KEY:         z.string().optional().default('mock-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('mock-service-role-key'),
  GEMINI_API_KEY:            z.string().default('mock-gemini-key'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
