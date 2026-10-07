import React from 'react';
import { EventEmitter } from 'node:events';
import { MatrixEvent, RoomEvent } from 'matrix-js-sdk';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientNonUIFeatures } from '../../src/app/pages/client/ClientNonUIFeatures';
import { getInboxInvitesPath } from '../../src/app/pages/pathUtils';

const state = vi.hoisted(() => ({
  navigateRoom: vi.fn(),
  navigate: vi.fn(),
  invites: [] as string[],
  directs: new Set<string>(),
  parents: new Map(),
  unread: new Map(),
  mx: undefined as unknown,
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('jotai', () => ({
  useAtomValue: (key: 'invites' | 'directs' | 'parents' | 'unread') => state[key],
}));
vi.mock('../../src/app/state/room/roomToUnread', () => ({ roomToUnreadAtom: 'unread' }));
vi.mock('../../src/app/state/room-list/inviteList', () => ({ allInvitesAtom: 'invites' }));
vi.mock('../../src/app/state/room/roomToParents', () => ({ roomToParentsAtom: 'parents' }));
vi.mock('../../src/app/state/mDirectList', () => ({ mDirectAtom: 'directs' }));
vi.mock('../../src/app/state/settings', () => ({ settingsAtom: 'settings' }));
vi.mock('../../src/app/state/hooks/settings', () => ({
  useSetting: (
    _atom: unknown,
    key: 'showNotifications' | 'isNotificationSounds' | 'twitterEmoji' | 'pageZoom'
  ) => [
    { showNotifications: true, isNotificationSounds: false, twitterEmoji: true, pageZoom: 100 }[
      key
    ],
  ],
}));
vi.mock('../../src/app/hooks/useMatrixClient', () => ({ useMatrixClient: () => state.mx }));
vi.mock('../../src/app/hooks/useRoomNavigate', () => ({
  useRoomNavigate: () => ({ navigateRoom: state.navigateRoom }),
}));
vi.mock('../../src/app/hooks/router/useSelectedRoom', () => ({ useSelectedRoom: () => undefined }));
vi.mock('../../src/app/hooks/router/useInbox', () => ({
  useInboxNotificationsSelected: () => false,
}));
vi.mock('../../src/app/hooks/useMediaAuthentication', () => ({
  useMediaAuthentication: () => false,
}));
vi.mock('../../src/app/hooks/useSpaceAutoJoinGlobal', () => ({ useSpaceAutoJoinGlobal: vi.fn() }));
vi.mock('../../src/app/hooks/useRoomNavShortcuts', () => ({ useRoomNavShortcuts: vi.fn() }));
vi.mock('../../src/app/hooks/useRoomNavHistory', () => ({ useRoomNavHistory: vi.fn() }));
vi.mock('../../src/app/state/gifFavorites', () => ({
  migrateGifFavorites: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/app/utils/dom', () => ({
  notificationPermission: () => true,
  setFavicon: vi.fn(),
}));
vi.mock('../../src/app/utils/matrix', () => ({ getMxIdLocalPart: () => 'alice' }));
vi.mock('../../src/app/utils/room', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/app/utils/room')>()),
  getNotificationType: () => 'all',
  getUnreadInfo: () => ({ total: 1, highlight: 0 }),
}));

class DesktopNotification {
  // eslint-disable-next-line no-use-before-define
  static instances: DesktopNotification[] = [];

  onclick?: (event: Event) => void;

  close = vi.fn();

  constructor(public title: string, public options: { body?: string; tag?: string }) {
    DesktopNotification.instances.push(this);
  }
}

let renderer: ReactTestRenderer | undefined;
let client: EventEmitter;
const focus = vi.fn();
const browserWindow = { Notification: DesktopNotification, closed: false, focus };

function mount() {
  act(() => {
    renderer = create(<ClientNonUIFeatures>{null}</ClientNonUIFeatures>);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  DesktopNotification.instances = [];
  state.invites = [];
  state.directs.clear();
  client = new EventEmitter();
  state.mx = Object.assign(client, {
    getSyncState: () => 'SYNCING',
    getUserId: () => '@me:example.org',
  });
  browserWindow.closed = false;
  vi.stubGlobal('window', browserWindow);
  vi.stubGlobal('document', {
    hasFocus: () => false,
    documentElement: { style: { setProperty: vi.fn(), removeProperty: vi.fn() } },
  });
});

afterEach(() => {
  act(() => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

function clickAndExpect(notification: DesktopNotification, closed: boolean, navigate: () => void) {
  browserWindow.closed = closed;
  const event = new Event('click', { cancelable: true });
  expect(notification.onclick).toBeTypeOf('function');
  notification.onclick?.(event);
  expect.soft(focus).toHaveBeenCalledTimes(closed ? 0 : 1);
  expect.soft(event.defaultPrevented).toBe(true);
  navigate();
  expect(notification.close).toHaveBeenCalledOnce();
}

describe('desktop message notification clicks', () => {
  it.each([
    { encrypted: false, dm: false },
    { encrypted: false, dm: true },
    { encrypted: true, dm: false },
    { encrypted: true, dm: true },
  ])('focuses and navigates to the message ($encrypted encrypted, $dm DM)', ({ encrypted, dm }) => {
    const roomId = '!room:example.org';
    const eventId = '$message:example.org';
    if (dm) state.directs.add(roomId);
    mount();
    const event = new MatrixEvent({
      event_id: eventId,
      room_id: roomId,
      sender: '@alice:example.org',
      type: encrypted ? 'm.room.encrypted' : 'm.room.message',
      content: encrypted
        ? { algorithm: 'm.megolm.v1.aes-sha2', ciphertext: 'ciphertext' }
        : { msgtype: 'm.text', body: 'Hello from Alice' },
    });
    const room = {
      roomId,
      name: 'General',
      isSpaceRoom: () => false,
      getMember: () => ({ rawDisplayName: 'Alice', getMxcAvatarUrl: () => undefined }),
      getMxcAvatarUrl: () => undefined,
    };
    act(() => {
      client.emit(RoomEvent.Timeline, event, room, false, false, { liveEvent: true });
    });
    expect(DesktopNotification.instances).toHaveLength(1);
    const [notification] = DesktopNotification.instances;
    expect(notification.title).toBe(dm ? 'Alice' : 'Alice (#General)');
    expect(notification.options).toMatchObject({
      body: encrypted ? 'Encrypted message' : 'Hello from Alice',
      tag: roomId,
    });
    clickAndExpect(notification, false, () => {
      expect(state.navigateRoom).toHaveBeenCalledOnce();
      expect(state.navigateRoom).toHaveBeenCalledWith(roomId, eventId);
      expect(state.navigate).not.toHaveBeenCalled();
    });
    vi.clearAllMocks();
    clickAndExpect(notification, true, () => {
      expect(state.navigateRoom).not.toHaveBeenCalled();
    });
  });
});

describe('desktop invitation notification clicks', () => {
  it.each([false, true])('handles an invitation when window.closed is %s', (closed) => {
    mount();
    state.invites = ['!invite:example.org'];
    act(() => {
      renderer?.update(<ClientNonUIFeatures>{null}</ClientNonUIFeatures>);
    });
    expect(DesktopNotification.instances).toHaveLength(1);
    const [notification] = DesktopNotification.instances;
    expect(notification.title).toBe('Invitation');
    expect(notification.options.body).toBe('You have 1 new invitation request.');
    clickAndExpect(notification, closed, () => {
      if (closed) expect(state.navigate).not.toHaveBeenCalled();
      else {
        expect(state.navigate).toHaveBeenCalledOnce();
        expect(state.navigate).toHaveBeenCalledWith(getInboxInvitesPath());
      }
      expect(state.navigateRoom).not.toHaveBeenCalled();
    });
  });
});
