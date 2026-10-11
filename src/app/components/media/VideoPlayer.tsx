import React, { VideoHTMLAttributes, useCallback, useEffect, useRef } from 'react';
import { Video } from './Video';
import { useHoverPlay } from '../../hooks/useHoverPlay';

export type VideoPlayerProps = Pick<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'title' | 'onLoadedMetadata' | 'onError'
> & {
  playback: 'video' | 'gif';
};

export function VideoPlayer({ playback, src, title, onLoadedMetadata, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { lowAnimationMode, hovered, hoverProps } = useHoverPlay();
  const gifLike = playback === 'gif';

  const syncPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!lowAnimationMode || hovered) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [lowAnimationMode, hovered]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback, src]);

  return (
    <Video
      ref={videoRef}
      src={src}
      title={title}
      controls={!gifLike}
      loop={gifLike}
      muted={gifLike}
      playsInline={gifLike}
      autoPlay={!lowAnimationMode}
      preload="auto"
      tabIndex={gifLike ? 0 : undefined}
      {...hoverProps}
      onLoadedMetadata={(event) => {
        syncPlayback();
        onLoadedMetadata?.(event);
      }}
      onError={onError}
    />
  );
}
