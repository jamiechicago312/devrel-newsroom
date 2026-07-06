import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../src/lib/env.ts';
import { extractMarkdownSectionFromNotionBlocks, listNotionBlockChildren } from '../src/lib/notion.ts';

const publishResultPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(import.meta.dirname, '..', 'output', 'notion-publish-result.json');
const pageIdArg = process.argv[3];

const env = readEnv();
if (!env.NOTION_TOKEN) {
  console.error('NOTION_TOKEN is required to sync a newsletter draft back from Notion.');
  process.exit(1);
}

const publishedResult = JSON.parse(readFileSync(publishResultPath, 'utf8')) as { pageId?: string; url?: string };
const pageId = pageIdArg ?? publishedResult.pageId;

if (!pageId) {
  console.error('A Notion page id is required. Pass it explicitly or provide output/notion-publish-result.json with a pageId.');
  process.exit(1);
}

const blocks = await listNotionBlockChildren({
  notionToken: env.NOTION_TOKEN,
  blockId: pageId,
});

const editedMarkdown = extractMarkdownSectionFromNotionBlocks({
  blocks,
  sectionHeading: 'Full Newsletter Body',
});

if (!editedMarkdown.trim()) {
  throw new Error('No editable newsletter body was found under the "Full Newsletter Body" heading.');
}

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'newsletter-edited.md');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, editedMarkdown);

console.log(`Synced edited newsletter body from Notion page ${pageId}`);
console.log(`Wrote edited markdown to ${outputPath}`);
