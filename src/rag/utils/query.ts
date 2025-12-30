import {
  queryPassages,
  getCollectionStats,
  type QueryResult,
} from './vectorStore';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Query a specific philosopher's texts for relevant passages
 */
export async function queryPhilosopher(
  philosopher: string,
  topic: string,
  limit: number = 5
): Promise<QueryResult[]> {
  return queryPassages(topic, { philosopher, limit });
}

/**
 * Query all philosophers for relevant passages
 */
export async function queryAllPhilosophers(
  topic: string,
  limit: number = 5
): Promise<QueryResult[]> {
  return queryPassages(topic, { limit });
}
