// Public API of the search subsystem (SRS §3.5 — import-isolated; other
// subsystems, and src/app pages, import only from this barrel).

export {
  loadSearchIndex,
  clearSearchIndexCache,
  searchIndexUrl,
  SearchIndexLoadError,
} from './load-search-index';
export type { SearchIndex, SearchIndexLesson, SearchSubject } from './load-search-index';

export { searchLessons } from './query';
export type { SearchResult } from './query';
