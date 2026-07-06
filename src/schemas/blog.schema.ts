import { z } from 'zod';

export const blogPostSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().datetime({ offset: true }),
  publishedDate: z.string().date(),
  summarySourceText: z.string().min(1),
});

export const blogPostCollectionSchema = z.object({
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  source: z.enum(['rss', 'tavily']),
  blogPostCount: z.number().int().nonnegative(),
  posts: z.array(blogPostSchema),
});

export type BlogPost = z.infer<typeof blogPostSchema>;
export type BlogPostCollection = z.infer<typeof blogPostCollectionSchema>;
