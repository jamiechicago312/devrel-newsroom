import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { readEnv } from '../lib/env';
import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { DuckDBStore } from '@mastra/duckdb';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import {
  MastraPlatformExporter,
  MastraStorageExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { communityCuratorAgent } from '../agents/community-curator.agent';
import { contributorSpotlightAgent } from '../agents/contributor-spotlight.agent';
import { newsletterEditorAgent } from '../agents/newsletter-editor.agent';
import { newsletterQaAgent } from '../agents/newsletter-qa.agent';
import { newsletterWriterAgent } from '../agents/newsletter-writer.agent';
import { releaseAnalystAgent } from '../agents/release-analyst.agent';
import { newsletterDraftWorkflow } from '../workflows/newsletter-draft.workflow';
import { newsletterWorkflow } from '../workflows/newsletter.workflow';

const storageDir = path.resolve(import.meta.dirname, '..', '..', '.mastra', 'storage');

mkdirSync(storageDir, { recursive: true });
readEnv();

export const mastra = new Mastra({
  workflows: { newsletterWorkflow, newsletterDraftWorkflow },
  agents: {
    releaseAnalystAgent,
    contributorSpotlightAgent,
    communityCuratorAgent,
    newsletterEditorAgent,
    newsletterWriterAgent,
    newsletterQaAgent,
  },
  storage: new MastraCompositeStore({
    id: 'newsroom-storage',
    default: new LibSQLStore({
      id: 'newsroom-libsql',
      url: `file:${path.join(storageDir, 'mastra.db')}`,
    }),
    domains: {
      observability: await new DuckDBStore({
        path: path.join(storageDir, 'observability.duckdb'),
      }).getStore('observability'),
    },
  }),
  logger: new PinoLogger({
    name: 'devrel-newsroom',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'devrel-newsroom',
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
