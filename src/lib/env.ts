import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const envPaths = [
  path.join(repoRoot, '.env'),
  path.join(repoRoot, 'devrel-newsroom', '.env'),
];

for (const envPath of envPaths) {
  loadDotenv({ path: envPath, override: false });
}

export const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),
  NOTION_PAGE_ID: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(env);
  const googleApiKey = parsed.GOOGLE_API_KEY ?? parsed.GOOGLE_GENERATIVE_AI_API_KEY;

  if (googleApiKey) {
    parsed.GOOGLE_API_KEY = googleApiKey;
    parsed.GOOGLE_GENERATIVE_AI_API_KEY = googleApiKey;
    env.GOOGLE_API_KEY = googleApiKey;
    env.GOOGLE_GENERATIVE_AI_API_KEY = googleApiKey;
  }

  return parsed;
}
