import { EventEmitter, Injectable } from '@angular/core';
import { HotElementService } from './hot-element.service';
import { Utility } from '../../../shared/classes/utility';

export interface Draggable {
  draggableService: DraggableService;
}

export interface DraggableService {
  move(ctx: CanvasRenderingContext2D, draggable: any, x: number, y: number): void;
  clear(ctx: CanvasRenderingContext2D): void;
}

/** 
 * Logic for dragging hot draggable elements. This assumes the overlying modal handler 
 * keeps the hot element updated.
 */
@Injectable({ providedIn: 'root' })
export class HotElementDragService {
  private _ctx: CanvasRenderingContext2D | undefined;
  private dragging: Draggable | undefined;
  private dragEndEvent: PointerEvent | null = null;
  private dragCursorActive: EventEmitter<Draggable | undefined> | undefined;

  constructor(private readonly hotElementService: HotElementService) {}

  public initialize(
    ctx: CanvasRenderingContext2D,
    dragCursorActive: EventEmitter<Draggable | undefined>,
  ): HotElementDragService {
    this._ctx = ctx;
    this.dragCursorActive = dragCursorActive;
    return this;
  }

  /**
   * Returns whether something is being dragged. Optionally includes whether a
   * given event was the one that just ended the drag and so has already been handled.
   * Useful in modal pointer up handlers, which are invoked after this one.
   */
  public isDragging(event?: PointerEvent): boolean {
    return this.dragging !== undefined || event === this.dragEndEvent;
  }

  handlePointerDown(event: PointerEvent): void {
    const hotElement = this.hotElementService.hotElement;
    if (event.buttons !== 1 << 0 || !hotElement || !('draggableService' in hotElement)) {
      return;
    }
    // Assumes test for draggableService property above means this is a Draggable.
    const draggable = hotElement as unknown as Draggable;
    this.ctx.canvas.setPointerCapture(event.pointerId);
    this.dragging = draggable;
    draggable.draggableService.move(this.ctx, draggable, event.offsetX, event.offsetY);
    this.dragCursorActive?.emit(this.dragging);
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging.draggableService.move(this.ctx, this.dragging, event.offsetX, event.offsetY);
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.button !== 0 || !this.dragging) {
      return;
    }
    this.ctx.canvas.releasePointerCapture(event.pointerId);
    this.dragEndEvent = event;
    this.dragCursorActive?.emit(undefined);
    this.dragging.draggableService.clear(this.ctx);
    this.dragging = undefined;
  }

  private get ctx(): CanvasRenderingContext2D {
    return Utility.assertNotUndefined(this._ctx);
  }
}
