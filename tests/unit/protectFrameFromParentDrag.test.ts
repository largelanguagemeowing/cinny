import { describe, expect, it } from 'vitest';
import { protectFrameFromParentDrag } from '../../src/app/plugins/call/protectFrameFromParentDrag';

const createFrame = (pointerEvents = '') =>
  ({
    style: { pointerEvents },
  } as Pick<HTMLIFrameElement, 'style'>);

const createDocumentTarget = () =>
  new EventTarget() as unknown as Pick<Document, 'addEventListener' | 'removeEventListener'>;

describe('protectFrameFromParentDrag', () => {
  it('removes the frame from hit testing for the duration of a parent drag', () => {
    const eventTarget = createDocumentTarget();
    const frame = createFrame('auto');
    const dispose = protectFrameFromParentDrag(eventTarget, frame);

    eventTarget.dispatchEvent(new Event('dragstart'));
    expect(frame.style.pointerEvents).toBe('none');

    eventTarget.dispatchEvent(new Event('dragend'));
    expect(frame.style.pointerEvents).toBe('auto');

    dispose();
  });

  it('restores the frame after a drop', () => {
    const eventTarget = createDocumentTarget();
    const frame = createFrame();
    const dispose = protectFrameFromParentDrag(eventTarget, frame);

    eventTarget.dispatchEvent(new Event('dragstart'));
    eventTarget.dispatchEvent(new Event('drop'));

    expect(frame.style.pointerEvents).toBe('');
    dispose();
  });

  it('restores the frame and removes listeners when disposed during a drag', () => {
    const eventTarget = createDocumentTarget();
    const frame = createFrame('inherit');
    const dispose = protectFrameFromParentDrag(eventTarget, frame);

    eventTarget.dispatchEvent(new Event('dragstart'));
    dispose();

    expect(frame.style.pointerEvents).toBe('inherit');
    eventTarget.dispatchEvent(new Event('dragstart'));
    expect(frame.style.pointerEvents).toBe('inherit');
  });
});
