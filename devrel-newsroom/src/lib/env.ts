import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

export const envSchema = z.object({
  GOOGLE_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),
  NOTION_PAGE_ID: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(env);
}
