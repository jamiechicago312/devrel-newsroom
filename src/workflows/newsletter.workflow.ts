import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { collectAstroBlogPosts } from '../lib/blog.ts';
import { readEnv } from '../lib/env.ts';
import { loadMockEvents, selectNewsletterEvents } from '../lib/events.ts';
import {
  fetchGitHubReleases,
  fetchMergedPullRequests,
  filterPullRequestsByWindow,
  filterReleasesByWindow,
  identifyFirstTimeContributors,
} from '../lib/github.ts';
import { blogPostSchema } from '../schemas/blog.schema.ts';
import { githubContributorCollectionSchema, githubPullRequestSchema, firstTimeContributorSchema } from '../schemas/contributor.schema.ts';
import { newsletterResearchSchema, newsletterWindowInputSchema } from '../schemas/newsletter.schema.ts';
import { githubReleaseSchema } from '../schemas/release.schema.ts';

const newsletterWindowSchema = z.object({
  sourceProject: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  windowDays: z.number().int().nonnegative(),
  status: z.literal('ready'),
});

const newsletterReleaseResearchSchema = newsletterWindowSchema.extend({
  releaseCount: z.number().int().nonnegative(),
  releases: z.array(githubReleaseSchema),
});

const newsletterContributorResearchSchema = newsletterReleaseResearchSchema.extend({
  mergedPullRequestCount: z.number().int().nonnegative(),
  mergedPullRequests: z.array(githubPullRequestSchema),
  contributorCount: z.number().int().nonnegative(),
  contributors: z.array(firstTimeContributorSchema),
});

const newsletterBlogResearchSchema = newsletterContributorResearchSchema.extend({
  blogSource: z.enum(['rss', 'tavily']),
  blogPostCount: z.number().int().nonnegative(),
  blogPosts: z.array(blogPostSchema),
});


const prepareNewsletterWindow = createStep({
  id: 'prepare-newsletter-window',
  description: 'Validates the requested newsletter window for later collection steps.',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterWindowSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const parsed = newsletterWindowInputSchema.parse(inputData);
    const start = new Date(`${parsed.startDate}T00:00:00Z`);
    const end = new Date(`${parsed.endDate}T00:00:00Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date input');
    }

    if (end < start) {
      throw new Error('endDate must be on or after startDate');
    }

    const windowDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    return {
      sourceProject: parsed.sourceProject,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      windowDays,
      status: 'ready' as const,
    };
  },
});

const collectGitHubReleases = createStep({
  id: 'collect-github-releases',
  description: 'Collects published GitHub releases for the configured source project within the requested window.',
  inputSchema: newsletterWindowSchema,
  outputSchema: newsletterReleaseResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const env = readEnv();
    if (!env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required to collect live GitHub releases');
    }

    const releases = await fetchGitHubReleases({
      sourceProject: inputData.sourceProject,
      githubToken: env.GITHUB_TOKEN,
    });

    const filteredReleases = filterReleasesByWindow({
      releases,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
    });

    return {
      ...inputData,
      releaseCount: filteredReleases.length,
      releases: filteredReleases,
    };
  },
});

const collectGitHubContributors = createStep({
  id: 'collect-github-contributors',
  description: 'Collects merged pull requests in the window and identifies first-time contributors.',
  inputSchema: newsletterReleaseResearchSchema,
  outputSchema: newsletterContributorResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const env = readEnv();
    if (!env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required to collect live GitHub pull requests');
    }

    const mergedPullRequests = await fetchMergedPullRequests({
      sourceProject: inputData.sourceProject,
      startDate: inputData.startDate,
      githubToken: env.GITHUB_TOKEN,
      maxPages: 20,
    });

    const filteredPullRequests = filterPullRequestsByWindow({
      pullRequests: mergedPullRequests,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
    });

    const contributors = await identifyFirstTimeContributors({
      sourceProject: inputData.sourceProject,
      pullRequests: filteredPullRequests,
      historicalPullRequests: mergedPullRequests,
      githubToken: env.GITHUB_TOKEN,
    });

    githubContributorCollectionSchema.parse({
      sourceProject: inputData.sourceProject,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
      mergedPullRequestCount: filteredPullRequests.length,
      mergedPullRequests: filteredPullRequests,
      contributorCount: contributors.length,
      contributors,
    });

    return {
      ...inputData,
      mergedPullRequestCount: filteredPullRequests.length,
      mergedPullRequests: filteredPullRequests,
      contributorCount: contributors.length,
      contributors,
    };
  },
});

const collectBlogPosts = createStep({
  id: 'collect-blog-posts',
  description: 'Collects Astro blog posts for the requested window using RSS with Tavily fallback.',
  inputSchema: newsletterContributorResearchSchema,
  outputSchema: newsletterBlogResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const env = readEnv();
    const blogResult = await collectAstroBlogPosts({
      startDate: inputData.startDate,
      endDate: inputData.endDate,
      tavilyApiKey: env.TAVILY_API_KEY,
    });

    return {
      ...inputData,
      blogSource: blogResult.source,
      blogPostCount: blogResult.posts.length,
      blogPosts: blogResult.posts,
    };
  },
});

const collectEvents = createStep({
  id: 'collect-events',
  description: 'Collects the most recent past event and next upcoming event from local mock event data.',
  inputSchema: newsletterBlogResearchSchema,
  outputSchema: newsletterResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const events = loadMockEvents();
    const eventCollection = selectNewsletterEvents({
      events,
      sourceProject: inputData.sourceProject,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
    });

    return {
      ...inputData,
      eventSource: eventCollection.source,
      mostRecentPastEvent: eventCollection.mostRecentPastEvent,
      nextUpcomingEvent: eventCollection.nextUpcomingEvent,
    };
  },
});

export const newsletterWorkflow = createWorkflow({
  id: 'newsletter-workflow',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterResearchSchema,
})
  .then(prepareNewsletterWindow)
  .then(collectGitHubReleases)
  .then(collectGitHubContributors)
  .then(collectBlogPosts)
  .then(collectEvents);

newsletterWorkflow.commit();
