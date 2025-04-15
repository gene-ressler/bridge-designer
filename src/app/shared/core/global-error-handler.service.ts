import { ErrorHandler, Injectable } from '@angular/core';
import { ToastError } from '../../features/toast/toast/toast-error';
import { EventBrokerService, EventOrigin } from '../services/event-broker.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(private readonly eventBrokerService: EventBrokerService) { }

  handleError(error: any): void {
    if (error instanceof ToastError) {
      if (error.kind != 'noError') {
        this.eventBrokerService.toastRequest.next({origin: EventOrigin.SERVICE, data: error.kind});
      }
    } else {
      console.log(error);
    }
  }
}
