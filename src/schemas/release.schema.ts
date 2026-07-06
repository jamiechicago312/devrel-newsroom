import { z } from 'zod';

export const githubReleaseSchema = z.object({
  id: z.number().int().nonnegative(),
  tagName: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  isPrerelease: z.boolean(),
  isDraft: z.boolean(),
  publishedAt: z.string().datetime({ offset: true }),
  publishedDate: z.string().date(),
  authorLogin: z.string().min(1),
  summary: z.string(),
});

export const githubReleaseCollectionSchema = z.object({
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  releaseCount: z.number().int().nonnegative(),
  releases: z.array(githubReleaseSchema),
});

export type GitHubRelease = z.infer<typeof githubReleaseSchema>;
export type GitHubReleaseCollection = z.infer<typeof githubReleaseCollectionSchema>;
