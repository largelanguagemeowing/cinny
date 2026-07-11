import { atom } from 'jotai';

// The current room message search term. undefined = no search active.
export const roomSearchTermAtom = atom<string | undefined>(undefined);

// Whether the room search drawer is currently mounted and visible.
// TopBar reads this to decide whether to show the search input.
export const roomSearchDrawerActiveAtom = atom<boolean>(false);
