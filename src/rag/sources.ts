/**
 * RAG Text Sources
 *
 * This file re-exports text sources from the unified philosopher constants.
 * The actual data is maintained in src/constants/philosophers.ts
 */

import {
  getAllTextSources,
  getTextSourcesForPhilosopher,
  getAllPhilosopherIds,
  getPhilosopher,
  type TextSource as PhilosopherTextSource,
} from '../constants/philosophers';

export interface TextSource {
  id: string;
  title: string;
  author: string;
  philosopher: string;
  url: string;
  format: 'txt' | 'html' | 'pdf';
  description?: string;
}

/**
 * Get all text sources formatted for RAG indexing
 */
export const TEXT_SOURCES: TextSource[] = getAllTextSources().map(source => {
  const philosopher = getPhilosopher(source.philosopher);
  return {
    id: source.id,
    title: source.title,
    author: philosopher?.name || source.philosopher,
    philosopher: source.philosopher,
    url: source.url,
    format: source.format,
    description: source.description,
  };
});

/**
 * Group sources by philosopher
 */
export function getSourcesByPhilosopher(philosopher: string): TextSource[] {
  return TEXT_SOURCES.filter(s => s.philosopher === philosopher);
}

/**
 * Get all unique philosophers that have text sources
 */
export function getAllPhilosophers(): string[] {
  return [...new Set(TEXT_SOURCES.map(s => s.philosopher))];
}

// Re-export types and functions for convenience
export type { PhilosopherTextSource };
export {
  getAllTextSources,
  getTextSourcesForPhilosopher,
  getAllPhilosopherIds,
};
