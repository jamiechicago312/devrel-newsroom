import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import { buildNotionNewsletterPagePayload, createNotionPage } from '../src/lib/notion.ts';
import { newsletterDraftSchema, newsletterResearchSchema } from '../src/schemas/newsletter.schema.ts';

const draftPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(import.meta.dirname, '..', 'output', 'newsletter-draft.json');
const researchPath = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.resolve(import.meta.dirname, '..', 'output', 'newsletter-data.json');

const env = readEnv();

if (!env.NOTION_TOKEN) {
  console.error('NOTION_TOKEN is required to publish a newsletter draft to Notion.');
  process.exit(1);
}

if (!env.NOTION_PAGE_ID) {
  console.error('NOTION_PAGE_ID is required and should point to the parent Notion page for draft publication.');
  process.exit(1);
}

const draft = newsletterDraftSchema.parse(JSON.parse(readFileSync(draftPath, 'utf8')));
const research = newsletterResearchSchema.parse(JSON.parse(readFileSync(researchPath, 'utf8')));
const generatedAt = new Date().toISOString();

const payload = buildNotionNewsletterPagePayload({
  parentPageId: env.NOTION_PAGE_ID,
  draft,
  research,
  generatedAt,
});

const result = await createNotionPage({
  notionToken: env.NOTION_TOKEN,
  payload,
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'notion-publish-result.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({
  pageId: result.id,
  url: result.url,
  generatedAt,
  sourceProject: research.sourceProject,
  startDate: research.startDate,
  endDate: research.endDate,
}, null, 2)}
`);

console.log(`Published newsletter draft to Notion page ${result.id}`);
console.log(`Notion URL: ${result.url}`);
console.log(`Wrote publish result to ${outputPath}`);
