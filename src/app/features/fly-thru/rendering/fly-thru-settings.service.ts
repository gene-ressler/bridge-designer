import { Injectable } from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

export type FlyThruSettings = {
  brightness?: number;
  speed?: number;
  noAbutments?: boolean;
  noExaggeration?: boolean;
  noMemberColors?: boolean;
  noShadows?: boolean;
  noSky?: boolean;
  noTerrain?: boolean;
  noTruck?: boolean;
  noWindTurbine?: boolean;
};

/** Holder for fly-thru settings for injection into all using services and componets. */
@Injectable({ providedIn: 'root' })
export class FlyThruSettingsService {
  public readonly settings: FlyThruSettings = { brightness: 100, speed: 30 };

  constructor(eventBrokerService: EventBrokerService) {
    eventBrokerService.flyThruSettingsChange.subscribe(eventInfo => {
      Object.assign(this.settings, eventInfo.data);
    });
  }
}
