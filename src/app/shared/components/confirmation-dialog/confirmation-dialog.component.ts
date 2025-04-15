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

export type ButtonTag = 'ok' | 'yes' | 'no' | 'cancel';

@Component({
  selector: 'confirmation-dialog',
  imports: [CommonModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent implements OnChanges {
  @Input() buttons: ButtonTag[] = ['ok', 'yes', 'no', 'cancel'];
  @Input() buttonWidth = 64;
  @Input() contentHtml: string = 'Confirm by clicking OK.';
  @Input() headerHtml: string = 'Confirmation';
  sanitizedContentHtml!: SafeHtml;
  sanitizedHeaderHtml!: SafeHtml;
  @Output() readonly onButtonClick = new EventEmitter<ButtonTag>();

  @ViewChild('dialog') dialog!: jqxWindowComponent;

  constructor(private readonly sanitizer: DomSanitizer) {}

  public open(): void {
    this.dialog.open();
  }

  handleButtonClick(tag: ButtonTag) {
    this.dialog.close();
    this.onButtonClick.emit(tag);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const contentChange = changes['contentHtml'];
    if (contentChange) {
      const html = this.sanitizer.sanitize(SecurityContext.HTML, this.contentHtml);
      this.sanitizedContentHtml = Utility.assertNotNull(html);
    }
    const headerChange = changes['headerHtml'];
    if (headerChange) {
      const html = this.sanitizer.sanitize(SecurityContext.HTML, this.headerHtml);
      this.sanitizedHeaderHtml = Utility.assertNotNull(html);
    }
  }
}
