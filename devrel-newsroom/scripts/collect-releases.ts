import { readEnv } from '../src/lib/env.ts';
import { fetchGitHubReleases, filterReleasesByWindow } from '../src/lib/github.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';

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

console.log(JSON.stringify({
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
  releaseCount: matchingReleases.length,
  releases: matchingReleases,
}, null, 2));
