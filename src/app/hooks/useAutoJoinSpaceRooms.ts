import { useEffect, useRef } from 'react';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { SpaceHierarchy } from './useSpaceHierarchy';
import { Membership } from '../../types/matrix/room';
import { rateLimitedActions } from '../utils/matrix';

type RoomToJoin = {
  roomId: string;
  via: string[];
};

/**
 * When `enabled`, joins every unjoined child room listed in the supplied space
 * hierarchy. Runs reactively: new children added to the space are picked up on
 * the next hierarchy update and joined automatically.
 *
 * Already-attempted rooms are tracked for the lifetime of the component so we
 * don't hammer the homeserver with duplicate join requests. Rooms that fail to
 * join (e.g. invite-only) stay attempted and can still be joined manually from
 * the lobby.
 */
export const useAutoJoinSpaceRooms = (
  hierarchy: SpaceHierarchy[],
  getRoom: (roomId: string) => Room | undefined,
  enabled: boolean
) => {
  const mx = useMatrixClient();
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const roomsToJoin: RoomToJoin[] = [];
    hierarchy.forEach((level) => {
      level.rooms?.forEach((roomItem) => {
        const room = getRoom(roomItem.roomId);
        const joined = room?.getMyMembership() === Membership.Join;
        if (joined) return;
        if (attemptedRef.current.has(roomItem.roomId)) return;
        roomsToJoin.push({ roomId: roomItem.roomId, via: roomItem.content.via });
        attemptedRef.current.add(roomItem.roomId);
      });
    });

    if (roomsToJoin.length === 0) return;

    rateLimitedActions(roomsToJoin, async (item) => {
      try {
        await mx.joinRoom(item.roomId, { viaServers: item.via });
      } catch {
        // Swallowed: rateLimitedActions only retries on 429.
        // The room stays in attemptedRef so we don't retry it automatically.
        // Users can still join manually via the lobby Join button.
      }
    });
  }, [mx, hierarchy, getRoom, enabled]);
};
