export type InputHandlerSet = {
  handlePointerEnter?: (event: PointerEvent) => void;
  handlePointerLeave?: (event: PointerEvent) => void;
  handlePointerMove?: (event: PointerEvent) => void;
  handlePointerDown?: (event: PointerEvent) => void;
  handlePointerUp?: (event: PointerEvent) => void;
  handleDocumentKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * A set of delegating user input listeners that can be registered on a canvas.
 * A corresponding set of delegated handlers can be changed at any time.
 */
export class InputEventDelegator {
  public handlerSet: InputHandlerSet = {}; // By default, nothing happens.

  // TODO: Consider switching to pointerXXX events. Might allow use with touch pads.
  public register(canvas: HTMLCanvasElement) {
    const that = this;
    canvas.addEventListener('pointerenter', (event: PointerEvent) => that.handlerSet.handlePointerEnter?.(event));
    canvas.addEventListener('pointerleave', (event: PointerEvent) => that.handlerSet.handlePointerLeave?.(event));
    canvas.addEventListener('pointermove', (event: PointerEvent) => that.handlerSet.handlePointerMove?.(event));
    canvas.addEventListener('pointerdown', (event: PointerEvent) => that.handlerSet.handlePointerDown?.(event));
    canvas.addEventListener('pointerup', (event: PointerEvent) => that.handlerSet.handlePointerUp?.(event));
    document.addEventListener('keydown', (event: KeyboardEvent) => that.handlerSet.handleDocumentKeyDown?.(event));
  }
}
