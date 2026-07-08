import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Icon, Icons, Spinner, Text, Tooltip, TooltipProvider, toRem } from 'folds';
import { Attachment, AttachmentBox } from '../attachment';
import { Video } from '../../media';
import { useHoverPlay } from '../../../hooks/useHoverPlay';
import * as css from './style.css';
import { fitWithin } from '../../../utils/common';

export type OoyeGifContentProps = {
  title: string;
  videoUrl: string;
  autoPlay?: boolean;
};

// Match the inline GIF layout: fit within a 400x350 box, preserving aspect
// ratio, with no file-header chrome so it renders like a regular GIF.
const GIF_MAX_W = 400;
const GIF_MAX_H = 350;
const DEFAULT_W = GIF_MAX_W;
const DEFAULT_H = 300;

export function OoyeGifContent({ title, videoUrl, autoPlay: autoPlayProp }: OoyeGifContentProps) {
  const { lowAnimationMode, hovered, hoverProps } = useHoverPlay();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [showVideo, setShowVideo] = useState(autoPlayProp ?? false);

  // Play / pause based on hover in low animation mode
  useEffect(() => {
    if (!lowAnimationMode || !videoRef.current) return;
    if (hovered) {
      videoRef.current.play().catch(() => undefined);
    } else {
      videoRef.current.pause();
    }
  }, [lowAnimationMode, hovered, showVideo, loaded]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const { videoWidth, videoHeight } = video;
    if (videoWidth && videoHeight) {
      const [w, h] = fitWithin(videoWidth, videoHeight, GIF_MAX_W, GIF_MAX_H);
      setWidth(Math.max(w, 48));
      setHeight(Math.max(h, 48));
    }
    setLoaded(true);
  };

  const handleError = () => {
    setLoaded(false);
    setError(true);
  };

  const handleRetry = () => {
    setError(false);
    setLoaded(false);
    setShowVideo(true);
  };

  return (
    <Attachment style={{ width: toRem(width) }}>
      <AttachmentBox style={{ width: toRem(width), height: toRem(height) }}>
        <Box className={css.RelativeBase} {...hoverProps}>
          {showVideo && !error && (
            <Box className={css.AbsoluteContainer}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <Video
                ref={videoRef}
                src={videoUrl}
                autoPlay={!lowAnimationMode}
                loop
                muted
                controls
                playsInline
                preload="auto"
                title={title}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleError}
              />
            </Box>
          )}
          {showVideo && !loaded && !error && (
            <Box className={css.AbsoluteContainer} alignItems="Center" justifyContent="Center">
              <Spinner variant="Secondary" />
            </Box>
          )}
          {error && (
            <Box className={css.AbsoluteContainer} alignItems="Center" justifyContent="Center">
              <TooltipProvider
                tooltip={
                  <Tooltip variant="Critical">
                    <Text>Failed to load GIF!</Text>
                  </Tooltip>
                }
                position="Top"
                align="Center"
              >
                {(triggerRef) => (
                  <Button
                    ref={triggerRef}
                    size="300"
                    variant="Critical"
                    fill="Soft"
                    outlined
                    radii="300"
                    onClick={handleRetry}
                    before={<Icon size="Inherit" src={Icons.Warning} filled />}
                  >
                    <Text size="B300">Retry</Text>
                  </Button>
                )}
              </TooltipProvider>
            </Box>
          )}
          {!showVideo && !error && (
            <Box className={css.AbsoluteContainer} alignItems="Center" justifyContent="Center">
              <Button
                variant="Secondary"
                fill="Solid"
                radii="300"
                size="300"
                onClick={() => setShowVideo(true)}
                before={<Icon size="Inherit" src={Icons.Play} filled />}
              >
                <Text size="B300">Watch</Text>
              </Button>
            </Box>
          )}
        </Box>
      </AttachmentBox>
    </Attachment>
  );
}
