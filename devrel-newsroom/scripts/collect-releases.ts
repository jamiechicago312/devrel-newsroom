import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import { fetchGitHubReleases, filterReleasesByWindow } from '../src/lib/github.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { githubReleaseCollectionSchema } from '../src/schemas/release.schema.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run collect:releases -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const env = readEnv();

if (!env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required to collect live GitHub releases.');
  process.exit(1);
}

const releases = await fetchGitHubReleases({
  sourceProject: windowInput.sourceProject,
  githubToken: env.GITHUB_TOKEN,
});

const matchingReleases = filterReleasesByWindow({
  releases,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
});

const collection = githubReleaseCollectionSchema.parse({
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
  releaseCount: matchingReleases.length,
  releases: matchingReleases,
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'releases.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote ${collection.releaseCount} releases to ${outputPath}`);
