import { Injectable } from '@angular/core';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { ElementSelectorService } from '../services/element-selector.service';
import { HotElementService } from '../services/hot-element.service';
import { SelectCursorService } from '../services/select-cursor.service';
import { JointCursorService } from '../services/joint-cursor.service';
import { Joint } from '../../../shared/classes/joint.model';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { SelectedElementsService } from '../services/selected-elements-service';

/** Implementation of the select drafting panel mode i/o. */
@Injectable({ providedIn: 'root' })
export class SelectModeService {
  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly elementSelectorService: ElementSelectorService,
    private readonly hotElementService: HotElementService,
    private readonly jointCursorService: JointCursorService,
    private readonly selectCursorService: SelectCursorService,
    private readonly selectedElementsService: SelectedElementsService,
  ) {}

  private _ctx: CanvasRenderingContext2D | undefined;
  private initialHotJoint: Joint | undefined;
  private movingJoint: Joint | undefined;

  public initialize(ctx: CanvasRenderingContext2D): SelectModeService {
    this._ctx = ctx;
    return this;
  }

  private get ctx(): CanvasRenderingContext2D {
    if (!this._ctx) {
      throw new Error('Select mode service not initialized');
    }
    return this._ctx;
  }

  handleMouseDown(event: MouseEvent): void {
    // Left button down alone to start.
    if (event.buttons !== 1 << 0 || !this._ctx) {
      return;
    }
    if (this.hotElementService.hotElement instanceof Joint) {
      this.initialHotJoint = this.hotElementService.hotElement;
    }
    this.selectCursorService.start(this._ctx, event.offsetX, event.offsetY);
  }

  handleMouseMove(event: MouseEvent): void {
    this.maybeSwitchToJointMove(event);
    if (this.selectCursorService.isAnchored || this.movingJoint) {
      this.hotElementService.clearRenderedHotElement(this.ctx);
    } else {
      this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
        excludeFixedJoints: true,
      });
    }
    // These do nothing if the respective cursor isn't in use.
    this.selectCursorService.update(event.offsetX, event.offsetY);
    this.jointCursorService.move(this.ctx, event.offsetX, event.offsetY);
  }

  private readonly cursor: Rectangle2D = Rectangle2D.createEmpty();

  handleMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    const selectCursor = this.selectCursorService.end(event.offsetX, event.offsetY, this.cursor);
    if (selectCursor) {
      this.elementSelectorService.select(selectCursor, event.ctrlKey || event.shiftKey);
      this.hotElementService.invalidate(this.ctx);
    }
    this.jointCursorService.end(this.ctx);
    this.movingJoint = this.initialHotJoint = undefined;
  }

  handleDocumentKeyDown(event: KeyboardEvent): void {
    const selectedJoint = this.selectedElementsService.getSelectedJoint(this.designBridgeService.bridge);
    if (!selectedJoint) {
      return;
    }
    switch (event.key) {
      case 'ArrowUp':
        break;
      case 'ArrowDown':
        break;
      case 'ArrowRight':
        break;
      case 'ArrowLeft':
        break;
    }
  }

  /** Changes from select to joint move if user is dragging the hot joint. */
  private maybeSwitchToJointMove(event: MouseEvent): void {
    if (
      (event.buttons & (1 << 0)) === 0 || // dragging
      this.movingJoint || // haven't already switched
      !this.initialHotJoint || // hot joint at mouse down
      !this.selectCursorService.isAnchored || // select rectangle valid
      this.selectCursorService.diagonalSqr <= 9 // significant mouse movement
    ) {
      return;
    }
    this.selectCursorService.abort();
    const movingJoint = this.initialHotJoint;
    this.movingJoint = movingJoint;
    const connectedJoints = this.designBridgeService
      .findMembersWithJoint(movingJoint)
      .map(member => member.getOtherJoint(movingJoint));
    this.elementSelectorService.selectJoint(movingJoint);
    this.jointCursorService.start(event.offsetX, event.offsetY, connectedJoints).show(this.ctx);
  }
}
