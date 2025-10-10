import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { VERSION } from '../../../shared/classes/version';

@Component({
  selector: 'about-dialog',
  imports: [jqxWindowModule, jqxButtonModule],
  templateUrl: './about-dialog.component.html',
  styleUrl: './about-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;

  version: string = VERSION.toString();

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  handlePurposeButtonClick(): void {
    const data = { topic: 'hlp_purposes' };
    this.eventBrokerService.helpRequest.next({ origin: EventOrigin.ABOUT_DIALOG, data });
  }

  handleHowItWorksButtonClick() {
    const data = { topic: 'hlp_how_wpbd_works' };
    this.eventBrokerService.helpRequest.next({ origin: EventOrigin.ABOUT_DIALOG, data });
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.aboutRequest.subscribe(() => this.dialog.open());
  }
}
