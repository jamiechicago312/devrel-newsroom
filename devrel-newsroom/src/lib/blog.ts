import { blogPostSchema, type BlogPost } from '../schemas/blog.schema.ts';

const astroBlogUrl = 'https://astro.build/blog/';
const astroBlogRssUrl = 'https://astro.build/rss.xml';
const tavilySearchUrl = 'https://api.tavily.com/search';

type TavilySearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    raw_content?: string | null;
    published_date?: string | null;
  }>;
};

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value: string): string {
  return decodeXmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSummarySourceText(value: string | null | undefined): string {
  const stripped = stripHtml(value ?? '');

  if (!stripped) {
    return 'No summary text available.';
  }

  return stripped.length <= 400 ? stripped : `${stripped.slice(0, 397).trimEnd()}...`;
}

function parseRssItems(xml: string): string[] {
  const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi);
  return matches ?? [];
}

function extractXmlTagValue(xml: string, tagName: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1]?.trim() ?? null;
}

function normalizeBlogPost(input: {
  title: string;
  url: string;
  publishedAt: string;
  summarySourceText: string;
}): BlogPost {
  return blogPostSchema.parse({
    title: input.title.trim(),
    url: input.url.trim(),
    publishedAt: input.publishedAt,
    publishedDate: input.publishedAt.slice(0, 10),
    summarySourceText: normalizeSummarySourceText(input.summarySourceText),
  });
}

export function parseAstroBlogRss(xml: string): BlogPost[] {
  return parseRssItems(xml)
    .map(item => {
      const title = extractXmlTagValue(item, 'title');
      const url = extractXmlTagValue(item, 'link');
      const pubDate = extractXmlTagValue(item, 'pubDate');
      const description = extractXmlTagValue(item, 'description');
      const content = extractXmlTagValue(item, 'content:encoded');

      if (!title || !url || !pubDate) {
        return null;
      }

      const publishedAt = new Date(pubDate).toISOString();

      return normalizeBlogPost({
        title: stripHtml(title),
        url: decodeXmlEntities(url),
        publishedAt,
        summarySourceText: content ?? description ?? '',
      });
    })
    .filter((post): post is BlogPost => Boolean(post));
}

export async function fetchAstroBlogPostsFromRss(input?: {
  fetchImpl?: typeof fetch;
  rssUrl?: string;
}): Promise<BlogPost[]> {
  const fetchImpl = input?.fetchImpl ?? fetch;
  const response = await fetchImpl(input?.rssUrl ?? astroBlogRssUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1',
      'User-Agent': 'devrel-newsroom',
    },
  });

  if (!response.ok) {
    throw new Error(`Astro blog RSS request failed with ${response.status} ${response.statusText}`);
  }

  return parseAstroBlogRss(await response.text());
}

export async function fetchAstroBlogPostsWithTavily(input: {
  tavilyApiKey: string;
  startDate: string;
  endDate: string;
  fetchImpl?: typeof fetch;
}): Promise<BlogPost[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(tavilySearchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: input.tavilyApiKey,
      query: `site:astro.build/blog Astro blog posts published between ${input.startDate} and ${input.endDate}`,
      topic: 'news',
      search_depth: 'advanced',
      include_raw_content: true,
      max_results: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily blog search failed with ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as TavilySearchResponse;

  return (payload.results ?? [])
    .map(result => {
      if (!result.title || !result.url || !result.published_date) {
        return null;
      }

      const publishedAt = new Date(result.published_date).toISOString();
      return normalizeBlogPost({
        title: result.title,
        url: result.url,
        publishedAt,
        summarySourceText: result.raw_content ?? result.content ?? '',
      });
    })
    .filter((post): post is BlogPost => Boolean(post));
}

export function filterBlogPostsByWindow(input: {
  posts: BlogPost[];
  startDate: string;
  endDate: string;
}): BlogPost[] {
  return input.posts
    .filter(post => post.publishedDate >= input.startDate && post.publishedDate <= input.endDate)
    .sort((left, right) => left.publishedAt.localeCompare(right.publishedAt) || left.url.localeCompare(right.url));
}

export async function collectAstroBlogPosts(input: {
  startDate: string;
  endDate: string;
  tavilyApiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ source: 'rss' | 'tavily'; posts: BlogPost[] }> {
  const rssPosts = await fetchAstroBlogPostsFromRss({
    fetchImpl: input.fetchImpl,
  });
  const filteredRssPosts = filterBlogPostsByWindow({
    posts: rssPosts,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  if (filteredRssPosts.length > 0 || !input.tavilyApiKey) {
    return {
      source: 'rss',
      posts: filteredRssPosts,
    };
  }

  const tavilyPosts = await fetchAstroBlogPostsWithTavily({
    tavilyApiKey: input.tavilyApiKey,
    startDate: input.startDate,
    endDate: input.endDate,
    fetchImpl: input.fetchImpl,
  });

  return {
    source: 'tavily',
    posts: filterBlogPostsByWindow({
      posts: tavilyPosts,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
  };
}

export const astroBlogConfig = {
  blogUrl: astroBlogUrl,
  rssUrl: astroBlogRssUrl,
};
