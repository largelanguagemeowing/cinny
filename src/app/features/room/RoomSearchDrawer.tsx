import React, { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  MenuItem,
  Scroll,
  Spinner,
  Text,
  Tooltip,
  TooltipProvider,
  config,
} from 'folds';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { IEventWithRoomId, RelationType, Room, RoomMember } from 'matrix-js-sdk';
import { useAtomValue } from 'jotai';
import classNames from 'classnames';

import * as css from './RoomSearchDrawer.css';
import { MembersDrawer } from './MembersDrawer';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { LineClamp2 } from '../../styles/Text.css';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useSpaceOptionally } from '../../hooks/useSpace';
import { useRoomNavigate } from '../../hooks/useRoomNavigate';
import { useSetSetting, useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { mDirectAtom } from '../../state/mDirectList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import {
  useDirects,
  useOrphanRooms,
  useRecursiveChildRoomScopeFactory,
  useSpaceChildren,
} from '../../state/hooks/roomList';
import { useMessageSearch } from '../message-search/useMessageSearch';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { UserAvatar } from '../../components/user-avatar';
import { VirtualTile } from '../../components/virtualizer';
import { ScrollTopContainer } from '../../components/scroll-top-container';
import { Time } from '../../components/message';

const getMessageBody = (event: IEventWithRoomId): string => {
  if (event.unsigned?.redacted_because) return 'Message deleted';
  const content = (event.content['m.new_content'] ?? event.content) as Record<string, unknown>;
  const msgtype = content.msgtype as string | undefined;
  const body = typeof content.body === 'string' ? content.body : '';
  switch (msgtype) {
    case 'm.image':
      return body || 'Photo';
    case 'm.video':
      return body || 'Video';
    case 'm.audio':
      return body || 'Audio';
    case 'm.file':
      return body || 'File';
    case 'm.sticker':
      return body || 'Sticker';
    default:
      return body || 'Message';
  }
};

type ResultItemProps = {
  roomId: string;
  event: IEventWithRoomId;
  onOpen: (roomId: string, eventId: string) => void;
  hour24Clock: boolean;
  dateFormatString: string;
};
function ResultItem({ roomId, event, onOpen, hour24Clock, dateFormatString }: ResultItemProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const room = mx.getRoom(roomId);

  const relation = event.content['m.relates_to'] as
    | { rel_type?: string; event_id?: string }
    | undefined;
  const mainEventId =
    relation?.rel_type === RelationType.Replace
      ? relation?.event_id ?? event.event_id
      : event.event_id;

  if (!room) return null;

  const senderName =
    getMemberDisplayName(room, event.sender) ??
    getMxIdLocalPart(event.sender) ??
    event.sender;
  const senderAvatarMxc = getMemberAvatarMxc(room, event.sender);
  const senderAvatarUrl = senderAvatarMxc
    ? mxcUrlToHttp(mx, senderAvatarMxc, useAuthentication, 48, 48, 'crop') ?? undefined
    : undefined;
  const body = getMessageBody(event);

  return (
    <MenuItem
      style={{ padding: `${config.space.S200} ${config.space.S300}` }}
      variant="Background"
      radii="300"
      onClick={() => onOpen(roomId, mainEventId ?? event.event_id)}
      before={
        <Avatar size="200">
          <UserAvatar
            userId={event.sender}
            src={senderAvatarUrl}
            alt={senderName}
            renderFallback={() => <Icon size="50" src={Icons.User} filled />}
          />
        </Avatar>
      }
    >
      <Box direction="Column" gap="100" grow="Yes">
        <Box alignItems="Baseline" gap="200">
          <Text size="T200" truncate>
            {senderName}
          </Text>
          <Text size="T200" priority="400" truncate>
            {room.name}
          </Text>
          <Time compact ts={event.origin_server_ts} hour24Clock={hour24Clock} dateFormatString={dateFormatString} />
        </Box>
        <Text size="T200" priority="300" className={LineClamp2}>
          {body}
        </Text>
      </Box>
    </MenuItem>
  );
}

type SearchResultsProps = {
  term: string;
  rooms: string[];
  onOpen: (roomId: string, eventId: string) => void;
};
function SearchResults({ term, rooms, onOpen }: SearchResultsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTopAnchorRef = useRef<HTMLDivElement>(null);
  const [hour24Clock] = useSetting(settingsAtom, 'hour24Clock');
  const [dateFormatString] = useSetting(settingsAtom, 'dateFormatString');

  const msgSearchParams = useMemo(() => ({ term, rooms }), [term, rooms]);
  const searchMessages = useMessageSearch(msgSearchParams);

  const { status, data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    enabled: !!term,
    queryKey: ['room-sidebar-search', term, rooms],
    queryFn: ({ pageParam }) => searchMessages(pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextToken,
  });

  const flatItems = useMemo(() => {
    const groups = data?.pages.flatMap((result) => result.groups) ?? [];
    return groups.flatMap((group) =>
      group.items.map((item) => ({ roomId: group.roomId, item }))
    );
  }, [data]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 76,
    overscan: 4,
  });

  const vItems = virtualizer.getVirtualItems();
  const lastVItem = vItems[vItems.length - 1];
  const lastVItemIndex = lastVItem?.index;
  const lastItemIndex = flatItems.length - 1;
  useEffect(() => {
    if (lastItemIndex > -1 && lastVItemIndex === lastItemIndex && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [lastVItemIndex, lastItemIndex, fetchNextPage, isFetchingNextPage, hasNextPage]);

  return (
    <Box className={css.RoomSearchContentBase} grow="Yes">
      <Scroll ref={scrollRef} variant="Background" size="300" visibility="Hover" hideTrack>
        <Box direction="Column" gap="200" style={{ padding: `${config.space.S200} 0` }}>
          <Box ref={scrollTopAnchorRef} />
          <ScrollTopContainer scrollRef={scrollRef} anchorRef={scrollTopAnchorRef}>
            <IconButton
              onClick={() => virtualizer.scrollToOffset(0)}
              variant="Surface"
              radii="Pill"
              outlined
              size="300"
              aria-label="Scroll to Top"
            >
              <Icon src={Icons.ChevronTop} size="300" />
            </IconButton>
          </ScrollTopContainer>

          {status === 'pending' && (
            <Box justifyContent="Center">
              <Spinner />
            </Box>
          )}

          {status === 'success' && flatItems.length === 0 && (
            <Text style={{ padding: config.space.S300 }} align="Center" priority="300">
              {`No results found for "${term}"`}
            </Text>
          )}

          <Box direction="Column" gap="100">
            <div
              style={{
                position: 'relative',
                height: virtualizer.getTotalSize(),
              }}
            >
              {vItems.map((vItem) => {
                const { roomId, item } = flatItems[vItem.index];
                return (
                  <VirtualTile
                    virtualItem={vItem}
                    key={`${roomId}-${item.event.event_id}`}
                    ref={virtualizer.measureElement}
                  >
                    <ResultItem
                      roomId={roomId}
                      event={item.event}
                      onOpen={onOpen}
                      hour24Clock={hour24Clock}
                      dateFormatString={dateFormatString}
                    />
                  </VirtualTile>
                );
              })}
            </div>
          </Box>

          {isFetchingNextPage && (
            <Box justifyContent="Center">
              <Spinner />
            </Box>
          )}

          {error && (
            <Text style={{ padding: config.space.S300 }} align="Center" priority="300">
              {error.message}
            </Text>
          )}
        </Box>
      </Scroll>
    </Box>
  );
}

type RoomSearchDrawerProps = {
  room: Room;
  members: RoomMember[];
};
export function RoomSearchDrawer({ room, members }: RoomSearchDrawerProps) {
  const mx = useMatrixClient();
  const space = useSpaceOptionally();
  const { navigateRoom } = useRoomNavigate();
  const setPeopleDrawer = useSetSetting(settingsAtom, 'isPeopleDrawer');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>();

  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const childRoomScopeFactory = useRecursiveChildRoomScopeFactory(mx, mDirects, roomToParents);
  const spaceChildren = useSpaceChildren(
    allRoomsAtom,
    space?.roomId ?? '',
    childRoomScopeFactory
  );
  const orphanRooms = useOrphanRooms(mx, allRoomsAtom, mDirects, roomToParents);
  const directs = useDirects(mx, allRoomsAtom, mDirects);

  const searchRooms = useMemo(() => {
    if (space) return spaceChildren;
    return [...orphanRooms, ...directs];
  }, [space, spaceChildren, orphanRooms, directs]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const form = evt.target as HTMLFormElement & { searchInput: HTMLInputElement };
    const term = form.searchInput.value.trim();
    if (term) setSearchTerm(term);
  };

  const handleClear = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      searchInputRef.current.focus();
    }
    setSearchTerm(undefined);
  };

  const handleOpen = (roomId: string, eventId: string) => {
    navigateRoom(roomId, eventId);
  };

  return (
    <Box
      className={classNames(css.RoomSearchDrawer, ContainerColor({ variant: 'Background' }))}
      shrink="No"
      direction="Column"
    >
      <Header className={css.RoomSearchDrawerHeader} variant="Background" size="600">
        <Box as="form" onSubmit={handleSubmit} grow="Yes" alignItems="Center" gap="200">
          <Box grow="Yes" direction="Column">
            <Input
              ref={searchInputRef}
              name="searchInput"
              style={{ paddingRight: config.space.S200 }}
              placeholder="Search messages"
              variant="Surface"
              size="400"
              radii="400"
              autoComplete="off"
              before={<Icon size="50" src={Icons.Search} />}
              after={
                searchTerm ? (
                  <Chip
                    variant="Surface"
                    size="400"
                    radii="Pill"
                    outlined
                    aria-pressed
                    type="button"
                    onClick={handleClear}
                    after={<Icon size="50" src={Icons.Cross} />}
                  >
                    <Text size="B300">Clear</Text>
                  </Chip>
                ) : null
              }
            />
          </Box>
          <TooltipProvider
            position="Bottom"
            align="End"
            offset={4}
            tooltip={
              <Tooltip>
                <Text>Close</Text>
              </Tooltip>
            }
          >
            {(triggerRef) => (
              <IconButton
                ref={triggerRef}
                variant="Background"
                type="button"
                onClick={() => setPeopleDrawer(false)}
                aria-label="Close member list"
              >
                <Icon src={Icons.Cross} />
              </IconButton>
            )}
          </TooltipProvider>
        </Box>
      </Header>

      {searchTerm ? (
        <SearchResults term={searchTerm} rooms={searchRooms} onOpen={handleOpen} />
      ) : (
        <Box grow="Yes">
          <MembersDrawer room={room} members={members} hideHeader />
        </Box>
      )}
    </Box>
  );
}
