import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditCommand } from '../../../shared/classes/editing';
import { Geometry, Graphics, Point2D } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignRenderingService } from '../../../shared/services/design-rendering.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { FormsModule } from '@angular/forms';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { AddJointCommand } from '../../controls/edit-command/add-joint.command';
import { AddMemberCommand } from '../../controls/edit-command/add-member.command';
import { DeleteJointCommand } from '../../controls/edit-command/delete-joint.command';
import { DeleteMembersCommand } from '../../controls/edit-command/delete-members.command';
import { CursorOverlayComponent } from '../cursor-overlay/cursor-overlay.component';
import { SelectedElementsService } from '../shared/selected-elements-service';
import { UndoManagerService } from '../shared/undo-manager.service';
import { ToolSelectorComponent } from '../../controls/tool-selector/tool-selector.component';
import { DesignGridDensity, DesignGridService } from '../../../shared/services/design-grid.service';
import { MoveJointCommand } from '../../controls/edit-command/move-joint.command';
import { BridgeSketchModel } from '../../../shared/classes/bridge-sketch.model';
import { GuideKnob, GuidesService } from '../shared/guides.service';
import { Labels, LabelsService } from '../shared/labels.service';
import { Draggable } from '../shared/hot-element-drag.service';
import { DraftingPanelState } from '../../../shared/services/persistence.service';
import { Utility } from '../../../shared/classes/utility';
import { ToastComponent } from '../../toast/toast/toast.component';
import { ToastError } from '../../toast/toast/toast-error';
import { DesignConditions } from '../../../shared/services/design-conditions.service';

@Component({
  selector: 'drafting-panel',
  standalone: true,
  templateUrl: './drafting-panel.component.html',
  styleUrl: './drafting-panel.component.scss',
  imports: [CursorOverlayComponent, FormsModule, ToastComponent, ToolSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftingPanelComponent implements AfterViewInit {
  width: number = screen.availWidth;
  height: number = screen.availHeight;
  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('draftingPanel') draftingPanel!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorLayer') cursorLayer!: ElementRef<CursorOverlayComponent>;
  @ViewChild('titleBlock') titleBlock!: ElementRef<HTMLDivElement>;

  constructor(
    readonly bridgeService: BridgeService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly designGridService: DesignGridService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly guideService: GuidesService,
    private readonly labelsService: LabelsService,
    private readonly selectedElementsService: SelectedElementsService,
    private readonly undoManagerService: UndoManagerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  private get ctx(): CanvasRenderingContext2D {
    return Graphics.getContext(this.draftingPanel);
  }

  handleResize(): void {
    this.eventBrokerService.draftingViewportPendingChange.next({ origin: EventOrigin.DRAFTING_PANEL });
    const parent = Utility.assertNotNull(this.draftingPanel.nativeElement.parentElement);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    this.eventBrokerService.draftingPanelInvalidation.next({ origin: EventOrigin.DRAFTING_PANEL, data: 'viewport' });
  }

  /** Renders the panel, optionally with draggable elements missing, e.g. because they're being dragged. */
  render(draggable?: Draggable | undefined): void {
    this.designRenderingService.render(this.ctx);
    if (!(draggable instanceof Labels)) {
      this.labelsService.render(this.ctx);
    }
    if (!(draggable instanceof GuideKnob)) {
      this.guideService.render(this.ctx);
    }
  }

  loadBridge(bridge: BridgeModel, draftingPanelState: DraftingPanelState): void {
    this.eventBrokerService.selectNoneRequest.next({ origin: EventOrigin.DRAFTING_PANEL });
    const bridgeGridDensity = DesignGridService.getDensityOfWorldPoints(bridge.joints);
    this.selectGridDensity(bridgeGridDensity);
    this.bridgeService.setBridge(bridge, draftingPanelState);
    this.handleResize();
    this.changeDetector.detectChanges(); // Updates title block.
    this.eventBrokerService.loadBridgeCompletion.next({ origin: EventOrigin.DRAFTING_PANEL, data: bridge });
  }

  loadSketch(sketch: BridgeSketchModel) {
    const sketchDensity = DesignGridService.getDensityOfWorldPoints(sketch.joints);
    if (sketchDensity > this.designGridService.grid.density) {
      this.selectGridDensity(sketchDensity);
    }
    this.bridgeService.sketch = sketch;
    this.render();
  }

  addJointRequestHandler(joint: Joint): void {
    if (this.bridgeService.bridge.joints.length >= DesignConditions.MAX_JOINT_COUNT) {
      throw new ToastError('tooManyJointsError');
    }
    if (this.bridgeService.findJointAt(joint)) {
      throw new ToastError('duplicateJointError');
    }
    const command = AddJointCommand.create(
      joint,
      this.bridgeService.bridge,
      this.selectedElementsService.selectedElements,
    );
    this.undoManagerService.do(command);
  }

  addMemberRequestHandler(member: Member): void {
    if (this.bridgeService.getMemberWithJoints(member.a, member.b)) {
      throw new ToastError('duplicateMemberError');
    }
    if (this.bridgeService.isMemberIntersectingHighPier(member.a, member.b)) {
      throw new ToastError('highPierError');
    }
    const command = AddMemberCommand.create(
      member,
      this.bridgeService.bridge,
      this.selectedElementsService.selectedElements,
    );
    this.undoManagerService.do(command);
  }

  deleteRequestHandler(element: Joint | Member): void {
    const bridge = this.bridgeService.bridge;
    const selectedElements = this.selectedElementsService.selectedElements;
    const command: EditCommand =
      element instanceof Joint
        ? new DeleteJointCommand(element, bridge, selectedElements)
        : DeleteMembersCommand.forMember(element, bridge, selectedElements);
    this.undoManagerService.do(command);
  }

  deleteSelectionRequestHandler(): void {
    if (this.selectedElementsService.isSelectionEmpty) {
      return;
    }
    const bridge = this.bridgeService.bridge;
    const selectedElements = this.selectedElementsService.selectedElements;
    const joint = this.selectedElementsService.getSelectedJoint(bridge);
    const command: EditCommand = joint
      ? new DeleteJointCommand(joint, bridge, selectedElements)
      : DeleteMembersCommand.forSelectedMembers(selectedElements, this.bridgeService);
    this.undoManagerService.do(command);
  }

  /** Handles reports from cursor overlay at start and end of draggable dragging. */
  dragCursorActive(draggable: Draggable | undefined) {
    this.render(draggable);
  }

  moveJointRequestHandler({ joint, newLocation }: { joint: Joint; newLocation: Point2D }): void {
    if (Geometry.areColocated2D(newLocation, joint)) {
      throw new ToastError('moveJointError');
    }
    if (this.bridgeService.isMovedJointIntersectingHighPier(joint, newLocation)) {
      throw new ToastError('highPierError');
    }
    const bridge = this.bridgeService.bridge;
    const selectedElements = this.selectedElementsService.selectedElements;
    const command = MoveJointCommand.create(joint, newLocation, bridge, selectedElements);
    this.undoManagerService.do(command);
  }

  // IMPORTANT: Following 2 methods rely on the coincidence that selector indices are the same as density enum values.

  /** Sets the design grid density from the selection widget (menu or button) index. */
  selectGridDensityHandler(selectorIndex: number) {
    if (
      DesignGridDensity.COARSE <= selectorIndex &&
      selectorIndex <= DesignGridDensity.FINE &&
      selectorIndex != this.designGridService.grid.density
    ) {
      this.designGridService.grid.density = selectorIndex;
      this.eventBrokerService.gridDensityChange.next({ origin: EventOrigin.DRAFTING_PANEL });
    }
  }

  /** Sets all grid density selection widgets using given value. */
  selectGridDensity(density: DesignGridDensity): void {
    if (density !== DesignGridDensity.ERROR) {
      this.eventBrokerService.gridDensitySelection.next({ origin: EventOrigin.DRAFTING_PANEL, data: density });
    }
  }

  /** Stops edit keys from bubbling up to the global handler while focus on title block. */
  handleTitleBlockKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
  }

  ngAfterViewInit(): void {
    new ResizeObserver(() => this.handleResize()).observe(this.wrapper.nativeElement);
    this.eventBrokerService.deleteSelectionRequest.subscribe(_eventInfo => this.deleteSelectionRequestHandler());
    this.eventBrokerService.draftingPanelInvalidation.subscribe(_eventInfo => this.render());
    this.eventBrokerService.gridDensitySelection.subscribe(eventInfo => this.selectGridDensityHandler(eventInfo.data));
    this.eventBrokerService.loadBridgeRequest.subscribe(eventInfo =>
      this.loadBridge(eventInfo.data.bridge, eventInfo.data.draftingPanelState),
    );
    this.eventBrokerService.loadSketchRequest.subscribe(eventInfo => this.loadSketch(eventInfo.data));
    this.eventBrokerService.selectedElementsChange.subscribe(_eventInfo => this.render());
    this.eventBrokerService.titleBlockToggle.subscribe(eventInfo => {
      this.titleBlock.nativeElement.style.display = eventInfo.data ? '' : 'none';
    });
    this.eventBrokerService.editCommandCompletion.subscribe(_eventInfo => this.render());
    this.handleResize();
  }
}
