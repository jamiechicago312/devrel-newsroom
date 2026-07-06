import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import {
  astroBlogConfig,
  collectAstroBlogPosts,
  filterBlogPostsByWindow,
  parseAstroBlogRss,
} from '../src/lib/blog.ts';
import { buildNewsletterDraftingSource } from '../src/lib/drafting-source.ts';
import { renderNewsletterEmail } from '../src/lib/email.ts';
import { loadMockEvents, selectNewsletterEvents } from '../src/lib/events.ts';
import {
  filterPullRequestsByWindow,
  filterReleasesByWindow,
  identifyFirstTimeContributors,
  normalizeGitHubPullRequest,
  normalizeGitHubRelease,
  parseSourceProject,
} from '../src/lib/github.ts';
import { buildNotionNewsletterPagePayload, extractMarkdownSectionFromNotionBlocks } from '../src/lib/notion.ts';
import { renderNewsletterBodyMarkdown } from '../src/lib/newsletter.ts';
import { blogPostCollectionSchema } from '../src/schemas/blog.schema.ts';
import { githubContributorCollectionSchema } from '../src/schemas/contributor.schema.ts';
import {
  newsletterAgentBriefsSchema,
  newsletterDraftWorkflowOutputSchema,
  newsletterQaReportSchema,
} from '../src/schemas/agent.schema.ts';
import { newsletterEmailArtifactSchema } from '../src/schemas/email.schema.ts';
import { newsletterDraftSchema, newsletterResearchSchema, newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
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

const sampleResearch = newsletterResearchSchema.parse({
  sourceProject: sampleWindow.sourceProject,
  startDate: sampleWindow.startDate,
  endDate: sampleWindow.endDate,
  windowDays: 8,
  status: 'ready',
  releaseCount: matchingReleases.length,
  releases: matchingReleases,
  mergedPullRequestCount: matchingPullRequests.length,
  mergedPullRequests: matchingPullRequests,
  contributorCount: contributors.length,
  contributors,
  blogSource: collectedBlogPosts.source,
  blogPostCount: sampleBlogPosts.length,
  blogPosts: sampleBlogPosts,
  eventSource: sampleEventCollection.source,
  mostRecentPastEvent: sampleEventCollection.mostRecentPastEvent,
  nextUpcomingEvent: sampleEventCollection.nextUpcomingEvent,
});

const sampleDraftingSource = buildNewsletterDraftingSource(sampleResearch);

const sampleDraft = newsletterDraftSchema.parse({
  subject: 'Astro Weekly: releases, contributors, and community updates',
  previewText: 'A concise recap of Astro releases, new contributors, blog updates, and upcoming events.',
  intro: 'This week in Astro brought a stable release, community contributions, and one new blog post to catch up on.',
  releaseHighlights: {
    title: 'Release Highlights',
    summary: 'Astro 5.0 shipped during the window with stable release notes and fixes.',
    links: [sampleRelease.url],
  },
  firstTimeContributorShoutOuts: {
    title: 'First-Time Contributor Shout-Outs',
    summary: 'New contributors landed docs and cleanup work during this newsletter window.',
    links: ['https://github.com/withastro/astro/pull/101'],
  },
  latestBlogPost: {
    title: 'Latest Blog Post',
    summary: 'The latest Astro blog post covered July 2026 updates and community news.',
    links: ['https://astro.build/blog/whats-new-july-2026/'],
  },
  previousEventThankYou: {
    title: 'Thanks For Joining',
    summary: 'Thanks to everyone who joined the Astro Community Call in June 2026.',
    links: ['https://lu.ma/astro-community-call-june-2026'],
  },
  upcomingEventReminder: {
    title: 'Coming Up Next',
    summary: 'Astro Launch Week is the next upcoming event in the mock schedule.',
    links: ['https://lu.ma/astro-launch-week-july-2026'],
  },
  closing: 'See you next week for the next Astro roundup.',
});

const sampleAgentBriefs = newsletterAgentBriefsSchema.parse({
  releaseHighlights: sampleDraft.releaseHighlights,
  firstTimeContributorShoutOuts: sampleDraft.firstTimeContributorShoutOuts,
  latestBlogPost: sampleDraft.latestBlogPost,
  previousEventThankYou: sampleDraft.previousEventThankYou,
  upcomingEventReminder: sampleDraft.upcomingEventReminder,
  editorialOutline: {
    subject: sampleDraft.subject,
    previewText: sampleDraft.previewText,
    intro: sampleDraft.intro,
    closing: sampleDraft.closing,
  },
});

const sampleQaReport = newsletterQaReportSchema.parse({
  status: 'pass',
  summary: 'The draft is grounded in the provided sample research and covers each required section.',
  checks: [
    'All required sections are present.',
    'Links point back to source material.',
    'Tone stays concise and developer-focused.',
  ],
});

const sampleWorkflowOutput = newsletterDraftWorkflowOutputSchema.parse({
  draftingSource: sampleDraftingSource,
  agentBriefs: sampleAgentBriefs,
  draft: sampleDraft,
  qaReport: sampleQaReport,
});

const sampleNotionPayload = buildNotionNewsletterPagePayload({
  parentPageId: 'notion-parent-page-id',
  draft: sampleDraft,
  research: sampleResearch,
  generatedAt: '2026-07-06T00:00:00.000Z',
});

const sampleEditedMarkdown = extractMarkdownSectionFromNotionBlocks({
  blocks: sampleNotionPayload.children,
  sectionHeading: 'Full Newsletter Body',
});

const sampleEmailArtifact = newsletterEmailArtifactSchema.parse(await renderNewsletterEmail({
  draft: sampleDraft,
  research: sampleResearch,
  generatedAt: '2026-07-06T00:00:00.000Z',
}));

const sampleNewsletterBody = renderNewsletterBodyMarkdown(sampleDraft);

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
console.log(`Sample drafting source releases: ${sampleDraftingSource.releases.length}`);
console.log(`Most recent past event: ${sampleEventCollection.mostRecentPastEvent?.title ?? 'none'}`);
console.log(`Next upcoming event: ${sampleEventCollection.nextUpcomingEvent?.title ?? 'none'}`);
console.log(`Sample newsletter subject: ${sampleDraft.subject}`);
console.log(`Sample workflow QA status: ${sampleWorkflowOutput.qaReport.status}`);
console.log(`Sample newsletter body lines: ${sampleNewsletterBody.split('\n').length}`);
console.log(`Sample Notion block count: ${sampleNotionPayload.children.length}`);
console.log(`Sample edited markdown lines: ${sampleEditedMarkdown.split('\n').filter(Boolean).length}`);
console.log(`Sample email HTML length: ${sampleEmailArtifact.html.length}`);
console.log(`Sample email text length: ${sampleEmailArtifact.text.length}`);
console.log(`Blog source URL: ${astroBlogConfig.blogUrl}`);
console.log(`Blog RSS URL: ${astroBlogConfig.rssUrl}`);
console.log(`Configured env keys: ${configuredKeys.length ? configuredKeys.join(', ') : 'none'}`);
