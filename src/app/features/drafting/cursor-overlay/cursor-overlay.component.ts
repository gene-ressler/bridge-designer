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

const enum StandardCursor {
  ARROW = 'default',
  AUTO = 'auto',
  HAND = 'pointer',
  HORIZONTAL_MOVE = 'ew-resize',
  MOVE = 'move',
  VERTICAL_MOVE = 'ns-resize',
}

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

  @ViewChild('cursorLayer') cursorLayer!: ElementRef<HTMLCanvasElement>;

  private readonly inputEventDelegator: InputEventDelegator = new InputEventDelegator();

  constructor(
    private readonly eraseModeService: EraseModeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly hotElementService: HotElementService,
    private readonly jointsModeService: JointsModeService,
    private readonly membersModeService: MembersModeService,
    private readonly jointCursorService: JointCursorService,
    private readonly selectModeService: SelectModeService,
  ) {}

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
    this.setMouseCursor();
    this.inputEventDelegator.handlerSet = this.jointsModeService.initialize(this.ctx, this.addJointRequest);
  }

  public setMembersMode(): void {
    this.jointCursorService.clear(this.ctx);
    this.setMouseCursor('img/pencil.png', 0, 31);
    this.inputEventDelegator.handlerSet = this.membersModeService.initialize(this.ctx, this.addMemberRequest);
  }

  public setSelectMode(): void {
    this.jointCursorService.clear(this.ctx);
    this.setMouseCursor(StandardCursor.ARROW);
    this.inputEventDelegator.handlerSet = this.selectModeService.initialize(this.ctx);
  }

  public setEraseMode(): void {
    this.jointCursorService.clear(this.ctx);
    this.setMouseCursor('img/pencilud.png', 2, 29);
    this.inputEventDelegator.handlerSet = this.eraseModeService.initialize(this.ctx, this.deleteRequest);
  }

  setMouseCursor(cursor?: string | StandardCursor, orgX: number = 0, orgY: number = 0): void {
    if (cursor === undefined) {
      this.ctx.canvas.style.cursor = 'none';
      return;
    }
    this.ctx.canvas.style.cursor = cursor.startsWith('img/') ? `url(${cursor}) ${orgX} ${orgY}, auto` : cursor;
  }

  private setCursorModeByControlSelectedIndex(i: number) {
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
    this.inputEventDelegator.register(this.canvas);
    this.setJointsMode();
    this.eventBrokerService.editModeSelection.subscribe((eventInfo: EventInfo) =>
      this.setCursorModeByControlSelectedIndex(eventInfo.data as number),
    );
  }
}
