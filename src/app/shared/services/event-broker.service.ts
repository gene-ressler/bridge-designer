import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export const enum EventOrigin {
  DRAFTING_PANEL,
  MENU,
  SAMPLE_DIALOG,
  SERVICE,
  TOOLBAR,
}

export type EventInfo = { source: EventOrigin; data?: any };

@Injectable({ providedIn: 'root' })
export class EventBrokerService {
  public readonly animationControlsToggle = new Subject<EventInfo>();
  public readonly animationToggle = new Subject<EventInfo>();
  public readonly autoCorrectToggle = new Subject<EventInfo>();
  public readonly deleteSelectionRequest = new Subject<EventInfo>();
  public readonly designModeSelection = new Subject<EventInfo>();
  public readonly editModeSelection = new Subject<EventInfo>();
  public readonly gridDensitySelection = new Subject<EventInfo>();
  public readonly guidesToggle = new Subject<EventInfo>();
  public readonly inventorySelectionChange = new Subject<EventInfo>();
  public readonly legacyGraphicsToggle = new Subject<EventInfo>();
  public readonly loadBridgeRequest = new Subject<EventInfo>();
  public readonly loadInventorySelectorRequest = new Subject<EventInfo>();
  public readonly loadSampleRequest = new Subject<EventInfo>();
  public readonly memberNumbersToggle = new Subject<EventInfo>();
  public readonly memberTableToggle = new Subject<EventInfo>();
  public readonly redoRequest = new Subject<EventInfo>();
  public readonly rulersToggle = new Subject<EventInfo>();
  public readonly selectAllRequest = new Subject<EventInfo>();
  public readonly selectedElementsChange = new Subject<EventInfo>();
  public readonly templateToggle = new Subject<EventInfo>();
  public readonly titleBlockToggle = new Subject<EventInfo>();
  public readonly toolsToggle = new Subject<EventInfo>();
  public readonly undoManagerStateChange = new Subject<EventInfo>();
  public readonly undoRequest = new Subject<EventInfo>();
}
