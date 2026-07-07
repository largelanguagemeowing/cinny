import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTrendingGifs, KlipyGif, searchGifs } from '../utils/klipy';

export type GifFetchStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseKlipyGifs = {
  gifs: KlipyGif[];
  status: GifFetchStatus;
  error: string | undefined;
  hasMore: boolean;
  loadMore: () => void;
  search: (query: string) => void;
  resetSearch: () => void;
};

// A hook that fetches trending GIFs by default and switches to search results
// when a query is provided. Supports cursor-based pagination via loadMore().
export const useKlipyGifs = (): UseKlipyGifs => {
  const [gifs, setGifs] = useState<KlipyGif[]>([]);
  const [status, setStatus] = useState<GifFetchStatus>('idle');
  const [error, setError] = useState<string | undefined>();

  const queryRef = useRef<string>('');
  const nextCursorRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const run = useCallback(async (query: string, pos: string | undefined, append: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');

    try {
      const page = query
        ? await searchGifs(query, pos, controller.signal)
        : await fetchTrendingGifs(pos, controller.signal);
      if (controller.signal.aborted) return;

      nextCursorRef.current = page.next;
      setGifs((prev) => (append ? [...prev, ...page.gifs] : page.gifs));
      setStatus('success');
      setError(undefined);
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load GIFs');
    }
  }, []);

  // Load trending GIFs on mount.
  useEffect(() => {
    run('', undefined, false);
    return () => abortRef.current?.abort();
  }, [run]);

  const search = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed === queryRef.current) return;
      queryRef.current = trimmed;
      nextCursorRef.current = undefined;
      run(trimmed, undefined, false);
    },
    [run]
  );

  const resetSearch = useCallback(() => {
    if (queryRef.current === '') return;
    queryRef.current = '';
    nextCursorRef.current = undefined;
    run('', undefined, false);
  }, [run]);

  const loadMore = useCallback(() => {
    if (status === 'loading') return;
    const cursor = nextCursorRef.current;
    if (!cursor) return;
    // Stale append results are discarded automatically: any new search or
    // reset aborts the in-flight request via the abort controller in `run`.
    run(queryRef.current, cursor, true);
  }, [status, run]);

  return {
    gifs,
    status,
    error,
    hasMore: nextCursorRef.current !== undefined,
    loadMore,
    search,
    resetSearch,
  };
};
