import type { NewsletterDraft, NewsletterResearch } from '../schemas/newsletter.schema.ts';
import { buildNewsletterSourceMetadata, renderNewsletterBodyMarkdown } from './newsletter.ts';

const NOTION_VERSION = '2022-06-28';

type NotionRichText = {
  type: 'text';
  plain_text?: string;
  text?: {
    content: string;
    link: { url: string } | null;
  };
  href?: string | null;
};

type NotionBlockType = 'paragraph' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'code';

export type NotionBlock = {
  object: 'block';
  id?: string;
  type: NotionBlockType;
  has_children?: boolean;
} & Record<string, unknown>;

type NotionCreatePagePayload = {
  parent: {
    type: 'page_id';
    page_id: string;
  };
  properties: {
    title: {
      title: NotionRichText[];
    };
  };
  children: NotionBlock[];
};

type NotionBlockListResponse = {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
};

export type NotionCreatePageResult = {
  id: string;
  url: string;
};

function text(content: string, url?: string): NotionRichText {
  return {
    type: 'text',
    text: {
      content,
      link: url ? { url } : null,
    },
  };
}

function paragraph(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [text(content)],
    },
  };
}

function heading2(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [text(content)],
    },
  };
}

function heading3(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [text(content)],
    },
  };
}

function bullet(content: string, url?: string): NotionBlock {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [text(content, url)],
    },
  };
}

function codeBlock(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'code',
    code: {
      language: 'markdown',
      rich_text: [text(content)],
    },
  };
}

function buildSectionBlocks(section: {
  title: string;
  summary: string;
  links: string[];
}): NotionBlock[] {
  return [
    heading3(section.title),
    paragraph(section.summary),
    ...section.links.map(link => bullet(link, link)),
  ];
}

function getRichTextArray(block: NotionBlock): NotionRichText[] {
  const payload = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  return payload?.rich_text ?? [];
}

export function notionRichTextToPlainText(richText: NotionRichText[] = []): string {
  return richText.map(item => item.plain_text ?? item.text?.content ?? '').join('');
}

function formatBlockAsMarkdown(block: NotionBlock): string[] {
  const textContent = notionRichTextToPlainText(getRichTextArray(block)).trim();

  if (!textContent) {
    return [];
  }

  switch (block.type) {
    case 'heading_2':
      return [`## ${textContent}`];
    case 'heading_3':
      return [`### ${textContent}`];
    case 'bulleted_list_item':
      return [`- ${textContent}`];
    case 'code':
      return ['```md', textContent, '```'];
    case 'paragraph':
    default:
      return [textContent];
  }
}

export function extractMarkdownSectionFromNotionBlocks(input: {
  blocks: NotionBlock[];
  sectionHeading: string;
}): string {
  const { blocks, sectionHeading } = input;
  let inSection = false;
  const lines: string[] = [];

  for (const block of blocks) {
    if (block.type === 'heading_2') {
      const headingText = notionRichTextToPlainText(getRichTextArray(block)).trim();

      if (inSection && headingText !== sectionHeading) {
        break;
      }

      if (headingText === sectionHeading) {
        inSection = true;
        continue;
      }
    }

    if (!inSection) {
      continue;
    }

    const rendered = formatBlockAsMarkdown(block);
    if (rendered.length > 0) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push(...rendered);
    }
  }

  return lines.length > 0 ? `${lines.join('\n').trim()}\n` : '';
}

export function buildNotionNewsletterPagePayload(input: {
  parentPageId: string;
  draft: NewsletterDraft;
  research: NewsletterResearch;
  generatedAt: string;
}): NotionCreatePagePayload {
  const { parentPageId, draft, research, generatedAt } = input;
  const bodyMarkdown = renderNewsletterBodyMarkdown(draft);
  const metadataLines = buildNewsletterSourceMetadata(research);

  return {
    parent: {
      type: 'page_id',
      page_id: parentPageId,
    },
    properties: {
      title: {
        title: [text(draft.subject.slice(0, 2000))],
      },
    },
    children: [
      heading2('Subject Line'),
      paragraph(draft.subject),
      heading2('Preview Text'),
      paragraph(draft.previewText),
      heading2('Full Newsletter Body'),
      paragraph(draft.intro),
      ...buildSectionBlocks(draft.releaseHighlights),
      ...buildSectionBlocks(draft.firstTimeContributorShoutOuts),
      ...buildSectionBlocks(draft.latestBlogPost),
      ...buildSectionBlocks(draft.previousEventThankYou),
      ...buildSectionBlocks(draft.upcomingEventReminder),
      paragraph(draft.closing),
      heading2('Source Metadata'),
      ...metadataLines.map(line => bullet(line)),
      heading2('Generated Timestamp'),
      paragraph(generatedAt),
      heading2('Rendered Body Markdown'),
      codeBlock(bodyMarkdown.slice(0, 1900)),
    ],
  };
}

async function notionJsonRequest<T>(input: {
  notionToken: string;
  url: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  fetchImpl?: typeof fetch;
}): Promise<T> {
  const response = await (input.fetchImpl ?? fetch)(input.url, {
    method: input.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${input.notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });

  const responseText = await response.text();
  const responseJson = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message = responseJson?.message ?? response.statusText;
    throw new Error(`Notion request failed: ${message}`);
  }

  return responseJson as T;
}

export async function createNotionPage(input: {
  notionToken: string;
  payload: NotionCreatePagePayload;
  fetchImpl?: typeof fetch;
}): Promise<NotionCreatePageResult> {
  const responseJson = await notionJsonRequest<{ id: string; url: string }>({
    notionToken: input.notionToken,
    url: 'https://api.notion.com/v1/pages',
    method: 'POST',
    body: input.payload,
    fetchImpl: input.fetchImpl,
  });

  return {
    id: responseJson.id,
    url: responseJson.url,
  };
}

export async function listNotionBlockChildren(input: {
  notionToken: string;
  blockId: string;
  fetchImpl?: typeof fetch;
}): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${input.blockId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) {
      url.searchParams.set('start_cursor', cursor);
    }

    const responseJson = await notionJsonRequest<NotionBlockListResponse>({
      notionToken: input.notionToken,
      url: url.toString(),
      fetchImpl: input.fetchImpl,
    });

    blocks.push(...responseJson.results);
    cursor = responseJson.has_more ? responseJson.next_cursor : null;
  } while (cursor);

  return blocks;
}
