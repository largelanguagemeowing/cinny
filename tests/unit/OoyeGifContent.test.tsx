import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { OoyeGifContent } from '../../src/app/components/message/content/OoyeGifContent';
import { VideoPlayer } from '../../src/app/components/media/VideoPlayer';

vi.mock('folds', () => ({
  Box: 'div',
  Button: 'button',
  Icon: 'i',
  Icons: { Play: 'play' },
  Spinner: 'span',
  Text: 'span',
  Tooltip: 'span',
  TooltipProvider: 'div',
  toRem: (value: number) => `${value / 16}rem`,
}));
vi.mock('../../src/app/components/message/attachment', () => ({
  Attachment: 'section',
  AttachmentBox: 'div',
}));
vi.mock('../../src/app/components/media/Video', () => ({ Video: 'video' }));
vi.mock('../../src/app/components/message/content/style.css', () => ({
  RelativeBase: 'relative',
  AbsoluteContainer: 'absolute',
}));
vi.mock('../../src/app/hooks/useHoverPlay', () => ({
  useHoverPlay: () => ({ lowAnimationMode: false, hovered: false, hoverProps: {} }),
}));

it('renders bridged GIF videos as muted loops without video controls', () => {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OoyeGifContent title="GIF" videoUrl="https://example.org/a.mp4" autoPlay />);
  });
  expect(renderer.root.findByType(VideoPlayer).props).toMatchObject({
    playback: 'gif',
    src: 'https://example.org/a.mp4',
  });
  const video = renderer.root.findByType('video');
  expect(video.props.controls).toBeFalsy();
  expect(video.props).toMatchObject({ autoPlay: true, muted: true, loop: true, playsInline: true });
  act(() => renderer.unmount());
});

it('mounts the shared player only after Watch when automatic loading is disabled', () => {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <OoyeGifContent title="GIF" videoUrl="https://example.org/a.mp4" autoPlay={false} />
    );
  });
  expect(renderer.root.findAllByType(VideoPlayer)).toHaveLength(0);
  act(() => renderer.root.findByType('button').props.onClick());
  expect(renderer.root.findByType(VideoPlayer).props.playback).toBe('gif');
  act(() => renderer.unmount());
});
