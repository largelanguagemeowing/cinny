import { useCallback } from 'react';
import { useAtomCallback } from 'jotai/utils';
import { isKeyHotkey } from 'is-hotkey';
import { useKeyDown } from './useKeyDown';
import { useGlobalRoomOrder } from './useGlobalRoomOrder';
import { useRoomNavigate } from './useRoomNavigate';
import { useRouteSelectedRoom } from './router/useSelectedRoom';
import { roomToUnreadAtom } from '../state/room/roomToUnread';

type Direction = -1 | 1;

/**
 * Walks the ordered list from `fromIndex` in `direction`, wrapping around, and
 * returns the first accepted room. `fromIndex` of -1 with direction 1 starts at
 * the head; 0 with direction -1 starts at the tail.
 */
const findRoom = (
  order: string[],
  fromIndex: number,
  direction: Direction,
  accept: (roomId: string) => boolean
): string | undefined => {
  const { length } = order;
  for (let step = 1; step <= length; step += 1) {
    const index = (((fromIndex + direction * step) % length) + length) % length;
    const roomId = order[index];
    if (accept(roomId)) return roomId;
  }
  return undefined;
};

/**
 * Global room navigation:
 * - alt+up/down moves to the previous/next room across all rooms and spaces
 * - alt+shift+up/down does the same but only stops on rooms with unread messages
 */
export const useRoomNavShortcuts = () => {
  const getRoomOrder = useGlobalRoomOrder();
  // read on demand; subscribing would re-render on every unread change
  const getRoomToUnread = useAtomCallback(useCallback((get) => get(roomToUnreadAtom), []));
  const selectedRoomId = useRouteSelectedRoom();
  const { navigateRoom } = useRoomNavigate();

  useKeyDown(
    window,
    useCallback(
      (evt: KeyboardEvent) => {
        const up = isKeyHotkey(['alt+arrowup', 'alt+shift+arrowup'], evt);
        const down = isKeyHotkey(['alt+arrowdown', 'alt+shift+arrowdown'], evt);
        if (!up && !down) return;

        evt.preventDefault();

        const order = getRoomOrder();
        if (order.length === 0) return;

        const unreadOnly = evt.shiftKey;
        const direction: Direction = up ? -1 : 1;
        const selectedIndex = selectedRoomId ? order.indexOf(selectedRoomId) : -1;
        // with no room open, start just outside the list so the first step
        // lands on the head going down and on the tail going up
        const outsideIndex = direction === 1 ? -1 : 0;
        const fromIndex = selectedIndex >= 0 ? selectedIndex : outsideIndex;

        const roomToUnread = unreadOnly ? getRoomToUnread() : undefined;
        const nextRoomId = findRoom(order, fromIndex, direction, (roomId) =>
          roomToUnread ? roomToUnread.has(roomId) : true
        );
        if (nextRoomId) navigateRoom(nextRoomId);
      },
      [getRoomOrder, getRoomToUnread, selectedRoomId, navigateRoom]
    )
  );
};
