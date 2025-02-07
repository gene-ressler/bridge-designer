import { EventEmitter, Injectable } from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { JointCursorService } from '../services/joint-cursor.service';
import { HotElementService } from '../services/hot-element.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { Utility } from '../../../shared/classes/utility';
import { HotElementDragService } from '../services/hot-element-drag.service';
import { GuideKnob } from '../services/guides.service';
import { Labels } from '../services/labels.service';

@Injectable({ providedIn: 'root' })
export class JointsModeService {
  private _ctx: CanvasRenderingContext2D | undefined;
  private addJointRequest: EventEmitter<Joint> | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly hotElementDragService: HotElementDragService,
    private readonly hotElementService: HotElementService,
    private readonly jointCursorService: JointCursorService,
  ) {}

  public initialize(ctx: CanvasRenderingContext2D, addJointRequest: EventEmitter<Joint>): JointsModeService {
    this._ctx = ctx;
    this.addJointRequest = addJointRequest;
    return this;
  }

  private get ctx(): CanvasRenderingContext2D {
    return Utility.assertNotUndefined(this._ctx);
  }

  handlePointerEnter(event: PointerEvent): void {
    this.jointCursorService.start(event.offsetX, event.offsetY).show(this.ctx);
  }

  handlePointerLeave(_event: PointerEvent): void {
    this.jointCursorService.clear(this.ctx);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.buttons !== 1 << 0 || this.hotElementDragService.isDragging()) {
      return;
    }
    // Adding the joint sets the index correctly.
    const locationWorld = this.jointCursorService.locationWorld;
    if (this.bridgeService.findJointAt(locationWorld)) {
      return;
    }
    this.addJointRequest?.emit(new Joint(-1, locationWorld.x, locationWorld.y, false));
  }

  handlePointerMove(event: PointerEvent): void {
    if (this.hotElementDragService.isDragging()) {
      return;
    }
    this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
      considerOnly: [GuideKnob, Labels], // Switches mouse cursor on hover over draggable.
    });
    if (this.hotElementService.hotElement) {
      this.jointCursorService.clear(this.ctx);
    } else {
      this.jointCursorService.move(this.ctx, event.offsetX, event.offsetY, /* force= */ true);
    }
  }
}
