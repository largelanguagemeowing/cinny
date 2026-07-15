import React, { MouseEventHandler, useEffect, useState } from 'react';
import { Avatar, Box, Button, config, Icon, Icons, ProgressBar, Text } from 'folds';
import { RichPresence, RichPresenceProgress } from '../../../types/matrix/richPresence';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { mxcUrlToHttp } from '../../utils/matrix';
import { SequenceCard } from '../sequence-card';
import * as css from './styles.css';

const formatDuration = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
};

const getCompletedSeconds = (progress: RichPresenceProgress, now: number): number => {
  if (progress.complete !== undefined) return Math.min(progress.complete, progress.length);
  if (progress.timeComplete === undefined) return 0;

  const completionTs =
    progress.timeComplete > 1_000_000_000_000
      ? progress.timeComplete / 1000
      : progress.timeComplete;
  if (completionTs < 1_000_000_000) return Math.min(completionTs, progress.length);

  return Math.min(Math.max(progress.length - (completionTs - now / 1000), 0), progress.length);
};

type MediaProgressProps = {
  progress: RichPresenceProgress;
};
function MediaProgress({ progress }: MediaProgressProps) {
  const [now, setNow] = useState(Date.now());
  const isTimestamp =
    progress.complete === undefined &&
    progress.timeComplete !== undefined &&
    progress.timeComplete >= 1_000_000_000;

  useEffect(() => {
    if (!isTimestamp) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isTimestamp]);

  const completed = getCompletedSeconds(progress, now);

  return (
    <Box direction="Column" gap="100">
      <ProgressBar
        aria-label="Track progress"
        variant="Primary"
        size="300"
        min={0}
        max={progress.length}
        value={completed}
      />
      <Box justifyContent="SpaceBetween" gap="200">
        <Text size="T200" priority="300">
          {formatDuration(completed)}
        </Text>
        <Text size="T200" priority="300">
          {formatDuration(progress.length)}
        </Text>
      </Box>
    </Box>
  );
}

const getExternalUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};

type UserRichPresenceProps = {
  presence: RichPresence;
};
export function UserRichPresence({ presence }: UserRichPresenceProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const imageMxc = presence.type === 'media' ? presence.coverArt : presence.image;
  const imageUrl = imageMxc
    ? mxcUrlToHttp(mx, imageMxc, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;
  const externalUrl = getExternalUrl(
    presence.type === 'media' ? presence.streamingLink : undefined
  );

  const handleExternalLink: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (!externalUrl) return;
    // The MSC requires an explicit warning before opening user-provided links.
    // eslint-disable-next-line no-alert
    const shouldOpen = window.confirm(
      `This link was supplied by another Matrix user and opens an external site:\n\n${externalUrl}\n\nContinue?`
    );
    if (!shouldOpen) event.preventDefault();
  };

  return (
    <SequenceCard
      variant="SurfaceVariant"
      direction="Column"
      gap="300"
      style={{ padding: config.space.S300 }}
    >
      <Box gap="300" alignItems="Center">
        <Avatar size="400" radii="300">
          {imageUrl ? (
            <img className={css.RichPresenceImage} src={imageUrl} alt="" draggable="false" />
          ) : (
            <Icon src={Icons.Play} size="200" filled />
          )}
        </Avatar>
        <Box direction="Column" gap="0" grow="Yes">
          <Text size="T200" priority="300">
            {presence.type === 'media' ? 'Listening to' : 'Active now'}
          </Text>
          <Text
            size="L400"
            truncate
            title={presence.type === 'media' ? presence.track : presence.name}
          >
            {presence.type === 'media' ? presence.track : presence.name}
          </Text>
          {presence.type === 'media' ? (
            <Text
              size="T200"
              priority="300"
              truncate
              title={`${presence.artist} - ${presence.album}`}
            >
              {presence.artist} - {presence.album}
            </Text>
          ) : (
            presence.details && (
              <Text size="T200" priority="300">
                {presence.details}
              </Text>
            )
          )}
        </Box>
      </Box>
      {presence.type === 'media' && presence.progress && (
        <MediaProgress progress={presence.progress} />
      )}
      {presence.type === 'media' && (presence.player || externalUrl) && (
        <Box gap="200" alignItems="Center" justifyContent="SpaceBetween">
          <Text size="T200" priority="300" truncate>
            {presence.player}
          </Text>
          {externalUrl && (
            <Button
              as="a"
              href={externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={handleExternalLink}
              size="300"
              variant="Secondary"
              fill="Soft"
              radii="300"
              before={<Icon src={Icons.External} size="50" />}
            >
              <Text size="B300">Open Track</Text>
            </Button>
          )}
        </Box>
      )}
    </SequenceCard>
  );
}
