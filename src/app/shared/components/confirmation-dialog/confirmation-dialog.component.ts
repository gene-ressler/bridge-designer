/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import {
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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Utility } from '../../classes/utility';
import { EventBrokerService, EventOrigin } from '../../services/event-broker.service';

export type ButtonTag = 'ok' | 'yes' | 'no' | 'cancel' | 'help';

@Component({
  selector: 'confirmation-dialog',
  imports: [CommonModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent implements OnChanges {
  @Input() buttons: ButtonTag[] = ['ok', 'yes', 'no', 'cancel', 'help'];
  @Input() buttonWidth = 64;
  @Input() contentHtml: string = 'Confirm by clicking.';
  @Input() headerHtml: string = 'Confirmation';
  @Input() helpTopic: string = 'hlp_how_to';
  sanitizedContentHtml!: SafeHtml;
  sanitizedHeaderHtml!: SafeHtml;
  @Output() readonly onButtonClick = new EventEmitter<ButtonTag>();

  @ViewChild('dialog') dialog!: jqxWindowComponent;

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  public open(): void {
    this.dialog.open();
  }

  handleButtonClick(tag: ButtonTag) {
    if (tag === 'help') {
      this.eventBrokerService.helpRequest.next({
        origin: EventOrigin.CONFIRMATION_DIALOG,
        data: { topic: this.helpTopic },
      });
    } else {
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
}
