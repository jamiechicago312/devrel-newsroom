import { readEnv } from '../src/lib/env.ts';
import {
  filterPullRequestsByWindow,
  filterReleasesByWindow,
  identifyFirstTimeContributors,
  normalizeGitHubPullRequest,
  normalizeGitHubRelease,
  parseSourceProject,
} from '../src/lib/github.ts';
import { githubContributorCollectionSchema } from '../src/schemas/contributor.schema.ts';
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

const samplePullRequests = [
  normalizeGitHubPullRequest({
    number: 101,
    title: 'Add contributor docs refresh',
    html_url: 'https://github.com/withastro/astro/pull/101',
    merged_at: '2026-07-02T09:00:00Z',
    updated_at: '2026-07-02T09:00:00Z',
    user: {
      login: 'new-contributor',
    },
  }),
  normalizeGitHubPullRequest({
    number: 102,
    title: 'Fix release metadata pipeline',
    html_url: 'https://github.com/withastro/astro/pull/102',
    merged_at: '2026-07-04T11:00:00Z',
    updated_at: '2026-07-04T11:00:00Z',
    user: {
      login: 'existing-maintainer',
    },
  }),
  normalizeGitHubPullRequest({
    number: 103,
    title: 'Follow-up docs cleanup',
    html_url: 'https://github.com/withastro/astro/pull/103',
    merged_at: '2026-07-05T08:30:00Z',
    updated_at: '2026-07-05T08:30:00Z',
    user: {
      login: 'new-contributor',
    },
  }),
];

const matchingReleases = filterReleasesByWindow({
  releases: [sampleRelease],
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
});

const matchingPullRequests = filterPullRequestsByWindow({
  pullRequests: samplePullRequests,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
});

const contributors = await identifyFirstTimeContributors({
  sourceProject: sampleWindow.sourceProject,
  pullRequests: matchingPullRequests,
  hasPriorMergedPullRequest: async ({ authorLogin }) => authorLogin === 'existing-maintainer',
});

const parsedSourceProject = parseSourceProject(sampleWindow.sourceProject);
const sampleReleaseCollection = githubReleaseCollectionSchema.parse({
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  releaseCount: matchingReleases.length,
  releases: matchingReleases,
});

const sampleContributorCollection = githubContributorCollectionSchema.parse({
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  mergedPullRequestCount: matchingPullRequests.length,
  mergedPullRequests: matchingPullRequests,
  contributorCount: contributors.length,
  contributors,
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
console.log(`Sample releases in window: ${sampleReleaseCollection.releaseCount}`);
console.log(`Sample merged PRs in window: ${sampleContributorCollection.mergedPullRequestCount}`);
console.log(`Sample first-time contributors: ${sampleContributorCollection.contributorCount}`);
console.log(`Configured env keys: ${configuredKeys.length ? configuredKeys.join(', ') : 'none'}`);
