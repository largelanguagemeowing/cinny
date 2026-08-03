/**
 * Session-only navigation history backing alt+left/alt+right.
 *
 * `back` holds the rooms the user left, most recent last; `forward` holds the
 * rooms the user backtracked away from, most recent last. A fresh room
 * navigation clears `forward`. Back/forward navigation sets a skip flag so the
 * room change it causes is not recorded as a fresh navigation.
 */

type NavHistoryState = {
  back: string[];
  forward: string[];
};

const state: NavHistoryState = {
  back: [],
  forward: [],
};

// Set right before a back/forward navigation so the room change that follows is
// treated as part of that navigation instead of a fresh one.
let skipNextRecord = false;

export const navHistory = {
  /**
   * Records the room the user left. Consumes the skip flag: the room change a
   * back/forward navigation causes must not be recorded as a fresh navigation.
   */
  record: (fromRoomId: string | undefined) => {
    if (skipNextRecord) {
      skipNextRecord = false;
      return;
    }
    if (!fromRoomId) return;
    state.forward.length = 0;
    if (state.back[state.back.length - 1] !== fromRoomId) {
      state.back.push(fromRoomId);
    }
  },

  /** Moves back one step; returns the room to open, or undefined if empty. */
  back: (currentRoomId: string | undefined): string | undefined => {
    const roomId = state.back.pop();
    if (roomId === undefined) return undefined;
    if (currentRoomId) state.forward.push(currentRoomId);
    skipNextRecord = true;
    return roomId;
  },

  /** Moves forward one step; returns the room to open, or undefined if empty. */
  forward: (currentRoomId: string | undefined): string | undefined => {
    const roomId = state.forward.pop();
    if (roomId === undefined) return undefined;
    if (currentRoomId) state.back.push(currentRoomId);
    skipNextRecord = true;
    return roomId;
  },
};
