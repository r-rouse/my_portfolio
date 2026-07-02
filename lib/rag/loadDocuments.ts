/**
 * Knowledge Base loader — reads portfolio markdown files from disk.
 *
 * Architecture position:
 *   Retrieval Service → Knowledge Base (this file)
 *
 * All portfolio facts live in content/*.md. Update those files to change what
 * the assistant knows; no code changes required.
 */

import fs from 'fs/promises';
import path from 'path';
import type { PortfolioDocument } from '../types/chat';

/** Canonical list of knowledge-base files, loaded in a stable order. */
const KNOWLEDGE_BASE_FILES = [
  'bio.md',
  'resume.md',
  'experience.md',
  'projects.md',
  'skills.md',
] as const;

function getContentDirectory(): string {
  return path.join(process.cwd(), 'content');
}

/**
 * Loads every markdown file from the knowledge base.
 */
export async function loadDocuments(): Promise<PortfolioDocument[]> {
  const contentDir = getContentDirectory();

  const documents = await Promise.all(
    KNOWLEDGE_BASE_FILES.map(async (filename) => {
      const filePath = path.join(contentDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return { filename, content };
    })
  );

  return documents;
}
