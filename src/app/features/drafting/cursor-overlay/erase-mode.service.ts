import { EventEmitter, Injectable } from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { HotElementService } from '../services/hot-element.service';
import { Utility } from '../../../shared/classes/utility';
import { HotElementDragService } from '../services/hot-element-drag.service';

@Injectable({ providedIn: 'root' })
export class EraseModeService {
  private _ctx: CanvasRenderingContext2D | undefined;
  private deleteRequest: EventEmitter<Joint | Member> | undefined;

  constructor(
    private readonly hotElementDragService: HotElementDragService,
    private readonly hotElementService: HotElementService,
  ) {}

  public initialize(
    ctx: CanvasRenderingContext2D,
    deleteRequest: EventEmitter<Joint | Member>,
  ): EraseModeService {
    this._ctx = ctx;
    this.deleteRequest = deleteRequest;
    return this;
  }

  private get ctx(): CanvasRenderingContext2D {
    return Utility.assertNotUndefined(this._ctx);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.buttons !== 1 << 0 || this.hotElementDragService.isDragging()) {
      return;
    }
    const hotElement = this.hotElementService.hotElement;
    this.hotElementService.clearRenderedHotElement(this.ctx);
    if (hotElement instanceof Joint || hotElement instanceof Member) {
      this.deleteRequest?.emit(hotElement);
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (this.hotElementDragService.isDragging()) {
      return;
    }
    this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
      excludeFixedJoints: true,
    });
  }
}
