import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ButtonTag, ConfirmationDialogComponent } from "../../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'allow-fresh-start-dialog',
  imports: [ConfirmationDialogComponent],
  templateUrl: './allow-fresh-start-dialog.component.html',
  styleUrl: './allow-fresh-start-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowFreshStartDialogComponent { 
  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  constructor(private readonly eventBrokerService: EventBrokerService) {}
  
  public open(): void {
    this.dialog.open();
  }
  
  handleButtonClick(button: ButtonTag) {
    if (button === 'no') {
      window.location.replace('?reset');
    } else {
      this.eventBrokerService.tipRequest.next({origin: EventOrigin.APP, data: 'restart'})
    }
  }
}
