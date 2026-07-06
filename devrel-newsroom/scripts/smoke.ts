import { readEnv } from '../src/lib/env.ts';
import { filterReleasesByWindow, normalizeGitHubRelease, parseSourceProject } from '../src/lib/github.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { githubReleaseCollectionSchema } from '../src/schemas/release.schema.ts';

const sampleWindow = newsletterWindowInputSchema.parse({
  sourceProject: 'withastro/astro',
  startDate: '2026-07-01',
  endDate: '2026-07-05',
});

const sampleRelease = normalizeGitHubRelease({
  id: 1,
  tag_name: 'astro@5.0.0',
  name: 'Astro 5.0',
  html_url: 'https://github.com/withastro/astro/releases/tag/astro%405.0.0',
  prerelease: false,
  draft: false,
  published_at: '2026-07-03T12:00:00Z',
  body: 'Shipped a stable release with docs updates and fixes.',
  author: {
    login: 'withastrobot',
  },
});

const matchingReleases = filterReleasesByWindow({
  releases: [sampleRelease],
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
});

const parsedSourceProject = parseSourceProject(sampleWindow.sourceProject);
const sampleCollection = githubReleaseCollectionSchema.parse({
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  releaseCount: matchingReleases.length,
  releases: matchingReleases,
});

const env = readEnv();
const configuredKeys = Object.entries(env)
  .filter(([, value]) => Boolean(value))
  .map(([key]) => key)
  .sort();

console.log('DevRel Newsroom smoke test');
console.log(`Source project: ${sampleWindow.sourceProject}`);
console.log(`Repo owner/name: ${parsedSourceProject.owner}/${parsedSourceProject.repo}`);
console.log(`Window: ${sampleWindow.startDate} -> ${sampleWindow.endDate}`);
console.log(`Sample releases in window: ${sampleCollection.releaseCount}`);
console.log(`Configured env keys: ${configuredKeys.length ? configuredKeys.join(', ') : 'none'}`);
