import { apiFetch } from './api';

export interface SearchItem {
  id: number;
  title: string;
  subtitle: string;
}

export interface SearchResult {
  topics: SearchItem[];
  papers: SearchItem[];
  resources: SearchItem[];
}

export function search(query: string) {
  return apiFetch<SearchResult>(`/api/Search?q=${encodeURIComponent(query)}`);
}