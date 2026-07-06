import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import {
  fetchMergedPullRequests,
  filterPullRequestsByWindow,
  identifyFirstTimeContributors,
} from '../src/lib/github.ts';
import { githubContributorCollectionSchema } from '../src/schemas/contributor.schema.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run collect:contributors -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const env = readEnv();

if (!env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required to collect live GitHub pull requests.');
  process.exit(1);
}

const mergedPullRequests = await fetchMergedPullRequests({
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  githubToken: env.GITHUB_TOKEN,
  maxPages: 20,
});

const filteredPullRequests = filterPullRequestsByWindow({
  pullRequests: mergedPullRequests,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
});

const contributors = await identifyFirstTimeContributors({
  sourceProject: windowInput.sourceProject,
  pullRequests: filteredPullRequests,
  historicalPullRequests: mergedPullRequests,
  githubToken: env.GITHUB_TOKEN,
});

const collection = githubContributorCollectionSchema.parse({
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
  mergedPullRequestCount: filteredPullRequests.length,
  mergedPullRequests: filteredPullRequests,
  contributorCount: contributors.length,
  contributors,
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'contributors.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote ${collection.contributorCount} first-time contributors to ${outputPath}`);
console.log(`Included ${collection.mergedPullRequestCount} merged pull requests from ${collection.startDate} to ${collection.endDate}`);
