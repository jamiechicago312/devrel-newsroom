import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import {
  astroBlogConfig,
  collectAstroBlogPosts,
  filterBlogPostsByWindow,
  parseAstroBlogRss,
} from '../src/lib/blog.ts';
import { loadMockEvents, selectNewsletterEvents } from '../src/lib/events.ts';
import {
  filterPullRequestsByWindow,
  filterReleasesByWindow,
  identifyFirstTimeContributors,
  normalizeGitHubPullRequest,
  normalizeGitHubRelease,
  parseSourceProject,
} from '../src/lib/github.ts';
import { blogPostCollectionSchema } from '../src/schemas/blog.schema.ts';
import { githubContributorCollectionSchema } from '../src/schemas/contributor.schema.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { githubReleaseCollectionSchema } from '../src/schemas/release.schema.ts';

const sampleWindow = newsletterWindowInputSchema.parse({
  sourceProject: 'withastro/astro',
  startDate: '2026-06-28',
  endDate: '2026-07-05',
});

const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Astro Blog</title>
    <item>
      <title><![CDATA[What's new in Astro - July 2026]]></title>
      <link>https://astro.build/blog/whats-new-july-2026/</link>
      <pubDate>Thu, 02 Jul 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[July 2026 updates from Astro.]]></description>
      <content:encoded><![CDATA[<p>July 2026 updates from Astro with releases and community news.</p>]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Outside window]]></title>
      <link>https://astro.build/blog/outside-window/</link>
      <pubDate>Fri, 26 Jun 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[Older post.]]></description>
    </item>
  </channel>
</rss>`;

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

const sampleBlogPosts = filterBlogPostsByWindow({
  posts: parseAstroBlogRss(sampleRss),
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
});

const collectedBlogPosts = await collectAstroBlogPosts({
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  fetchImpl: async () => new Response(sampleRss, { status: 200 }),
});

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

const sampleEvents = loadMockEvents(path.resolve(import.meta.dirname, '..', 'data', 'events.json'));
const sampleEventCollection = selectNewsletterEvents({
  events: sampleEvents,
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
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

const sampleBlogCollection = blogPostCollectionSchema.parse({
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  source: collectedBlogPosts.source,
  blogPostCount: sampleBlogPosts.length,
  posts: sampleBlogPosts,
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
console.log(`Sample blog posts in window: ${sampleBlogCollection.blogPostCount}`);
console.log(`Most recent past event: ${sampleEventCollection.mostRecentPastEvent?.title ?? 'none'}`);
console.log(`Next upcoming event: ${sampleEventCollection.nextUpcomingEvent?.title ?? 'none'}`);
console.log(`Blog source URL: ${astroBlogConfig.blogUrl}`);
console.log(`Blog RSS URL: ${astroBlogConfig.rssUrl}`);
console.log(`Configured env keys: ${configuredKeys.length ? configuredKeys.join(', ') : 'none'}`);
