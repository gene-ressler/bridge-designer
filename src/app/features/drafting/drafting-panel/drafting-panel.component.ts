import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  numberAttribute,
  ViewChild,
} from '@angular/core';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { EditCommand } from '../../../shared/classes/editing';
import { Graphics } from '../../../shared/classes/graphics';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { DesignRenderingService } from '../../../shared/services/design-rendering.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { AddJointCommand } from '../../controls/edit-commands/add-joint-command';
import { AddMemberCommand } from '../../controls/edit-commands/add-member-command';
import { DeleteJointCommand } from '../../controls/edit-commands/delete-joint-command';
import { DeleteMembersCommand } from '../../controls/edit-commands/delete-members-command';
import { CursorOverlayComponent } from '../cursor-overlay/cursor-overlay.component';
import { SelectedElementsService } from '../services/selected-elements-service';
import { UndoManagerService } from '../services/undo-manager.service';

@Component({
  selector: 'drafting-panel',
  standalone: true,
  templateUrl: './drafting-panel.component.html',
  styleUrl: './drafting-panel.component.scss',
  imports: [CursorOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftingPanelComponent implements AfterViewInit {
  @Input({ transform: numberAttribute }) width: number = screen.availWidth;
  @Input({ transform: numberAttribute }) height: number = screen.availHeight;
  @ViewChild('draftingPanel') draftingPanel!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cursorLayer') cursorLayer!: ElementRef<CursorOverlayComponent>;

  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly designRenderingService: DesignRenderingService,
    private readonly viewportTransform: ViewportTransform2D,
    private readonly eventBrokerService: EventBrokerService,
    private readonly undoManagerService: UndoManagerService,
    private readonly selectedElementsService: SelectedElementsService,
  ) {}

  handleResize(reset: boolean = false): void {
    const parent = this.draftingPanel.nativeElement.parentElement;
    if (!parent) {
      throw new Error('missing parent in setViewport');
    }
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.viewportTransform.setWindow(this.designBridgeService.siteInfo.drawingWindow);
    this.render();
  }

  render(): void {
    this.designRenderingService.render(Graphics.getContext(this.draftingPanel));
  }

  loadBridge(bridge: BridgeModel): void {
    this.designBridgeService.bridge = bridge;
    this.handleResize();
  }

  addJointRequestHandler(joint: Joint) {
    this.undoManagerService.do(
      new AddJointCommand(joint, this.designBridgeService.bridge, this.selectedElementsService.selectedElements),
    );
  }

  addMemberRequestHandler(member: Member) {
    this.undoManagerService.do(
      new AddMemberCommand(member, this.designBridgeService.bridge, this.selectedElementsService.selectedElements),
    );
  }

  deleteRequestHandler(element: Joint | Member) {
    const selectedElements = this.selectedElementsService.selectedElements;
    const command: EditCommand =
      element instanceof Joint
        ? new DeleteJointCommand(element, this.designBridgeService.bridge, selectedElements)
        : DeleteMembersCommand.forMember(element, this.designBridgeService.bridge, selectedElements);
    this.undoManagerService.do(command);
  }

  ngAfterViewInit(): void {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    this.eventBrokerService.loadBridgeRequest.subscribe(info => this.loadBridge(info.data));
    this.eventBrokerService.undoManagerStateChange.subscribe(_info => this.render());
    this.eventBrokerService.selectedElementsChange.subscribe(_info => this.render());
  }
}
