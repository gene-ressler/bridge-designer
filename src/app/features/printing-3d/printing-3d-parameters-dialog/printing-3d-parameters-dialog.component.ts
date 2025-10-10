import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxNumberInputComponent, jqxNumberInputModule } from 'jqwidgets-ng/jqxnumberinput';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'printing-3d-parameters-dialog',
  imports: [jqxWindowModule, jqxButtonModule, jqxNumberInputModule],
  templateUrl: './printing-3d-parameters-dialog.component.html',
  styleUrl: './printing-3d-parameters-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Printing3dParametersDialogComponent {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('bedSizeInput') bedSizeInput!: jqxNumberInputComponent;
  @ViewChild('minFeatureSizeInput') minFeatureSizeInput!: jqxNumberInputComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {}
}
