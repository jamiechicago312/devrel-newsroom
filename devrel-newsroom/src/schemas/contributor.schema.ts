import { z } from 'zod';

export const githubPullRequestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  url: z.string().url(),
  authorLogin: z.string().min(1),
  mergedAt: z.string().datetime({ offset: true }),
  mergedDate: z.string().date(),
});

export const firstTimeContributorSchema = z.object({
  login: z.string().min(1),
  mergedAt: z.string().datetime({ offset: true }),
  mergedDate: z.string().date(),
  pullRequest: githubPullRequestSchema,
});

export const githubContributorCollectionSchema = z.object({
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  mergedPullRequestCount: z.number().int().nonnegative(),
  mergedPullRequests: z.array(githubPullRequestSchema),
  contributorCount: z.number().int().nonnegative(),
  contributors: z.array(firstTimeContributorSchema),
});

export type GitHubPullRequest = z.infer<typeof githubPullRequestSchema>;
export type FirstTimeContributor = z.infer<typeof firstTimeContributorSchema>;
export type GitHubContributorCollection = z.infer<typeof githubContributorCollectionSchema>;
