import React, { ReactNode, useMemo } from 'react';
import { Box, Icon, IconSrc, Icons, Text, config } from 'folds';
import { MatrixError } from 'matrix-js-sdk';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useServerSoftware } from '../../hooks/useServerSoftware';
import { useRankOrderTruncated } from './useMessageSearch';

type NoticeVariant = 'Warning' | 'Critical' | 'SurfaceVariant';

type SearchNoticeProps = {
  variant?: NoticeVariant;
  icon?: IconSrc;
  children: ReactNode;
};
export function SearchNotice({
  variant = 'Warning',
  icon = Icons.Info,
  children,
}: SearchNoticeProps) {
  return (
    <Box
      className={ContainerColor({ variant })}
      style={{ padding: config.space.S300, borderRadius: config.radii.R400 }}
      alignItems="Start"
      gap="200"
      shrink="No"
    >
      <Icon style={{ flexShrink: 0 }} size="200" src={icon} />
      <Box direction="Column" gap="100">
        {children}
      </Box>
    </Box>
  );
}

/**
 * Server-side search reads the `event_search` index, which is only populated from
 * plaintext `content.body`. Encrypted rooms are therefore never matched, and the
 * server answers with an empty result set rather than an error.
 */
export const useEncryptedRooms = (roomIds: string[] | undefined): string[] => {
  const mx = useMatrixClient();

  return useMemo(
    () => (roomIds ?? []).filter((roomId) => mx.getRoom(roomId)?.hasEncryptionStateEvent()),
    [mx, roomIds]
  );
};

type EncryptionNoticeProps = {
  /** rooms actually included in the query; `undefined` means every joined room */
  searchedRooms: string[] | undefined;
  /** render the full explanation instead of the one-line hint */
  detailed?: boolean;
};
export function EncryptionNotice({ searchedRooms, detailed }: EncryptionNoticeProps) {
  const encryptedRooms = useEncryptedRooms(searchedRooms);
  if (encryptedRooms.length === 0) return null;

  const total = searchedRooms?.length ?? 0;
  const all = total > 0 && encryptedRooms.length === total;

  return (
    <SearchNotice icon={Icons.Lock}>
      <Text size="T300">
        {all
          ? 'This search covers only encrypted rooms, so it can never return results.'
          : `${encryptedRooms.length} of ${total} rooms are encrypted and were skipped.`}
      </Text>
      {detailed && (
        <Text size="T200" priority="300">
          Your homeserver searches a plaintext index of message bodies. It cannot read encrypted
          messages, so they are absent from that index entirely.
        </Text>
      )}
    </SearchNotice>
  );
}

type RankOrderNoticeProps = {
  /** the query has demonstrably run out of pages */
  exhausted: boolean;
};
/**
 * Warn up front on servers known to truncate relevance ordering; elsewhere stay
 * quiet until the query has actually run dry, so we never assert a limit the
 * server may not have.
 */
export function RankOrderNotice({ exhausted }: RankOrderNoticeProps) {
  const { name } = useServerSoftware();
  const truncated = useRankOrderTruncated();

  if (!truncated && !exhausted) return null;

  return (
    <SearchNotice variant="SurfaceVariant">
      <Text size="T300">
        {truncated
          ? `${
              name ?? 'Your homeserver'
            } returns a limited set of results when sorting by relevance.`
          : 'Your homeserver returned every relevance-ranked result it will provide.'}
      </Text>
      <Text size="T200" priority="300">
        Sort by Recent to page through all matches.
      </Text>
    </SearchNotice>
  );
}

const describeSearchError = (error: Error): string => {
  if (error instanceof MatrixError) {
    if (error.errcode === 'M_UNRECOGNIZED') {
      return 'This homeserver does not implement message search.';
    }
    if (error.errcode === 'M_LIMIT_EXCEEDED') {
      return 'Too many searches in a short time. Wait a moment and try again.';
    }
    const message = error.data?.error;
    if (typeof message === 'string' && message.toLowerCase().includes('search is disabled')) {
      return 'Message search is disabled on this homeserver.';
    }
    if (typeof message === 'string') return message;
  }
  return error.message;
};

type SearchErrorNoticeProps = {
  error: Error;
};
export function SearchErrorNotice({ error }: SearchErrorNoticeProps) {
  return (
    <SearchNotice variant="Critical" icon={Icons.Warning}>
      <Text size="T300">{describeSearchError(error)}</Text>
    </SearchNotice>
  );
}
