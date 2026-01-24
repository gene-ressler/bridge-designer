/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  numberAttribute,
  Output,
  ViewChild,
} from '@angular/core';
import { Joint } from '../../../shared/classes/joint.model';
import { Member } from '../../../shared/classes/member.model';
import { EventBrokerService, EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { HotElementService } from '../shared/hot-element.service';
import { JointCursorService } from '../shared/joint-cursor.service';
import { InputEventDelegator } from './input-handler';
import { MembersModeService } from './members-mode.service';
import { JointsModeService } from './joints-mode.service';
import { SelectModeService } from './select-mode.service';
import { EraseModeService } from './erase-mode.service';
import { Graphics, Point2D } from '../../../shared/classes/graphics';
import { StandardCursor } from '../../../shared/classes/widget-helper';
import { Draggable, HotElementDragService } from '../shared/hot-element-drag.service';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ContextWidgetService } from './context-widget.service';

/** Indexes of cursor mode controls. Must mirror order of select widgets in UI. */
export const enum CursorMode {
  JOINTS,
  MEMBERS,
  SELECT,
  ERASE,
}

/** Transparent canvas overlay for the drawing panel, which displays cursors and handles clicks. */
@Component({
  selector: 'cursor-overlay',
  templateUrl: './cursor-overlay.component.html',
  styleUrl: './cursor-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContextMenuComponent],
})
export class CursorOverlayComponent implements AfterViewInit {
  @Input({ transform: numberAttribute }) width: number = screen.availWidth;
  @Input({ transform: numberAttribute }) height: number = screen.availHeight;

  @Output() addJointRequest = new EventEmitter<Joint>();
  @Output() addMemberRequest = new EventEmitter<Member>();
  @Output() deleteRequest = new EventEmitter<Joint | Member>();
  @Output() dragCursorActive = new EventEmitter<Draggable | undefined>();
  @Output() moveJointRequest = new EventEmitter<{ joint: Joint; newLocation: Point2D }>();

  @ViewChild('cursorLayer') cursorLayer!: ElementRef<HTMLCanvasElement>;
  @ViewChild('contextMenu') contextMenu!: ContextMenuComponent;

  private readonly dragInputEventDelegator: InputEventDelegator = new InputEventDelegator();
  private readonly modalInputEventDelegator: InputEventDelegator = new InputEventDelegator();

  constructor(
    private readonly contextWidgetService: ContextWidgetService,
    private readonly eraseModeService: EraseModeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly hotElementDragService: HotElementDragService,
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
    return Graphics.getContext(this.cursorLayer);
  }

  /** Sets up and initializes selection state and cursors for placing joints. */
  public setJointsMode(): void {
    this.eventBrokerService.selectNoneRequest.next({ origin: EventOrigin.CURSOR_OVERLAY });
    this.hotElementService.clearRenderedHotElement(this.ctx);
    this.modalInputEventDelegator.handlerSet = this.jointsModeService.initialize(this.ctx, this.addJointRequest);
    this.hotElementService.defaultCursor = StandardCursor.CROSSHAIR;
  }

  /** Sets up and initializes selection state and cursors for placing members. */
  public setMembersMode(): void {
    this.eventBrokerService.selectNoneRequest.next({ origin: EventOrigin.CURSOR_OVERLAY });
    this.jointCursorService.clear(this.ctx);
    this.modalInputEventDelegator.handlerSet = this.membersModeService.initialize(this.ctx, this.addMemberRequest);
    this.hotElementService.defaultCursor = { cursor: 'img/pencil.svg', orgX: 0, orgY: 31 };
  }

  /** Sets up and initializes selection state and cursors for selecting joints and members. */
  public setSelectMode(): void {
    this.jointCursorService.clear(this.ctx);
    this.modalInputEventDelegator.handlerSet = this.selectModeService.initialize(this.ctx, this.moveJointRequest);
    this.hotElementService.defaultCursor = StandardCursor.ARROW;
  }

  /** Sets up and initializes selection state and cursors for erasing joints and members. */
  public setEraseMode(): void {
    this.eventBrokerService.selectNoneRequest.next({ origin: EventOrigin.CURSOR_OVERLAY });
    this.jointCursorService.clear(this.ctx);
    this.modalInputEventDelegator.handlerSet = this.eraseModeService.initialize(this.ctx, this.deleteRequest);
    this.hotElementService.defaultCursor = { cursor: 'img/pencilud.svg', orgX: 2, orgY: 33 };
  }

  /** Translates UI selector element (menu and toolbar buttons) index to respective mode. */
  private setCursorModeByControlSelectedIndex(i: number | undefined) {
    switch (i) {
      case CursorMode.JOINTS:
        this.setJointsMode();
        break;
      case CursorMode.MEMBERS:
        this.setMembersMode();
        break;
      case CursorMode.SELECT:
        this.setSelectMode();
        break;
      case CursorMode.ERASE:
        this.setEraseMode();
        break;
    }
    if (i !== undefined) {
      this.eventBrokerService.editModeChange.next({ origin: EventOrigin.CURSOR_OVERLAY, data: i });
    }
  }

  /** Grabs key focus for joint moves via arrow keys. */
  @HostListener('pointerdown')
  pointerDownListener(): void {
    this.canvas.focus();
  }

  ngAfterViewInit(): void {
    const cursorLayer = this.cursorLayer.nativeElement;
    this.contextWidgetService.listenForContextMenuClicks(
      this.contextMenu,
      cursorLayer,
      cursorLayer.parentElement!.parentElement as HTMLElement,
    );
    // IMPORTANT: Order of delegator registration determines listener invocation order.
    this.dragInputEventDelegator.register(this.canvas);
    this.modalInputEventDelegator.register(this.canvas);
    this.dragInputEventDelegator.handlerSet = this.hotElementDragService.initialize(this.ctx, this.dragCursorActive);
    this.setJointsMode();
    this.eventBrokerService.editModeSelection.subscribe((eventInfo: EventInfo) =>
      this.setCursorModeByControlSelectedIndex(eventInfo.data),
    );
    // Clear the hot element prior to viewport changes, since this makes the cursor layer invalid.
    this.eventBrokerService.draftingViewportPendingChange.subscribe(_eventInfo =>
      this.hotElementService.clearRenderedHotElement(this.ctx),
    );
  }
}
