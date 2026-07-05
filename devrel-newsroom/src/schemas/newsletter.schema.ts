import { z } from 'zod';

export const newsletterWindowInputSchema = z.object({
  sourceProject: z.string().min(1).default('withastro/astro'),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const newsletterSectionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  links: z.array(z.string().url()).default([]),
});

export const newsletterDraftSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  intro: z.string(),
  sections: z.array(newsletterSectionSchema),
  closing: z.string(),
});

export type NewsletterWindowInput = z.infer<typeof newsletterWindowInputSchema>;
export type NewsletterDraft = z.infer<typeof newsletterDraftSchema>;
