import { z } from 'zod';
import { blogPostSchema } from './blog.schema.ts';
import { firstTimeContributorSchema, githubPullRequestSchema } from './contributor.schema.ts';
import { eventCollectionSchema } from './event.schema.ts';
import { githubReleaseSchema } from './release.schema.ts';

export const newsletterWindowInputSchema = z.object({
  sourceProject: z.string().min(1).default('withastro/astro'),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const newsletterSectionSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  links: z.array(z.string().url()).min(1),
});

export const newsletterDraftSchema = z.object({
  subject: z.string().min(1),
  previewText: z.string().min(1),
  intro: z.string().min(1),
  releaseHighlights: newsletterSectionSchema,
  firstTimeContributorShoutOuts: newsletterSectionSchema,
  latestBlogPost: newsletterSectionSchema,
  previousEventThankYou: newsletterSectionSchema,
  upcomingEventReminder: newsletterSectionSchema,
  closing: z.string().min(1),
});

export const newsletterResearchSchema = z.object({
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  windowDays: z.number().int().nonnegative(),
  status: z.literal('ready'),
  releaseCount: z.number().int().nonnegative(),
  releases: z.array(githubReleaseSchema),
  mergedPullRequestCount: z.number().int().nonnegative(),
  mergedPullRequests: z.array(githubPullRequestSchema),
  contributorCount: z.number().int().nonnegative(),
  contributors: z.array(firstTimeContributorSchema),
  blogSource: z.enum(['rss', 'tavily']),
  blogPostCount: z.number().int().nonnegative(),
  blogPosts: z.array(blogPostSchema),
  eventSource: z.literal('local-events-json'),
  mostRecentPastEvent: eventCollectionSchema.shape.mostRecentPastEvent,
  nextUpcomingEvent: eventCollectionSchema.shape.nextUpcomingEvent,
});

export const newsletterDraftingSourceSchema = z.object({
  sourceProject: z.string().min(1),
  projectUrl: z.string().url(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  releaseCount: z.number().int().nonnegative(),
  releases: z.array(z.object({
    name: z.string().min(1),
    tagName: z.string().min(1),
    url: z.string().url(),
    publishedDate: z.string().date(),
    summary: z.string(),
  })),
  contributorCount: z.number().int().nonnegative(),
  contributors: z.array(z.object({
    login: z.string().min(1),
    mergedDate: z.string().date(),
    pullRequestTitle: z.string().min(1),
    pullRequestUrl: z.string().url(),
  })),
  blogPostCount: z.number().int().nonnegative(),
  blogPosts: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url(),
    publishedDate: z.string().date(),
    summarySourceText: z.string().min(1),
  })),
  mostRecentPastEvent: eventCollectionSchema.shape.mostRecentPastEvent,
  nextUpcomingEvent: eventCollectionSchema.shape.nextUpcomingEvent,
});

export type NewsletterWindowInput = z.infer<typeof newsletterWindowInputSchema>;
export type NewsletterDraft = z.infer<typeof newsletterDraftSchema>;
export type NewsletterResearch = z.infer<typeof newsletterResearchSchema>;
export type NewsletterDraftingSource = z.infer<typeof newsletterDraftingSourceSchema>;
