import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'slenderness-fail-dialog',
  standalone: true,
  imports: [jqxButtonModule, jqxWindowModule],
  templateUrl: './slenderness-fail-dialog.component.html',
  styleUrl: './slenderness-fail-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlendernessFailDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('textBox') textBox!: ElementRef<HTMLDivElement>;

  partCount: number = 0;
  partIndex: number = 0;
  get exampleImgSrc(): string {
    return `img/ex5pt${this.partIndex + 1}.gif`;
  }

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  bumpPart(increment: 1 | -1) {
    let partIndex = this.partIndex + increment;
    if (partIndex >= this.partCount) {
      partIndex -= this.partCount;
    }
    if (partIndex < 0) {
      partIndex += this.partCount;
    }
    this.selectPart(partIndex);
  }

  private selectPart(partIndex: number): void {
    for (let i = 0; i < this.partCount; ++i) {
      const card = this.textBox.nativeElement.children.item(i) as HTMLDivElement;
      card.style.display = i === partIndex ? 'block' : 'none';
    }
    this.partIndex = partIndex;
  }

  showSlendernessHelp(): void {
    this.eventBrokerService.helpRequest.next({ origin: EventOrigin.SLENDERNESS_FAIL_DIALOG, data: 'hlp_slenderness' });
  }

  ngAfterViewInit(): void {
    this.partCount = this.textBox.nativeElement.childElementCount;
    this.selectPart(0);
    this.eventBrokerService.slendernessFailDialogOpenRequest.subscribe(_eventInfo => this.dialog.open());
  }
}
