import React, { ChangeEventHandler, useCallback, useRef } from 'react';
import { Box, Icon, Icons, Input, Scroll, Spinner, Text, config } from 'folds';
import { useDebounce } from '../../hooks/useDebounce';
import {
  getIntersectionObserverEntry,
  useIntersectionObserver,
} from '../../hooks/useIntersectionObserver';
import { useKlipyGifs } from '../../hooks/useKlipyGifs';
import { getGifPreview, KlipyGif } from '../../utils/klipy';
import { mobileOrTablet } from '../../utils/user-agent';
import * as css from './components/styles.css';
import { preventScrollWithArrowKey } from '../../utils/keyboard';

type GifPickerProps = {
  onGifSelect?: (gif: KlipyGif) => void;
  requestClose: () => void;
};

function GifTile({ gif, onClick }: { gif: KlipyGif; onClick: (gif: KlipyGif) => void }) {
  const preview = getGifPreview(gif);
  if (!preview) return null;

  const { dims } = preview;
  const aspect = dims && dims[0] ? `${dims[1]} / ${dims[0]}` : undefined;

  return (
    <Box
      as="button"
      type="button"
      className={css.GifTile}
      title={gif.title}
      aria-label={gif.title || 'GIF'}
      onClick={() => onClick(gif)}
    >
      <img
        className={css.GifTileImg}
        loading="lazy"
        alt={gif.title}
        src={preview.url}
        style={aspect ? { aspectRatio: aspect } : undefined}
      />
    </Box>
  );
}

function GifStatus({ children }: { children: React.ReactNode }) {
  return (
    <Box
      className={css.GifStatus}
      direction="Column"
      alignItems="Center"
      justifyContent="Center"
      gap="200"
    >
      {children}
    </Box>
  );
}

export function GifPicker({ onGifSelect, requestClose }: GifPickerProps) {
  const { gifs, status, error, hasMore, loadMore, search, resetSearch } = useKlipyGifs();

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const runSearch = useDebounce(
    useCallback(
      (term: string) => {
        if (term.trim()) search(term);
        else resetSearch();
      },
      [search, resetSearch]
    ),
    { wait: 350 }
  );

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      runSearch(evt.target.value);
    },
    [runSearch]
  );

  const handleGifClick = useCallback(
    (gif: KlipyGif) => {
      onGifSelect?.(gif);
      requestClose();
    },
    [onGifSelect, requestClose]
  );

  // Infinite scroll: when the sentinel at the bottom of the grid scrolls into
  // view, fetch the next page.
  useIntersectionObserver(
    useCallback(
      (entries) => {
        if (!sentinelRef.current) return;
        const entry = getIntersectionObserverEntry(sentinelRef.current, entries);
        if (entry?.isIntersecting && hasMore && status !== 'loading') loadMore();
      },
      [hasMore, status, loadMore]
    ),
    useCallback(() => ({ root: scrollRef.current, rootMargin: '300px' }), []),
    useCallback(() => sentinelRef.current, [])
  );

  const showInitialLoading = status === 'loading' && gifs.length === 0;
  const showError = status === 'error' && gifs.length === 0;
  const showEmpty = status === 'success' && gifs.length === 0;
  const loadingMore = status === 'loading' && gifs.length > 0;

  return (
    <Box className={css.GifPicker} direction="Column" grow="Yes">
      <Box className={css.GifSearch} shrink="No">
        <Input
          variant="SurfaceVariant"
          size="400"
          placeholder="Search GIFs"
          maxLength={50}
          after={<Icon src={Icons.Search} size="50" />}
          onChange={handleSearchChange}
          autoFocus={!mobileOrTablet()}
        />
      </Box>
      <Box className={css.GifScrollWrap} grow="Yes">
        <Scroll
          ref={scrollRef}
          size="400"
          hideTrack
          direction="Vertical"
          onKeyDown={preventScrollWithArrowKey}
        >
          {showInitialLoading && (
            <GifStatus>
              <Spinner variant="Secondary" size="600" />
            </GifStatus>
          )}
          {showError && (
            <GifStatus>
              <Icon src={Icons.Warning} size="600" />
              <Text align="Center" size="T300">
                {error ?? 'Failed to load GIFs'}
              </Text>
            </GifStatus>
          )}
          {showEmpty && (
            <GifStatus>
              <Icon src={Icons.Search} size="600" />
              <Text align="Center" size="T300">
                No GIFs found
              </Text>
            </GifStatus>
          )}
          {gifs.length > 0 && (
            <div className={css.GifGrid}>
              {gifs.map((gif) => (
                <GifTile key={gif.id} gif={gif} onClick={handleGifClick} />
              ))}
            </div>
          )}
          {loadingMore && (
            <Box
              direction="Column"
              alignItems="Center"
              justifyContent="Center"
              style={{ padding: config.space.S300 }}
            >
              <Spinner variant="Secondary" size="400" />
            </Box>
          )}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </Scroll>
      </Box>
    </Box>
  );
}
