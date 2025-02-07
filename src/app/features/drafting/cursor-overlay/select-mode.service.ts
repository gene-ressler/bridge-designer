import { EventEmitter, Injectable } from '@angular/core';
import { Point2D, Rectangle2D } from '../../../shared/classes/graphics';
import { ElementSelectorService } from '../services/element-selector.service';
import { HotElementService } from '../services/hot-element.service';
import { SelectCursorService } from '../services/select-cursor.service';
import { JointCursorService } from '../services/joint-cursor.service';
import { Joint } from '../../../shared/classes/joint.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { SelectedElementsService } from '../services/selected-elements-service';
import { CoordinateService } from '../services/coordinate.service';
import { DesignGrid, DesignGridService } from '../../../shared/services/design-grid.service';
import { EventOrigin } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';
import { HotElementDragService } from '../services/hot-element-drag.service';
import { Member } from '../../../shared/classes/member.model';
import { GuideKnob } from '../services/guides.service';
import { Labels } from '../services/labels.service';

/** Implementation of the select drafting panel mode i/o. Includes moving the selected joint. */
@Injectable({ providedIn: 'root' })
export class SelectModeService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly coordinateService: CoordinateService,
    private readonly elementSelectorService: ElementSelectorService,
    private readonly hotElementDragService: HotElementDragService,
    private readonly hotElementService: HotElementService,
    private readonly jointCursorService: JointCursorService,
    private readonly selectCursorService: SelectCursorService,
    private readonly selectedElementsService: SelectedElementsService,
  ) {}

  private _ctx: CanvasRenderingContext2D | undefined;
  private initialHotJoint: Joint | undefined;
  private moveJointRequest: EventEmitter<{ joint: Joint; newLocation: Point2D }> | undefined;
  private movingJoint: Joint | undefined;

  public initialize(
    ctx: CanvasRenderingContext2D,
    moveJointRequest: EventEmitter<{ joint: Joint; newLocation: Point2D }>,
  ): SelectModeService {
    this._ctx = ctx;
    this.moveJointRequest = moveJointRequest;
    return this;
  }

  private get ctx(): CanvasRenderingContext2D {
    return Utility.assertNotUndefined(this._ctx);
  }

  handlePointerDown(event: PointerEvent): void {
    // Left button down alone to start.
    if (event.buttons !== 1 << 0 || this.hotElementDragService.isDragging()) {
      return;
    }
    if (this.hotElementService.hotElement instanceof Joint) {
      this.initialHotJoint = this.hotElementService.hotElement;
    }
    this.selectCursorService.start(this.ctx, event.offsetX, event.offsetY);
  }

  handlePointerMove(event: PointerEvent): void {
    if (this.hotElementDragService.isDragging()) {
      return;
    }
    this.maybeSwitchToJointMove(event);
    if (this.selectCursorService.isAnchored || this.movingJoint) {
      this.hotElementService.clearRenderedHotElement(this.ctx);
    } else {
      this.hideKeyboardJointMoveCursor();
      this.hotElementService.updateRenderedHotElement(this.ctx, event.offsetX, event.offsetY, {
        excludeFixedJoints: true,
        considerOnly: [Joint, Member, GuideKnob, Labels]
      });
    }
    // These do nothing if the respective cursor isn't in use.
    this.selectCursorService.update(event.offsetX, event.offsetY);
    this.jointCursorService.move(this.ctx, event.offsetX, event.offsetY);
  }

  private readonly cursor: Rectangle2D = Rectangle2D.createEmpty();

  handlePointerUp(event: PointerEvent): void {
    if (event.button !== 0 || this.hotElementDragService.isDragging(event)) {
      return;
    }
    const selectCursor = this.selectCursorService.end(event.offsetX, event.offsetY, this.cursor);
    if (selectCursor) {
      this.elementSelectorService.select(selectCursor, event.ctrlKey || event.shiftKey, EventOrigin.DRAFTING_PANEL);
      this.hotElementService.invalidate(this.ctx);
    }
    if (this.movingJoint) {
      const newLocation = this.jointCursorService.end(this.ctx);
      this.moveJointRequest?.emit({ joint: this.movingJoint, newLocation });
    }
    this.movingJoint = this.initialHotJoint = undefined;
  }

  private readonly validPoint = new Point2D();

  handleDocumentKeyDown(event: KeyboardEvent): void {
    // Ignore if we're in the middle of a cursor drag.
    if (this.movingJoint || this.selectCursorService.isAnchored) {
      return;
    }
    const movingJoint = this.selectedElementsService.getSelectedJoint(this.bridgeService.bridge);
    if (!movingJoint) {
      return;
    }
    this.hotElementService.clearRenderedHotElement(this.ctx);
    let dx: number = 0;
    let dy: number = 0;
    switch (event.key) {
      case 'ArrowUp':
        dy = DesignGrid.FINE_GRID_SIZE;
        break;
      case 'ArrowDown':
        dy = -DesignGrid.FINE_GRID_SIZE;
        break;
      case 'ArrowRight':
        dx = DesignGrid.FINE_GRID_SIZE;
        break;
      case 'ArrowLeft':
        dx = -DesignGrid.FINE_GRID_SIZE;
        break;
      default:
        return;
    }
    // Search for valid point in given direction.
    this.coordinateService.getNearbyWorldPointOnGrid(
      this.validPoint,
      movingJoint,
      dx,
      dy,
      DesignGridService.FINEST_GRID,
    );

    // Manage the joint cursor.
    if (!this.jointCursorService.visible) {
      this.jointCursorService
        .startAtWorldPoint(this.validPoint, { grid: DesignGridService.FINEST_GRID })
        .show(this.ctx);
    } else {
      this.jointCursorService.moveToWorldPoint(this.ctx, this.validPoint);
    }
    this.moveJointRequest?.emit({ joint: movingJoint, newLocation: this.validPoint });
  }

  /** If a joint is being moved via keyboard, hides the joint reticle cursor. */
  private hideKeyboardJointMoveCursor(): void {
    if (!this.movingJoint && this.jointCursorService.visible) {
      this.jointCursorService.clear(this.ctx);
    }
  }

  /** Changes from select to joint move if user is dragging the hot joint. */
  private maybeSwitchToJointMove(event: PointerEvent): void {
    if (
      (event.buttons & (1 << 0)) === 0 || // dragging
      this.movingJoint || // haven't already switched
      !this.initialHotJoint || // hot joint at pointer down
      !this.selectCursorService.isAnchored || // select rectangle valid
      this.selectCursorService.diagonalSqr <= 9 // significant pointer movement
    ) {
      return;
    }
    this.selectCursorService.abort();
    this.movingJoint = this.initialHotJoint;
    this.elementSelectorService.selectJoint(this.movingJoint, EventOrigin.DRAFTING_PANEL);
    this.jointCursorService
      .start(event.offsetX, event.offsetY, { anchorJoints: this.getConnectedJoints(this.movingJoint) })
      .show(this.ctx);
  }

  /** Gets the joint connected by members to the one given. */
  private getConnectedJoints(joint: Joint) {
    return this.bridgeService.findMembersWithJoint(joint).map(member => member.getOtherJoint(joint));
  }
}
