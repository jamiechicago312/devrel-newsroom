import type { NewsletterDraft, NewsletterResearch } from '../schemas/newsletter.schema.ts';
import { buildNewsletterSourceMetadata, renderNewsletterBodyMarkdown } from './newsletter.ts';

const NOTION_VERSION = '2022-06-28';

type NotionRichText = {
  type: 'text';
  text: {
    content: string;
    link: { url: string } | null;
  };
};

type NotionBlock = {
  object: 'block';
  type: 'paragraph' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'code';
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

export async function createNotionPage(input: {
  notionToken: string;
  payload: NotionCreatePagePayload;
  fetchImpl?: typeof fetch;
}): Promise<NotionCreatePageResult> {
  const response = await (input.fetchImpl ?? fetch)('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify(input.payload),
  });

  const responseText = await response.text();
  const responseJson = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const message = responseJson?.message ?? response.statusText;
    throw new Error(`Notion page creation failed: ${message}`);
  }

  return {
    id: responseJson.id,
    url: responseJson.url,
  };
}
