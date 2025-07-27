import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxSliderModule } from 'jqwidgets-ng/jqxslider';

@Component({
  selector: 'fly-thru-settings-dialog',
  imports: [jqxButtonModule, jqxSliderModule, jqxWindowModule, jqxExpanderModule],
  templateUrl: './fly-thru-settings-dialog.component.html',
  styleUrl: './fly-thru-settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlyThruSettingsDialogComponent {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  constructor(_eventBrokerService: EventBrokerService) {}
}
