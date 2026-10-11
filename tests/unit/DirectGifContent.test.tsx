import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DirectGifContent } from '../../src/app/components/message/content/DirectGifContent';

vi.mock('folds', () => ({
  Box: 'div',
  Button: 'button',
  Spinner: 'progress',
  Text: 'span',
  toRem: (value: number) => `${value / 16}rem`,
}));
vi.mock('../../src/app/components/message/attachment', () => ({
  Attachment: 'article',
  AttachmentBox: 'section',
}));
vi.mock('../../src/app/components/message/content/style.css', () => ({
  RelativeBase: 'relative',
  AbsoluteContainer: 'absolute',
}));
vi.mock('../../src/app/components/media/media.css', () => ({ Image: 'image' }));

const url = 'https://bridge.example/redirect/animation.gif';
let renderer: ReturnType<typeof create>;

function render(autoLoad?: boolean) {
  act(() => {
    renderer = create(<DirectGifContent url={url} autoLoad={autoLoad} />);
  });
  return renderer.root;
}

function load(width: number, height: number) {
  act(() => {
    renderer.root.findByType('img').props.onLoad({
      currentTarget: { naturalWidth: width, naturalHeight: height },
    });
  });
}

afterEach(() => {
  act(() => renderer?.unmount());
  vi.unstubAllGlobals();
});

describe('DirectGifContent', () => {
  it('loads the original URL directly without CORS or fetch and starts at 400x300', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const root = render();
    expect(root.findByType('img').props.src).toBe(url);
    expect(root.findByType('img').props.crossOrigin).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(root.findByType('section').props.style).toEqual({ width: '25rem', height: '18.75rem' });
    expect(root.findAllByType('progress')).toHaveLength(1);
    load(800, 600);
    expect(root.findAllByType('progress')).toHaveLength(0);
  });

  it('does not create an image or fetch until explicitly loaded when autoLoad is false', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const root = render(false);
    expect(root.findAllByType('img')).toHaveLength(0);
    expect(root.findAllByType('progress')).toHaveLength(0);
    expect(root.findByType('button').findByType('span').children).toEqual(['Load GIF']);
    expect(fetch).not.toHaveBeenCalled();
    act(() => root.findByType('button').props.onClick());
    expect(root.findByType('img').props.src).toBe(url);
    expect(root.findAllByType('progress')).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [1200, 600, 400, 200],
    [600, 1200, 175, 350],
    [600, 600, 350, 350],
    [100, 50, 400, 200],
    [10000, 100, 400, 4],
    [0, 0, 400, 300],
  ])('fits natural dimensions %sx%s to %sx%s', (width, height, expectedWidth, expectedHeight) => {
    const root = render();
    load(width, height);
    expect(root.findByType('section').props.style).toEqual({
      width: `${expectedWidth / 16}rem`,
      height: `${expectedHeight / 16}rem`,
    });
    expect(root.findByType('article').props.style.width).toBe(`${expectedWidth / 16}rem`);
  });

  it('removes a failed image and mounts a new direct image on each retry', () => {
    const root = render();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const image = root.findByType('img');
      act(() => image.props.onError());
      expect(root.findAllByType('img')).toHaveLength(0);
      expect(root.findAllByType('progress')).toHaveLength(0);
      expect(root.findByType('button').findByType('span').children).toEqual(['Retry']);
      act(() => root.findByType('button').props.onClick());
      expect(root.findByType('img')).not.toBe(image);
      expect(root.findByType('img').props.src).toBe(url);
      expect(root.findAllByType('progress')).toHaveLength(1);
    }
    load(800, 600);
    expect(root.findAllByType('button')).toHaveLength(0);
    expect(root.findAllByType('progress')).toHaveLength(0);
  });

  it('resets dimensions and load consent when the source changes', () => {
    const root = render(false);
    act(() => root.findByType('button').props.onClick());
    load(600, 1200);
    act(() => {
      renderer.update(<DirectGifContent url="https://example.org/new.gif" autoLoad={false} />);
    });
    expect(root.findAllByType('img')).toHaveLength(0);
    expect(root.findByType('section').props.style).toEqual({ width: '25rem', height: '18.75rem' });
  });
});
