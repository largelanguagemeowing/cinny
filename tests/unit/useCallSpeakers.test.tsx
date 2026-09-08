import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { useCallParticipantActivity } from '../../src/app/hooks/useCallSpeakers';
import { CallEmbed } from '../../src/app/plugins/call';

vi.mock('../../src/app/hooks/useCallEmbed', () => ({
  useCallJoined: (embed?: CallEmbed) => !!embed,
}));

afterEach(() => vi.unstubAllGlobals());

it('keeps simultaneous speakers and updates for added or removed tiles', () => {
  let update!: () => void;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: () => void) {
        update = callback;
      }
      observe() {}
      disconnect = disconnect;
    }
  );
  const tile = (id: string, speaking: boolean, sharing = false) => ({
    getAttribute: () => (sharing ? `${id}:DEVICE:screen-share` : `${id}:DEVICE`),
    speaking,
    querySelectorAll: () => [{ getAttribute: () => 'Other label' }, { getAttribute: () => id }],
  });
  const alice = tile('@alice:example.org', true);
  const bob = tile('@bob:example.org', true);
  let tiles = [alice, bob];
  const embed = {
    document: { querySelectorAll: () => tiles },
    iframe: {
      contentWindow: {
        getComputedStyle: (el: typeof alice) => ({
          backgroundImage: el.speaking ? 'linear-gradient(green, green)' : 'none',
        }),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  } as unknown as CallEmbed;
  let speakers = new Set<string>();
  let screenSharers = new Set<string>();
  function Harness({ call }: { call?: CallEmbed }) {
    ({ speakers, screenSharers } = useCallParticipantActivity(call));
    return null;
  }
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Harness call={embed} />);
  });
  expect([...speakers]).toEqual(['@alice:example.org', '@bob:example.org']);
  act(() => {
    bob.speaking = false;
    update();
  });
  expect([...speakers]).toEqual(['@alice:example.org']);
  act(() => {
    tiles = [alice, tile('@carol:example.org', true)];
    update();
  });
  expect([...speakers]).toEqual(['@alice:example.org', '@carol:example.org']);
  act(() => {
    tiles = [alice, tile('@bob:example.org', false, true), tile('@carol:example.org', false, true)];
    update();
  });
  expect([...screenSharers]).toEqual(['@bob:example.org', '@carol:example.org']);
  expect([...speakers]).toEqual(['@alice:example.org']);
  act(() => {
    tiles = [alice];
    update();
  });
  expect(screenSharers.size).toBe(0);
  act(() => {
    tiles = [];
    update();
  });
  expect(speakers.size).toBe(0);
  act(() => {
    renderer.update(<Harness />);
  });
  expect(disconnect).toHaveBeenCalled();
  expect(speakers.size).toBe(0);
  act(() => renderer.unmount());
});
