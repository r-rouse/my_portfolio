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
import { fileURLToPath } from 'url';
import type { PortfolioDocument } from '../types/chat';

/** Canonical list of knowledge-base files, loaded in a stable order. */
const KNOWLEDGE_BASE_FILES = [
  'bio.md',
  'resume.md',
  'experience.md',
  'projects.md',
  'skills.md',
] as const;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the content directory across environments.
 *
 * Local dev / Express: cwd is the repo root, so `<cwd>/content` works.
 * Netlify Functions: content is shipped via `included_files` in netlify.toml;
 * cwd usually points at the repo root there too, but we fall back to paths
 * relative to this module so the loader is resilient to bundler layout.
 */
async function getContentDirectory(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), 'content'),
    path.resolve(moduleDir, '../../content'),
    path.resolve(moduleDir, '../../../content'),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

/**
 * Loads every markdown file from the knowledge base.
 */
export async function loadDocuments(): Promise<PortfolioDocument[]> {
  const contentDir = await getContentDirectory();

  const documents = await Promise.all(
    KNOWLEDGE_BASE_FILES.map(async (filename) => {
      const filePath = path.join(contentDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return { filename, content };
    })
  );

  return documents;
}
