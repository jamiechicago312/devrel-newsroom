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
import { newsletterWriterAgent } from '../agents/newsletter-writer.agent';
import { newsletterWorkflow } from '../workflows/newsletter.workflow';

export const mastra = new Mastra({
  workflows: { newsletterWorkflow },
  agents: { newsletterWriterAgent },
  storage: new MastraCompositeStore({
    id: 'newsroom-storage',
    default: new LibSQLStore({
      id: 'newsroom-libsql',
      url: 'file:./mastra.db',
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
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
