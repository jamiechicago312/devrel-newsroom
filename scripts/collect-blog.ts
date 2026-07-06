import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collectAstroBlogPosts } from '../src/lib/blog.ts';
import { readEnv } from '../src/lib/env.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { blogPostCollectionSchema } from '../src/schemas/blog.schema.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run collect:blog -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const env = readEnv();
const result = await collectAstroBlogPosts({
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
  tavilyApiKey: env.TAVILY_API_KEY,
});

const collection = blogPostCollectionSchema.parse({
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
  source: result.source,
  blogPostCount: result.posts.length,
  posts: result.posts,
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'blog-posts.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote ${collection.blogPostCount} blog posts to ${outputPath}`);
console.log(`Source: ${collection.source}`);
