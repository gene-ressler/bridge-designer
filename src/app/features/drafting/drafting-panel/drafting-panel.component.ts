import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { jqxNotificationComponent, jqxNotificationModule } from 'jqwidgets-ng/jqxnotification';
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
import { SelectedElementsService } from '../services/selected-elements-service';
import { UndoManagerService } from '../services/undo-manager.service';
import { ToolSelectorComponent } from '../../controls/tool-selector/tool-selector.component';
import { DesignGridDensity, DesignGridService } from '../../../shared/services/design-grid.service';
import { MoveJointCommand } from '../../controls/edit-command/move-joint.command';
import { BridgeSketchModel } from '../../../shared/classes/bridge-sketch.model';
import { GuidesService } from '../../guides/guides.service';

@Component({
  selector: 'drafting-panel',
  standalone: true,
  templateUrl: './drafting-panel.component.html',
  styleUrl: './drafting-panel.component.scss',
  imports: [jqxNotificationModule, CursorOverlayComponent, FormsModule, ToolSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftingPanelComponent implements AfterViewInit {
  width: number = screen.availWidth;
  height: number = screen.availHeight;
  @ViewChild('wrapper') wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('draftingPanel') draftingPanel!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorLayer') cursorLayer!: ElementRef<CursorOverlayComponent>;
  @ViewChild('titleBlock') titleBlock!: ElementRef<HTMLDivElement>;
  @ViewChild('moveJointError') moveJointError!: jqxNotificationComponent;

  constructor(
    readonly bridgeService: BridgeService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly designGridService: DesignGridService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly guideService: GuidesService,
    private readonly selectedElementsService: SelectedElementsService,
    private readonly undoManagerService: UndoManagerService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {}

  private get ctx(): CanvasRenderingContext2D {
    return Graphics.getContext(this.draftingPanel);
  }

  handleResize(): void {
    const parent = this.draftingPanel.nativeElement.parentElement;
    if (!parent) {
      throw new Error('missing parent in setViewport');
    }
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    this.eventBrokerService.draftingPanelInvalidation.next({ origin: EventOrigin.DRAFTING_PANEL, data: 'viewport' });
  }

  render(showGuides: boolean = true): void {
    this.designRenderingService.render(this.ctx);
    if (showGuides) {
      this.guideService.show(this.ctx);
    }
  }

  loadBridge(bridge: BridgeModel): void {
    const bridgeGridDensity = DesignGridService.getDensityOfWorldPoints(bridge.joints);
    this.selectGridDensity(bridgeGridDensity);
    this.bridgeService.bridge = bridge;
    this.handleResize();
    this.changeDetector.detectChanges(); // Updates title block.
    this.eventBrokerService.loadBridgeCompletion.next({ origin: EventOrigin.DRAFTING_PANEL });
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
    this.undoManagerService.do(
      new AddJointCommand(joint, this.bridgeService.bridge, this.selectedElementsService.selectedElements),
    );
  }

  addMemberRequestHandler(member: Member): void {
    this.undoManagerService.do(
      new AddMemberCommand(member, this.bridgeService.bridge, this.selectedElementsService.selectedElements),
    );
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
    const bridge = this.bridgeService.bridge;
    const selectedElements = this.selectedElementsService.selectedElements;
    const joint = this.selectedElementsService.getSelectedJoint(bridge);
    const command: EditCommand = joint
      ? new DeleteJointCommand(joint, bridge, selectedElements)
      : DeleteMembersCommand.forSelectedMembers(selectedElements, this.bridgeService);
    this.undoManagerService.do(command);
  }

  /** Handles reports from cursor overlay at start and end of guides cursor movement. */
  guidesCursorActiveHandler(isActive: boolean) {
    this.render(!isActive);
  }

  moveJointRequestHandler({ joint, newLocation }: { joint: Joint; newLocation: Point2D }): void {
    if (Geometry.areColocated2D(newLocation, joint)) {
      return;
    }
    const bridge = this.bridgeService.bridge;
    if (this.bridgeService.findJointAt(newLocation)) {
      this.moveJointError.open();
      return;
    }
    const selectedElements = this.selectedElementsService.selectedElements;
    const command = new MoveJointCommand(joint, newLocation, bridge, selectedElements);
    this.undoManagerService.do(command);
  }

  // IMPORTANT: Following 2 methods rely on the coincidence that selector indices are the same as density enum values.

  /** Sets the design grid density from the selection widget (menu or button) index. */
  selectGridDensityHandler(selectorIndex: number) {
    if (DesignGridDensity.COARSE <= selectorIndex && selectorIndex <= DesignGridDensity.FINE && selectorIndex != this.designGridService.grid.density) {
      this.designGridService.grid.density = selectorIndex;
      this.eventBrokerService.gridDensityChange.next({origin: EventOrigin.DRAFTING_PANEL});
    }
  }

  /** Sets all grid density selection widgets using given value. */
  selectGridDensity(density: DesignGridDensity): void {
    if (density !== DesignGridDensity.ERROR) {
      this.eventBrokerService.gridDensitySelection.next({ origin: EventOrigin.DRAFTING_PANEL, data: density });
    }
  }

  ngAfterViewInit(): void {
    new ResizeObserver(() => this.handleResize()).observe(this.wrapper.nativeElement);
    this.eventBrokerService.deleteSelectionRequest.subscribe(_info => this.deleteSelectionRequestHandler());
    this.eventBrokerService.draftingPanelInvalidation.subscribe(_info => this.render());
    this.eventBrokerService.gridDensitySelection.subscribe(info => this.selectGridDensityHandler(info.data));
    this.eventBrokerService.loadBridgeRequest.subscribe(info => this.loadBridge(info.data));
    this.eventBrokerService.loadSketchRequest.subscribe(info => this.loadSketch(info.data));
    this.eventBrokerService.selectedElementsChange.subscribe(_info => this.render());
    this.eventBrokerService.titleBlockToggle.subscribe(
      info => (this.titleBlock.nativeElement.style.display = info.data ? '' : 'none'),
    );
    this.eventBrokerService.editCommandCompletion.subscribe(_info => this.render());
    this.handleResize();
  }
}
