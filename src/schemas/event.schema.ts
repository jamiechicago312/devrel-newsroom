import { z } from 'zod';

export const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  startDate: z.string().date(),
  endDate: z.string().date(),
  location: z.string().min(1),
  summary: z.string().min(1),
});

export const eventFileSchema = z.array(z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  location: z.string().min(1),
  summary: z.string().min(1),
}));

export const eventCollectionSchema = z.object({
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  source: z.literal('local-events-json'),
  mostRecentPastEvent: eventSchema.nullable(),
  nextUpcomingEvent: eventSchema.nullable(),
});

export type EventRecord = z.infer<typeof eventSchema>;
export type EventCollection = z.infer<typeof eventCollectionSchema>;
