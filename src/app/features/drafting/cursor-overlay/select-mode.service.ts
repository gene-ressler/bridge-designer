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

/** Implementation of the select drafting panel mode i/o. Includes moving the selected joint. */
@Injectable({ providedIn: 'root' })
export class SelectModeService {
  constructor(
    private readonly coordinateService: CoordinateService,
    private readonly bridgeService: BridgeService,
    private readonly elementSelectorService: ElementSelectorService,
    private readonly hotElementService: HotElementService,
    private readonly jointCursorService: JointCursorService,
    private readonly selectCursorService: SelectCursorService,
    private readonly selectedElementsService: SelectedElementsService,
  ) {}

  private _ctx: CanvasRenderingContext2D | undefined;
  private moveJointRequest: EventEmitter<{ joint: Joint; newLocation: Point2D }> | undefined;
  private initialHotJoint: Joint | undefined;
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
    if (this.movingJoint) {
      const newLocation = this.jointCursorService.end(this.ctx);
      this.moveJointRequest?.emit({ joint: this.movingJoint, newLocation });
    }
    this.movingJoint = this.initialHotJoint = undefined;
  }

  private readonly nearbyPoint = new Point2D();

  handleDocumentKeyDown(event: KeyboardEvent): void {
    // Ignore if we're in the middle of a cursor drag.
    if (this.movingJoint || this.selectCursorService.isAnchored) {
      return;
    }
    const selectedJoint = this.selectedElementsService.getSelectedJoint(this.bridgeService.bridge);
    if (!selectedJoint) {
      return;
    }
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
    this.coordinateService.getNearbyPointOnGrid(this.nearbyPoint, selectedJoint, dx, dy, DesignGridService.FINEST_GRID);
    this.moveJointRequest?.emit({ joint: selectedJoint, newLocation: this.nearbyPoint });
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
    const connectedJoints = this.bridgeService
      .findMembersWithJoint(movingJoint)
      .map(member => member.getOtherJoint(movingJoint));
    this.elementSelectorService.selectJoint(movingJoint);
    this.jointCursorService.start(event.offsetX, event.offsetY, connectedJoints).show(this.ctx);
  }
}
