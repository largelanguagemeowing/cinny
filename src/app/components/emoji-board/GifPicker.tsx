import React, { ChangeEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Box, Icon, Icons, Input, Scroll, Spinner, Text, config } from 'folds';
import classNames from 'classnames';
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
import {
  gifFavoritesAtom,
  toggleGifFavoriteAtom,
} from '../../state/gifFavorites';

type GifPickerProps = {
  onGifSelect?: (gif: KlipyGif) => void;
  requestClose: () => void;
};

type Category = 'favourites' | 'cat' | 'trending';

type GifTileProps = {
  gif: KlipyGif;
  onClick: (gif: KlipyGif) => void;
  isFavorited: boolean;
  onToggleFavorite: (gif: KlipyGif) => void;
};

function GifTile({ gif, onClick, isFavorited, onToggleFavorite }: GifTileProps) {
  const preview = getGifPreview(gif);
  const [hovered, setHovered] = useState(false);
  if (!preview) return null;

  const { dims } = preview;
  const aspect = dims?.[0] && dims?.[1] ? `${dims[0]} / ${dims[1]}` : undefined;

  return (
    <Box
      as="div"
      className={css.GifTile}
      title={gif.title}
      aria-label={gif.title || 'GIF'}
      onClick={() => onClick(gif)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className={classNames(
          css.GifFavBtn,
          (isFavorited || hovered) && css.GifFavBtnVisible,
          isFavorited && css.GifFavBtnActive
        )}
        aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
        aria-pressed={isFavorited}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(gif);
        }}
      >
        <Icon
          src={Icons.Star}
          size="200"
          filled={isFavorited}
        />
      </button>
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

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'favourites', label: 'Favourites' },
  { id: 'cat', label: 'Cat' },
  { id: 'trending', label: 'Trending' },
];

export function GifPicker({ onGifSelect, requestClose }: GifPickerProps) {
  const { gifs, status, error, hasMore, loadMore, search, resetSearch } = useKlipyGifs();
  const favorites = useAtomValue(gifFavoritesAtom);
  const toggleFavorite = useSetAtom(toggleGifFavoriteAtom);

  const [category, setCategory] = useState<Category>('trending');
  const [searchTerm, setSearchTerm] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

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
      const { value } = evt.target;
      setSearchTerm(value);
      runSearch(value);
    },
    [runSearch]
  );

  const handleCategoryChange = useCallback(
    (cat: Category) => {
      setCategory(cat);
      setSearchTerm('');
      if (cat === 'trending') {
        resetSearch();
      } else if (cat === 'cat') {
        search('cat');
      }
      // favourites: no search needed, uses local favorites
    },
    [search, resetSearch]
  );

  const handleGifClick = useCallback(
    (gif: KlipyGif) => {
      onGifSelect?.(gif);
      requestClose();
    },
    [onGifSelect, requestClose]
  );

  const handleToggleFavorite = useCallback(
    (gif: KlipyGif) => {
      toggleFavorite(gif);
    },
    [toggleFavorite]
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

  const isFavouritesTab = category === 'favourites';
  const favoriteGifs = useMemo(
    () => favorites.map((f) => f.gif),
    [favorites]
  );

  const showInitialLoading = !isFavouritesTab && status === 'loading' && gifs.length === 0;
  const showError = !isFavouritesTab && status === 'error' && gifs.length === 0;
  const showEmpty =
    (isFavouritesTab && favoriteGifs.length === 0) ||
    (!isFavouritesTab && status === 'success' && gifs.length === 0);
  const loadingMore = status === 'loading' && gifs.length > 0;

  const displayGifs = isFavouritesTab ? favoriteGifs : gifs;

  return (
    <Box className={css.GifPicker} direction="Column" grow="Yes">
      <Box className={css.GifSearch} direction="Column" shrink="No">
        <Input
          variant="SurfaceVariant"
          size="400"
          placeholder={isFavouritesTab ? 'Search favourites' : 'Search GIFs'}
          maxLength={50}
          after={<Icon src={Icons.Search} size="50" />}
          onChange={handleSearchChange}
          autoFocus={!mobileOrTablet()}
          value={searchTerm}
          disabled={isFavouritesTab}
        />
      </Box>
      <Box className={css.GifCategories} shrink="No">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={classNames(
              css.GifCategoryTab,
              category === cat.id && css.GifCategoryTabActive
            )}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {cat.id === 'favourites' && <Icon src={Icons.Star} size="100" filled={category === cat.id} />}
            <span>{cat.label}</span>
          </button>
        ))}
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
              {isFavouritesTab ? (
                <>
                  <Icon src={Icons.Star} size="600" />
                  <Text align="Center" size="T300">
                    No favourite GIFs yet. Tap the star on any GIF to save it here.
                  </Text>
                </>
              ) : (
                <>
                  <Icon src={Icons.Search} size="600" />
                  <Text align="Center" size="T300">
                    No GIFs found
                  </Text>
                </>
              )}
            </GifStatus>
          )}
          {displayGifs.length > 0 && (
            <div className={css.GifGrid}>
              {displayGifs.map((gif) => (
                <GifTile
                  key={gif.id}
                  gif={gif}
                  onClick={handleGifClick}
                  isFavorited={favoriteIds.has(gif.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
          {!isFavouritesTab && loadingMore && (
            <Box
              direction="Column"
              alignItems="Center"
              justifyContent="Center"
              style={{ padding: config.space.S300 }}
            >
              <Spinner variant="Secondary" size="400" />
            </Box>
          )}
          {!isFavouritesTab && <div ref={sentinelRef} style={{ height: 1 }} />}
        </Scroll>
      </Box>
    </Box>
  );
}
