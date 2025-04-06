import { AfterViewInit, ChangeDetectionStrategy, Component, QueryList, ViewChildren } from '@angular/core';
import { jqxNotificationComponent, jqxNotificationModule } from 'jqwidgets-ng/jqxnotification';
import { ToastErrorKind } from './toast-error';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [jqxNotificationModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements AfterViewInit {
  @ViewChildren(jqxNotificationComponent) notifications!: QueryList<jqxNotificationComponent>;

  constructor(private readonly eventBrokerService: EventBrokerService) {}

  public show(kind: ToastErrorKind): void {
    Utility.assertNotUndefined(this.notifications.find(item => item.elementRef.nativeElement.id === kind), kind).open();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.toastRequest.subscribe(eventInfo => this.show(eventInfo.data));
  }
}
