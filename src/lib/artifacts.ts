import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { NewsletterAgentBriefs, NewsletterQaReport } from '../schemas/agent.schema.ts';
import type { NewsletterEmailArtifact } from '../schemas/email.schema.ts';
import type { NewsletterDraft, NewsletterDraftingSource, NewsletterResearch } from '../schemas/newsletter.schema.ts';

export type PersistedNewsletterArtifacts = {
  runFolder: string;
  researchPath: string;
  draftPath: string;
  reportPath: string;
  htmlPath: string;
  jsonPath: string;
};

function toTimestampFolderName(date = new Date()): string {
  const iso = date.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function persistNewsletterArtifacts(input: {
  research: NewsletterResearch;
  draftingSource: NewsletterDraftingSource;
  agentBriefs: NewsletterAgentBriefs;
  draft: NewsletterDraft;
  qaReport: NewsletterQaReport;
  emailArtifact: NewsletterEmailArtifact;
  outputRoot?: string;
  now?: Date;
}): PersistedNewsletterArtifacts {
  const outputRoot = input.outputRoot ?? path.resolve(import.meta.dirname, '..', '..', 'output');
  const runFolder = path.resolve(outputRoot, toTimestampFolderName(input.now));

  mkdirSync(runFolder, { recursive: true });

  const researchPath = path.resolve(runFolder, 'newsletter-data.json');
  const draftPath = path.resolve(runFolder, 'newsletter-draft.json');
  const reportPath = path.resolve(runFolder, 'newsletter-agent-report.json');
  const htmlPath = path.resolve(runFolder, 'newsletter.html');
  const jsonPath = path.resolve(runFolder, 'newsletter.json');

  writeFileSync(researchPath, `${JSON.stringify(input.research, null, 2)}\n`);
  writeFileSync(draftPath, `${JSON.stringify(input.draft, null, 2)}\n`);
  writeFileSync(reportPath, `${JSON.stringify({
    draftingSource: input.draftingSource,
    agentBriefs: input.agentBriefs,
    qaReport: input.qaReport,
  }, null, 2)}\n`);
  writeFileSync(htmlPath, input.emailArtifact.html);
  writeFileSync(jsonPath, `${JSON.stringify(input.emailArtifact, null, 2)}\n`);

  return {
    runFolder,
    researchPath,
    draftPath,
    reportPath,
    htmlPath,
    jsonPath,
  };
}
