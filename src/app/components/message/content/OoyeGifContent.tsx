import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Spinner,
  Text,
  Tooltip,
  TooltipProvider,
  toRem,
} from 'folds';
import { Attachment, AttachmentBox, AttachmentHeader } from '../attachment';
import { FileHeader } from '../FileHeader';
import { Video } from '../../media';
import { useMediaHoverAutoPlay } from '../../../hooks/useMediaHoverAutoPlay';
import * as css from './style.css';
import { scaleYDimension } from '../../../utils/common';

export type OoyeGifContentProps = {
  title: string;
  videoUrl: string;
  pageUrl?: string;
  autoPlay?: boolean;
};

const DEFAULT_HEIGHT = 300;
const MAX_HEIGHT = 600;
const SCALED_WIDTH = 400;

export function OoyeGifContent({ title, videoUrl, pageUrl, autoPlay: autoPlayProp }: OoyeGifContentProps) {
  const { autoPlay, hoverProps } = useMediaHoverAutoPlay(autoPlayProp ?? false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [showVideo, setShowVideo] = useState(autoPlay);

  useEffect(() => {
    if (autoPlay) setShowVideo(true);
  }, [autoPlay]);

  const linkUrl = pageUrl ?? videoUrl;

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const { videoWidth, videoHeight } = video;
    if (videoWidth && videoHeight) {
      const scaled = scaleYDimension(videoWidth, SCALED_WIDTH, videoHeight);
      setHeight(Math.min(Math.max(scaled, 48), MAX_HEIGHT));
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
    <Attachment>
      <AttachmentHeader>
        <FileHeader
          body={title}
          mimeType="video/mp4"
          after={
            <IconButton
              as="a"
              href={linkUrl}
              target="_blank"
              rel="noreferrer noopener"
              size="300"
              radii="300"
              variant="SurfaceVariant"
            >
              <Icon size="100" src={Icons.External} />
            </IconButton>
          }
        />
      </AttachmentHeader>
      <AttachmentBox style={{ height: toRem(height) }}>
        <Box className={css.RelativeBase} {...hoverProps}>
          {showVideo && !error && (
            <Box className={css.AbsoluteContainer}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <Video
                src={videoUrl}
                autoPlay
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
