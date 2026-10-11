import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from '../../src/app/components/media/VideoPlayer';

const settings = vi.hoisted(() => ({ lowAnimationMode: false }));
vi.mock('../../src/app/hooks/useLowAnimationMode', () => ({
  useLowAnimationMode: () => settings.lowAnimationMode,
}));
vi.mock('../../src/app/components/media/Video', async () => {
  const { createElement, forwardRef } = await import('react');
  return {
    Video: forwardRef<HTMLVideoElement, React.ComponentProps<'video'>>((props, ref) =>
      createElement('video', { ...props, ref })
    ),
  };
});

const src = 'https://example.org/animation.mp4';
const play = vi.fn<() => Promise<void>>();
const pause = vi.fn();
const node = { play, pause };
let renderer: ReturnType<typeof create>;

function render(
  playback: 'gif' | 'video',
  props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}
) {
  act(() => {
    renderer = create(<VideoPlayer playback={playback} src={src} {...props} />, {
      createNodeMock: () => node,
    });
  });
  return renderer.root.findByType('video');
}

beforeEach(() => {
  settings.lowAnimationMode = false;
  play.mockReset().mockResolvedValue(undefined);
  pause.mockReset();
});

afterEach(() => {
  act(() => renderer?.unmount());
});

describe.each(['gif', 'video'] as const)('VideoPlayer %s playback', (playback) => {
  it('sets playback attributes and forwards the source and title', () => {
    const video = render(playback, { title: 'An animation' });
    expect(video.props).toMatchObject({
      src,
      title: 'An animation',
      controls: playback === 'video',
      loop: playback === 'gif',
      muted: playback === 'gif',
      playsInline: playback === 'gif',
      autoPlay: true,
    });
    if (playback === 'gif') expect(video.props.tabIndex).toBe(0);
    expect(video.props.onMouseEnter).toBeUndefined();
    expect(video.props.onFocus).toBeUndefined();
    expect(pause).not.toHaveBeenCalled();
  });

  it.each([
    ['onMouseEnter', 'onMouseLeave'],
    ['onFocus', 'onBlur'],
  ])('plays on %s and pauses on %s in low animation mode', (enter, leave) => {
    settings.lowAnimationMode = true;
    const video = render(playback);
    expect(video.props.autoPlay).toBe(false);
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
    if (playback === 'gif') expect(video.props.tabIndex).toBe(0);
    pause.mockClear();
    act(() => video.props[enter]());
    expect(play).toHaveBeenCalledTimes(1);
    act(() => video.props[leave]());
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('forwards metadata and error events unchanged', () => {
    const onLoadedMetadata = vi.fn();
    const onError = vi.fn();
    const video = render(playback, { onLoadedMetadata, onError });
    const metadataEvent = { currentTarget: node, type: 'loadedmetadata' };
    const errorEvent = { currentTarget: node, type: 'error' };
    act(() => video.props.onLoadedMetadata(metadataEvent));
    act(() => video.props.onError(errorEvent));
    expect(onLoadedMetadata).toHaveBeenCalledTimes(1);
    expect(onLoadedMetadata).toHaveBeenCalledWith(metadataEvent);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(errorEvent);
  });

  it.each(['onMouseEnter', 'onFocus'])('reapplies %s playback when metadata loads', (enter) => {
    settings.lowAnimationMode = true;
    const onLoadedMetadata = vi.fn();
    const video = render(playback, { onLoadedMetadata });
    act(() => video.props[enter]());
    play.mockClear();
    const event = { currentTarget: node };
    act(() => video.props.onLoadedMetadata(event));
    expect(play).toHaveBeenCalledTimes(1);
    expect(onLoadedMetadata).toHaveBeenCalledTimes(1);
    expect(onLoadedMetadata).toHaveBeenCalledWith(event);
  });

  it('keeps idle media paused when metadata loads', () => {
    settings.lowAnimationMode = true;
    const video = render(playback);
    pause.mockClear();
    act(() => video.props.onLoadedMetadata({ currentTarget: node }));
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('updates the source with low animation mode %s', (lowAnimationMode) => {
    settings.lowAnimationMode = lowAnimationMode;
    const video = render(playback);
    if (lowAnimationMode) act(() => video.props.onMouseEnter());
    const nextSrc = 'https://example.org/replacement.mp4';
    act(() => renderer.update(<VideoPlayer playback={playback} src={nextSrc} />));
    const updated = renderer.root.findByType('video');
    expect(updated.props.src).toBe(nextSrc);
    expect(updated.props.autoPlay).toBe(!lowAnimationMode);
    play.mockClear();
    act(() => updated.props.onLoadedMetadata({ currentTarget: node }));
    if (lowAnimationMode) expect(play).toHaveBeenCalledTimes(1);
    else expect(pause).not.toHaveBeenCalled();
  });

  it('handles rejected play promises and still pauses on leave', async () => {
    settings.lowAnimationMode = true;
    play.mockRejectedValue(new Error('Playback blocked'));
    const video = render(playback);
    await act(async () => {
      video.props.onMouseEnter();
    });
    await act(async () => {
      video.props.onLoadedMetadata({ currentTarget: node });
    });
    expect(play).toHaveBeenCalledTimes(2);
    pause.mockClear();
    act(() => video.props.onMouseLeave());
    expect(pause).toHaveBeenCalledTimes(1);
  });
});
