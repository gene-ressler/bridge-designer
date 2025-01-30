import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxTabsComponent, jqxTabsModule } from 'jqwidgets-ng/jqxtabs';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { UnstableBridgeExampleComponent } from '../unstable-bridge-example/unstable-bridge-example.component';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'unstable-bridge-dialog',
  standalone: true,
  imports: [jqxButtonModule, jqxTabsModule, jqxWindowModule, UnstableBridgeExampleComponent],
  templateUrl: './unstable-bridge-dialog.component.html',
  styleUrl: './unstable-bridge-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnstableBridgeDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('exampleTabs') exampleTabs!: jqxTabsComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  ngAfterViewInit(): void {
    this.eventBrokerService.unstableBridgeDialogOpenRequest.subscribe(_eventInfo => {
      this.dialog.open();
      this.exampleTabs.host.jqxTabs('render');
    });
  }
}
