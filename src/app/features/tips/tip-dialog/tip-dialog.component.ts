/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { jqxCheckBoxModule, jqxCheckBoxComponent } from 'jqwidgets-ng/jqxcheckbox';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { SessionStateService } from '../../session-state/session-state.service';

export type TipDialogKind = 'startup' | 'restart' | 'user';

@Component({
    selector: 'tip-dialog',
    imports: [jqxCheckBoxModule, jqxWindowModule, jqxButtonModule],
    templateUrl: './tip-dialog.component.html',
    styleUrl: './tip-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TipDialogComponent implements AfterViewInit {
  @Output() readonly onClose = new EventEmitter<TipDialogKind>();

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('tips') tips!: ElementRef<HTMLSpanElement>;
  @ViewChild('showAtStartupCheckbox') showAtStartupCheckbox!: jqxCheckBoxComponent;

  private kind: TipDialogKind = 'user';
  private tipCount: number = 0;
  tipIndex: number = 0;
  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
  ) {}

  bumpTip(increment: 1 | -1): void {
    this.setTip(this.tipIndex + increment);
  }

  /** Tell our parent that we're done. */
  handleDialogClose(): void {
    this.bumpTip(1); // Next time user gets next tip.
    this.onClose.emit(this.kind);
  }

  /** Sets current tip to one with given index, which is wrapped into the valid range. */
  private setTip(index: number): void {
    while (index >= this.tipCount) {
      index -= this.tipCount;
    }
    while (index < 0) {
      index += this.tipCount;
    }
    for (let i = 0; i < this.tipCount; ++i) {
      const tip = this.tips.nativeElement.children.item(i) as HTMLSpanElement;
      tip.style.display = i === index ? '' : 'none';
    }
    this.tipIndex = index;
  }

  ngAfterViewInit(): void {
    this.tipCount = this.tips.nativeElement.childElementCount;
    this.eventBrokerService.tipRequest.subscribe(eventInfo => {
      this.kind = eventInfo.data;
      if (!this.showAtStartupCheckbox.checked()) {
        this.onClose.emit(this.kind); // Simulate tip dialog that didn't happen.
      } else {
        this.dialog.open();
      }
    });
    this.sessionStateService.register(
      'tip.dialog',
      () => this.dehydrate(),
      state => this.rehydrate(state),
      true /* essential */,
    );
    this.setTip(this.tipIndex);
  }

  private dehydrate(): State {
    return {
      showOnStartup: this.showAtStartupCheckbox.checked() !== false,
      tipIndex: this.tipIndex,
    };
  }

  private rehydrate(state: State): void {
    this.showAtStartupCheckbox.checked(state.showOnStartup);
    this.setTip(state.tipIndex);
  }
}

type State = {
  showOnStartup: boolean;
  tipIndex: number;
};
