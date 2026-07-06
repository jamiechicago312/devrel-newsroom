import { z } from 'zod';

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

export type NewsletterWindowInput = z.infer<typeof newsletterWindowInputSchema>;
export type NewsletterDraft = z.infer<typeof newsletterDraftSchema>;
