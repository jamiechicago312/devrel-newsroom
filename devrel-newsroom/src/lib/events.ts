import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  eventCollectionSchema,
  eventFileSchema,
  eventSchema,
  type EventCollection,
  type EventRecord,
} from '../schemas/event.schema.ts';

function normalizeEvent(record: {
  id: string;
  title: string;
  url: string;
  startAt: string;
  endAt: string;
  location: string;
  summary: string;
}): EventRecord {
  return eventSchema.parse({
    ...record,
    startDate: record.startAt.slice(0, 10),
    endDate: record.endAt.slice(0, 10),
  });
}

export function loadMockEvents(filePath = path.resolve(import.meta.dirname, '..', '..', 'data', 'events.json')): EventRecord[] {
  const payload = JSON.parse(readFileSync(filePath, 'utf8'));
  return eventFileSchema.parse(payload).map(normalizeEvent);
}

export function selectNewsletterEvents(input: {
  events: EventRecord[];
  sourceProject: string;
  startDate: string;
  endDate: string;
}): EventCollection {
  const referenceBoundary = `${input.endDate}T23:59:59Z`;
  const sortedEvents = [...input.events].sort((left, right) => left.startAt.localeCompare(right.startAt) || left.id.localeCompare(right.id));

  let mostRecentPastEvent: EventRecord | null = null;
  let nextUpcomingEvent: EventRecord | null = null;

  for (const event of sortedEvents) {
    if (event.startAt <= referenceBoundary) {
      mostRecentPastEvent = event;
      continue;
    }

    nextUpcomingEvent = event;
    break;
  }

  return eventCollectionSchema.parse({
    sourceProject: input.sourceProject,
    startDate: input.startDate,
    endDate: input.endDate,
    source: 'local-events-json',
    mostRecentPastEvent,
    nextUpcomingEvent,
  });
}
