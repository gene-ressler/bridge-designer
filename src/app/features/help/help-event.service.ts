import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HelpEventService {
  public readonly goToTopicRequest = new Subject<string>();
}
