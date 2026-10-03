/**
 * About-page content only. Not used by the chatbot RAG knowledge base
 * (which reads content/*.md separately).
 *
 * Bio body comes from /BIO.md via Vite ?raw import in AboutPage.
 * Hobbies and favorites will load from their own .md files later.
 */

export const aboutPlaceholders = {
  hobbies: {
    title: 'Hobbies',
    emptyMessage: 'Coming soon.',
  },
  favorites: {
    title: 'Favorites',
    emptyMessage: 'Coming soon.',
  },
};

/** Split BIO.md into display paragraphs (skip the # Bio heading). */
export function paragraphsFromBioMarkdown(markdown) {
  return markdown
    .replace(/^#\s*Bio\s*\n+/i, '')
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}
