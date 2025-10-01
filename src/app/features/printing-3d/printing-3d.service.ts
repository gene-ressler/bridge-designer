import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../shared/services/event-broker.service';

@Injectable({ providedIn: 'root'})
export class Printing3dService {

  constructor(eventBrokerService: EventBrokerService) { 
    eventBrokerService.print3dRequest.subscribe(() => alert("We're still working on 3d printing. Stay tuned!"));
  }
}
