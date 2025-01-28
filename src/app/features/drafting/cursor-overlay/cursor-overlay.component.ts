import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  numberAttribute,
  Output,
  ViewChild,
} from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { EventBrokerService, EventInfo } from '../../../shared/services/event-broker.service';
import { HotElementService } from '../services/hot-element.service';
import { JointCursorService } from '../services/joint-cursor.service';
import { InputEventDelegator } from './input-handler';
import { MembersModeService } from './members-mode.service';
import { JointsModeService } from './joints-mode.service';
import { SelectModeService } from './select-mode.service';
import { EraseModeService } from './erase-mode.service';
import { Point2D } from '../../../shared/classes/graphics';
import { StandardCursor, WidgetHelper } from '../../../shared/classes/widget-helper';
import { HotElementDragService } from '../services/hot-element-drag.service';

@Component({
  selector: 'cursor-overlay',
  standalone: true,
  templateUrl: './cursor-overlay.component.html',
  styleUrl: './cursor-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursorOverlayComponent implements AfterViewInit {
  @Input({ transform: numberAttribute }) width: number = screen.availWidth;
  @Input({ transform: numberAttribute }) height: number = screen.availHeight;

  @Output() addJointRequest = new EventEmitter<Joint>();
  @Output() addMemberRequest = new EventEmitter<Member>();
  @Output() deleteRequest = new EventEmitter<Joint | Member>();
  @Output() guidesCursorActive = new EventEmitter<boolean>();
  @Output() moveJointRequest = new EventEmitter<{ joint: Joint; newLocation: Point2D }>();

  @ViewChild('cursorLayer') cursorLayer!: ElementRef<HTMLCanvasElement>;

  private readonly dragInputEventDelegator: InputEventDelegator = new InputEventDelegator();
  private readonly modalInputEventDelegator: InputEventDelegator = new InputEventDelegator();

  constructor(
    private readonly eraseModeService: EraseModeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly hotElementDragService: HotElementDragService,
    private readonly hotElementService: HotElementService,
    private readonly jointsModeService: JointsModeService,
    private readonly membersModeService: MembersModeService,
    private readonly jointCursorService: JointCursorService,
    private readonly selectModeService: SelectModeService,
  ) {
  }

  get canvas(): HTMLCanvasElement {
    return this.cursorLayer.nativeElement;
  }

  get ctx(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext('2d');
    if (ctx == null) {
      throw new Error('Get canvas 2d context failed');
    }
    return ctx;
  }

  public setJointsMode(): void {
    this.hotElementService.clearRenderedHotElement(this.ctx);
    WidgetHelper.setPointerCursor(this.ctx, StandardCursor.CROSSHAIR);
    this.modalInputEventDelegator.handlerSet = this.jointsModeService.initialize(
      this.ctx,
      this.addJointRequest,
    );
  }

  public setMembersMode(): void {
    this.jointCursorService.clear(this.ctx);
    WidgetHelper.setPointerCursor(this.ctx, 'img/pencil.svg', 0, 31);
    this.modalInputEventDelegator.handlerSet = this.membersModeService.initialize(
      this.ctx,
      this.addMemberRequest,
    );
  }

  public setSelectMode(): void {
    this.jointCursorService.clear(this.ctx);
    WidgetHelper.setPointerCursor(this.ctx, StandardCursor.ARROW);
    this.modalInputEventDelegator.handlerSet = this.selectModeService.initialize(
      this.ctx,
      this.moveJointRequest,
    );
  }

  public setEraseMode(): void {
    this.jointCursorService.clear(this.ctx);
    WidgetHelper.setPointerCursor(this.ctx, 'img/pencilud.svg', 2, 33);
    this.modalInputEventDelegator.handlerSet = this.eraseModeService.initialize(
      this.ctx,
      this.deleteRequest,
    );
  }

  private setCursorModeByControlSelectedIndex(i: number | undefined) {
    switch (i) {
      case 0:
        this.setJointsMode();
        break;
      case 1:
        this.setMembersMode();
        break;
      case 2:
        this.setSelectMode();
        break;
      case 3:
        this.setEraseMode();
        break;
    }
  }

  ngAfterViewInit(): void {
    // IMPORTANT: Order of delegator registration determines listener invocation order.
    this.dragInputEventDelegator.register(this.canvas);
    this.modalInputEventDelegator.register(this.canvas);
    this.dragInputEventDelegator.handlerSet = this.hotElementDragService.initialize(this.ctx, this.guidesCursorActive);
    this.setJointsMode();
    this.eventBrokerService.editModeSelection.subscribe((eventInfo: EventInfo) =>
      this.setCursorModeByControlSelectedIndex(eventInfo.data),
    );
  }
}
