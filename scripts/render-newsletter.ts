import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderNewsletterEmail } from '../src/lib/email.ts';
import { newsletterDraftSchema, newsletterResearchSchema } from '../src/schemas/newsletter.schema.ts';

const draftPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(import.meta.dirname, '..', 'output', 'newsletter-draft.json');
const researchPath = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : path.resolve(import.meta.dirname, '..', 'output', 'newsletter-data.json');

const draft = newsletterDraftSchema.parse(JSON.parse(readFileSync(draftPath, 'utf8')));
const research = newsletterResearchSchema.parse(JSON.parse(readFileSync(researchPath, 'utf8')));
const generatedAt = new Date().toISOString();

const artifact = await renderNewsletterEmail({
  draft,
  research,
  generatedAt,
});

const outputDir = path.resolve(import.meta.dirname, '..', 'output');
mkdirSync(outputDir, { recursive: true });
const htmlPath = path.resolve(outputDir, 'newsletter.html');
const jsonPath = path.resolve(outputDir, 'newsletter.json');

writeFileSync(htmlPath, artifact.html);
writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}
`);

console.log(`Wrote rendered newsletter HTML to ${htmlPath}`);
console.log(`Wrote Resend-ready newsletter JSON to ${jsonPath}`);
console.log(`Rendered subject: ${artifact.subject}`);
