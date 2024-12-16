export type InputHandlerSet = {
  handleMouseEnter?: (event: MouseEvent) => void;
  handleMouseLeave?: (event: MouseEvent) => void;
  handleMouseMove?: (event: MouseEvent) => void;
  handleMouseDown?: (event: MouseEvent) => void;
  handleMouseUp?: (event: MouseEvent) => void;
  handleDocumentKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * A set of delegating user input listeners that can be registered on a canvas.
 * A corresponding set of delegated handlers can be changed at any time.
 */
export class InputEventDelegator {
  public handlerSet: InputHandlerSet = {}; // By default, nothing happens.

  public register(canvas: HTMLCanvasElement) {
    const that = this;
    canvas.addEventListener('mouseenter', (event: MouseEvent) => that.handlerSet.handleMouseEnter?.(event));
    canvas.addEventListener('mouseleave', (event: MouseEvent) => that.handlerSet.handleMouseLeave?.(event));
    canvas.addEventListener('mousemove', (event: MouseEvent) => that.handlerSet.handleMouseMove?.(event));
    canvas.addEventListener('mousedown', (event: MouseEvent) => that.handlerSet.handleMouseDown?.(event));
    canvas.addEventListener('mouseup', (event: MouseEvent) => that.handlerSet.handleMouseUp?.(event));
    document.addEventListener('keydown', (event: KeyboardEvent) => that.handlerSet.handleDocumentKeyDown?.(event));
  }
}
