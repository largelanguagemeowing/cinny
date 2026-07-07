import { useState } from 'react';
import { useLowAnimationMode } from './useLowAnimationMode';

export type MediaHoverAutoPlay = {
  autoPlay: boolean;
  hoverProps: {
    onMouseEnter?: () => void;
    onFocus?: () => void;
  };
};

/**
 * Resolves the effective autoPlay value for media content.
 *
 * When low animation mode is off, media autoplays based on the passed
 * `autoPlay` flag (i.e. the user's media auto-load preference).
 *
 * When low animation mode is on, media only autoplays while the element is
 * hovered or focused. The returned `hoverProps` should be spread onto the
 * media container element so the hook can track interaction.
 */
export function useMediaHoverAutoPlay(autoPlay: boolean): MediaHoverAutoPlay {
  const lowAnimationMode = useLowAnimationMode();
  const [hovered, setHovered] = useState(false);

  if (!lowAnimationMode) {
    return { autoPlay, hoverProps: {} };
  }

  return {
    autoPlay: autoPlay && hovered,
    hoverProps: {
      onMouseEnter: () => setHovered(true),
      onFocus: () => setHovered(true),
    },
  };
}
