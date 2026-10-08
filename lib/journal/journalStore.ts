/**
 * Work journal storage.
 *
 * Local dev: one markdown file per entry in src/components/journal/*.md.
 * Production (Netlify): the function filesystem is read-only, so new entries
 * are stored in Netlify Blobs. Bundled *.md files are still listed when present.
 */

import { access, mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Store } from '@netlify/blobs';

export interface JournalFile {
  /** Filename, e.g. WebKit_Continuous_Audio_Resume_Work_Log.md */
  id: string;
  title: string;
  content: string;
  /** ISO date when filename starts with YYYY-MM-DD, otherwise null */
  date: string | null;
  mtimeMs: number;
}

const moduleDir = dirname(fileURLToPath(import.meta.url));

const JOURNAL_DIR_CANDIDATES = [
  join(process.cwd(), 'src/components/journal'),
  join(moduleDir, '../../src/components/journal'),
  join(moduleDir, '../../../src/components/journal'),
];

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})(?:[-_].*)?\.md$/i;

async function resolveJournalDir(): Promise<string> {
  for (const candidate of JOURNAL_DIR_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  return JOURNAL_DIR_CANDIDATES[0];
}

function titleFromMarkdown(filename: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading?.[1]?.trim()) {
    return heading[1].trim();
  }
  return basename(filename, '.md').replace(/[_-]+/g, ' ');
}

function dateFromFilename(filename: string): string | null {
  const match = filename.match(DATE_PREFIX);
  return match?.[1] ?? null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'entry';
}

function sortFiles(files: JournalFile[]): JournalFile[] {
  return [...files].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return b.mtimeMs - a.mtimeMs;
  });
}

interface JournalStorage {
  list(): Promise<JournalFile[]>;
  add(input: { date: string; body: string }): Promise<JournalFile>;
  remove(id: string): Promise<boolean>;
}

class MarkdownFilesJournalStore implements JournalStorage {
  private dir = JOURNAL_DIR_CANDIDATES[0];

  private async ensureDir(): Promise<string> {
    this.dir = await resolveJournalDir();
    await mkdir(this.dir, { recursive: true });
    return this.dir;
  }

  async list(): Promise<JournalFile[]> {
    const dir = await this.ensureDir();
    const names = await readdir(dir);
    const markdownNames = names.filter(
      (name) => name.endsWith('.md') && !name.startsWith('.')
    );

    const files = await Promise.all(
      markdownNames.map(async (name) => {
        const filePath = join(dir, name);
        const content = await readFile(filePath, 'utf-8');
        const { mtimeMs } = await stat(filePath);
        return {
          id: name,
          title: titleFromMarkdown(name, content),
          content,
          date: dateFromFilename(name),
          mtimeMs,
        } satisfies JournalFile;
      })
    );

    return sortFiles(files);
  }

  async add(input: { date: string; body: string }): Promise<JournalFile> {
    const dir = await this.ensureDir();
    const firstLine = input.body.trim().split('\n')[0] ?? '';
    const slug = slugify(firstLine.replace(/^#\s+/, '').slice(0, 60));
    let filename = `${input.date}-${slug}.md`;
    let attempt = 1;

    while (true) {
      try {
        await access(join(dir, filename));
        attempt += 1;
        filename = `${input.date}-${slug}-${attempt}.md`;
      } catch {
        break;
      }
    }

    const title = firstLine.replace(/^#\s+/, '').trim() || `Journal ${input.date}`;
    const content = firstLine.startsWith('#')
      ? `${input.body.trim()}\n`
      : `# ${title}\n\n${input.body.trim()}\n`;

    const filePath = join(dir, filename);
    await writeFile(filePath, content, 'utf-8');

    return {
      id: filename,
      title: titleFromMarkdown(filename, content),
      content,
      date: input.date,
      mtimeMs: Date.now(),
    };
  }

  async remove(id: string): Promise<boolean> {
    const dir = await this.ensureDir();
    const safeName = basename(id);
    if (safeName !== id || !safeName.endsWith('.md') || safeName.includes('..')) {
      return false;
    }

    try {
      await unlink(join(dir, safeName));
      return true;
    } catch {
      return false;
    }
  }
}

const BLOB_STORE_NAME = 'journal';
const BLOB_KEY = 'files';

class BlobsJournalStore implements JournalStorage {
  private store!: Store;

  async init(): Promise<void> {
    const { getStore } = await import('@netlify/blobs');
    this.store = getStore({ name: BLOB_STORE_NAME, consistency: 'strong' });
    await this.loadBlobs();
  }

  private async loadBlobs(): Promise<JournalFile[]> {
    const data = await this.store.get(BLOB_KEY, { type: 'json' });
    return Array.isArray(data) ? (data as JournalFile[]) : [];
  }

  async list(): Promise<JournalFile[]> {
    const [disk, blobs] = await Promise.all([
      readMarkdownDirectory().catch(() => [] as JournalFile[]),
      this.loadBlobs(),
    ]);
    const byId = new Map<string, JournalFile>();
    for (const file of disk) byId.set(file.id, file);
    for (const file of blobs) byId.set(file.id, file);
    return sortFiles([...byId.values()]);
  }

  async add(input: { date: string; body: string }): Promise<JournalFile> {
    const files = await this.loadBlobs();
    const file = buildJournalFile(input, files.map((entry) => entry.id));
    files.push(file);
    await this.store.setJSON(BLOB_KEY, files);
    return file;
  }

  async remove(id: string): Promise<boolean> {
    const safeName = basename(id);
    if (safeName !== id || !safeName.endsWith('.md') || safeName.includes('..')) {
      return false;
    }
    const files = await this.loadBlobs();
    const next = files.filter((file) => file.id !== safeName);
    if (next.length === files.length) return false;
    await this.store.setJSON(BLOB_KEY, next);
    return true;
  }
}

function blobsContextAvailable(): boolean {
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY ||
      process.env.NETLIFY_LOCAL
  );
}

async function readMarkdownDirectory(): Promise<JournalFile[]> {
  const dir = await resolveJournalDir();
  const names = await readdir(dir);
  const markdownNames = names.filter(
    (name) => name.endsWith('.md') && !name.startsWith('.')
  );

  const files = await Promise.all(
    markdownNames.map(async (name) => {
      const filePath = join(dir, name);
      const content = await readFile(filePath, 'utf-8');
      const { mtimeMs } = await stat(filePath);
      return {
        id: name,
        title: titleFromMarkdown(name, content),
        content,
        date: dateFromFilename(name),
        mtimeMs,
      } satisfies JournalFile;
    })
  );

  return files;
}

function buildJournalFile(
  input: { date: string; body: string },
  existingIds: string[]
): JournalFile {
  const firstLine = input.body.trim().split('\n')[0] ?? '';
  const slug = slugify(firstLine.replace(/^#\s+/, '').slice(0, 60));
  let filename = `${input.date}-${slug}.md`;
  let attempt = 1;
  const taken = new Set(existingIds);

  while (taken.has(filename)) {
    attempt += 1;
    filename = `${input.date}-${slug}-${attempt}.md`;
  }

  const title = firstLine.replace(/^#\s+/, '').trim() || `Journal ${input.date}`;
  const content = firstLine.startsWith('#')
    ? `${input.body.trim()}\n`
    : `# ${title}\n\n${input.body.trim()}\n`;

  return {
    id: filename,
    title: titleFromMarkdown(filename, content),
    content,
    date: input.date,
    mtimeMs: Date.now(),
  };
}

let storePromise: Promise<JournalStorage> | null = null;

export async function getJournalStore(): Promise<JournalStorage> {
  if (!storePromise) {
    storePromise = resolveStore();
  }
  return storePromise;
}

async function resolveStore(): Promise<JournalStorage> {
  if (blobsContextAvailable()) {
    try {
      const blobs = new BlobsJournalStore();
      await blobs.init();
      return blobs;
    } catch (error) {
      console.error('[journalStore] Netlify Blobs unavailable:', error);
    }
  }

  return new MarkdownFilesJournalStore();
}
