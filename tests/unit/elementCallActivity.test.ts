import fs from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';
import { patchCallActivity } from '../../scripts/fork/element-call-activity.mjs';

it('exposes raw speech from the shipped Element Call component when its highlight is disabled', () => {
  const source = fs.readFileSync(
    'node_modules/@element-hq/element-call-embedded/dist/assets/index-Dul-9Slf.js',
    'utf8'
  );
  const patched = patchCallActivity(source);
  const component = patched.match(/Q7=(\(\{ref:[\s\S]+?);Q7\.displayName=/)?.[1];
  expect(component).toBeDefined();
  const render = vm.runInNewContext(`(${component})`, {
    TU: () => ({}),
    VV: () => ({ t: (key: string) => key }),
    V: (value: unknown) => value,
    A1: () => undefined,
    R: { useEffect() {}, useState: () => [false, () => {}] },
    B: { jsx: (_type: unknown, props: unknown) => props, jsxs: () => null },
    z: { default: (...classes: unknown[]) => classes },
    m5: { speaking: 'speaking' },
    YMe: null,
    UOe: null,
    Y7: null,
  });
  const props = {
    vm: { userId: '@alice:example.org', speaking$: true },
    showSpeakingIndicators: false,
    primaryButton: {},
  };
  const tile = render(props).trigger;
  expect(tile.className[2].speaking).toBe(false);
  expect(tile['data-cinny-speaking']).toBe(true);
  expect(tile['data-cinny-user-id']).toBe('@alice:example.org');
  props.vm.speaking$ = false;
  expect(render(props).trigger['data-cinny-speaking']).toBe(false);
});

it('fails closed if the pinned widget integration changes', () => {
  expect(() => patchCallActivity('different bundle')).toThrow(/no longer matches/);
});
