/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SecurityContext,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxCheckBoxComponent, jqxCheckBoxModule } from 'jqwidgets-ng/jqxcheckbox';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Utility } from '../../classes/utility';
import { EventBrokerService, EventOrigin } from '../../services/event-broker.service';
import { SessionStateService } from '../../../features/session-state/session-state.service';

export type ButtonTag = 'ok' | 'yes' | 'no' | 'cancel' | 'help';

@Component({
  selector: 'confirmation-dialog',
  imports: [CommonModule, jqxCheckBoxModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent implements AfterViewInit, OnChanges {
  @Input() buttons: ButtonTag[] = ['ok', 'yes', 'no', 'cancel', 'help'];
  @Input() buttonWidth = 64;
  @Input() contentHtml: string = '';
  @Input() headerHtml: string = '';
  @Input() helpTopic: string = 'hlp_how_to';
  @Input() rememberKey: string = '';
  sanitizedContentHtml!: SafeHtml;
  sanitizedHeaderHtml!: SafeHtml;
  @Output() readonly onButtonClick = new EventEmitter<ButtonTag>();

  @ViewChild('rememberCheckbox') rememberCheckbox!: jqxCheckBoxComponent;
  @ViewChild('dialog') dialog!: jqxWindowComponent;

  private rememberedButtonTag: ButtonTag | undefined;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly sanitizer: DomSanitizer,
    private readonly sessionStateService: SessionStateService,
  ) {}

  public open(): void {
    if (this.rememberedButtonTag) {
      // Simulate a click of remembered button press.
      this.onButtonClick.emit(this.rememberedButtonTag);
    } else {
      this.dialog.open();
    }
  }

  handleButtonClick(tag: ButtonTag) {
    if (tag === 'help') {
      this.eventBrokerService.helpRequest.next({
        origin: EventOrigin.CONFIRMATION_DIALOG,
        data: { topic: this.helpTopic },
      });
    } else {
      if (this.rememberCheckbox?.checked()) {
        this.rememberedButtonTag = tag;
      }
      this.dialog.close();
      this.onButtonClick.emit(tag);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentHtml']) {
      const html = this.sanitizer.sanitize(SecurityContext.HTML, this.contentHtml);
      this.sanitizedContentHtml = Utility.assertNotNull(html);
    }
    if (changes['headerHtml']) {
      const html = this.sanitizer.sanitize(SecurityContext.HTML, this.headerHtml);
      this.sanitizedHeaderHtml = Utility.assertNotNull(html);
    }
  }

  ngAfterViewInit(): void {
    if (this.rememberKey) {
      this.sessionStateService.register(
        this.rememberKey,
        () => this.dehydrate(),
        state => this.rehydrate(state),
        true /* essential */,
      );
    }
  }

  private dehydrate(): State {
    return {
      rememberedButtonTag: this.rememberedButtonTag,
    };
  }

  private rehydrate(state: State): void {
    this.rememberedButtonTag = state.rememberedButtonTag;
  }
}

type State = {
  rememberedButtonTag?: ButtonTag;
};
