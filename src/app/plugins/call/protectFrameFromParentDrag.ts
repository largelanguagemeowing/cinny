type DragEventTarget = Pick<Document, 'addEventListener' | 'removeEventListener'>;
type ProtectedFrame = Pick<HTMLIFrameElement, 'style'>;

export const protectFrameFromParentDrag = (
  eventTarget: DragEventTarget,
  frame: ProtectedFrame
): (() => void) => {
  const frameStyle = frame.style;
  let dragActive = false;
  let previousPointerEvents = '';

  const disableFrameHitTesting = () => {
    if (dragActive) return;

    dragActive = true;
    previousPointerEvents = frameStyle.pointerEvents;
    frameStyle.pointerEvents = 'none';
  };

  const restoreFrameHitTesting = () => {
    if (!dragActive) return;

    dragActive = false;
    frameStyle.pointerEvents = previousPointerEvents;
  };

  const captureOptions = { capture: true };
  eventTarget.addEventListener('dragstart', disableFrameHitTesting, captureOptions);
  eventTarget.addEventListener('dragend', restoreFrameHitTesting, captureOptions);
  eventTarget.addEventListener('drop', restoreFrameHitTesting, captureOptions);

  return () => {
    restoreFrameHitTesting();
    eventTarget.removeEventListener('dragstart', disableFrameHitTesting, captureOptions);
    eventTarget.removeEventListener('dragend', restoreFrameHitTesting, captureOptions);
    eventTarget.removeEventListener('drop', restoreFrameHitTesting, captureOptions);
  };
};
