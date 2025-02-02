import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Origin of an event. For breaking event cycles. */
export const enum EventOrigin {
  APP,
  DRAFTING_PANEL,
  MEMBER_TABLE,
  MENU,
  SAMPLE_DIALOG,
  SERVICE,
  SETUP_DIALOG,
  TEMPLATE_DIALOG,
  TOOLBAR,
}

export type EventInfo = { origin: EventOrigin; data?: any };

/** 
 * Event subject container. Suffixes connote following conventions.
 *
 *  o xxxRequest: Some service or component is being asked to do something.
 *    - Handled in that entity.
 *  o xxxCompletion: The subject's origin is ready for queries.
 *    - Potentially handled in many places. A broadcast.
 *  o xxxSelection: A UI selector widget has been clicked.
 *    - Handled by associated selector groups (e.g. buttons and menu items) plus anyone else interested.
 *  o xxxToggle: A UI toggle widget has been clicked.
 *    - Handled by asssociated toggles (e.g. button and menu item) plus anyone else interested.
 *  o xxxInvalidation: Graphic entity xxx requires rendering, e.g. because 
 *    the underlying model has changed.
 *    - Handled by the graphic entity.
 *  o xxxChange: A service or component's state changed. Other services need to know.
 *    - Handled by the interested services.
 */
@Injectable({ providedIn: 'root' })
export class EventBrokerService {
  public readonly analysisCompletion = new Subject<EventInfo>();
  public readonly analysisReportRequest = new Subject<EventInfo>();
  public readonly animationControlsToggle = new Subject<EventInfo>();
  public readonly animationToggle = new Subject<EventInfo>();
  public readonly autoCorrectToggle = new Subject<EventInfo>();
  public readonly deleteSelectionRequest = new Subject<EventInfo>();
  public readonly designModeSelection = new Subject<EventInfo>();
  public readonly draftingPanelInvalidation = new Subject<EventInfo>();
  public readonly editCommandCompletion = new Subject<EventInfo>();
  public readonly editModeSelection = new Subject<EventInfo>();
  public readonly gridDensitySelection = new Subject<EventInfo>();
  public readonly gridDensityChange = new Subject<EventInfo>();
  public readonly guidesToggle = new Subject<EventInfo>();
  public readonly inventorySelectionChange = new Subject<EventInfo>();
  public readonly inventorySelectionCompletion = new Subject<EventInfo>();
  public readonly legacyGraphicsToggle = new Subject<EventInfo>();
  public readonly loadBridgeCompletion = new Subject<EventInfo>();
  public readonly loadBridgeRequest = new Subject<EventInfo>();
  public readonly loadSketchRequest = new Subject<EventInfo>();
  public readonly loadInventorySelectorRequest = new Subject<EventInfo>();
  public readonly loadSampleRequest = new Subject<EventInfo>();
  public readonly loadTemplateRequest = new Subject<EventInfo>();
  public readonly memberSizeIncreaseRequest = new Subject<EventInfo>();
  public readonly memberSizeDecreaseRequest = new Subject<EventInfo>();
  public readonly memberNumbersToggle = new Subject<EventInfo>();
  public readonly memberTableToggle = new Subject<EventInfo>();
  public readonly newDesignRequest = new Subject<EventInfo>();
  public readonly redoRequest = new Subject<EventInfo>();
  public readonly rulersToggle = new Subject<EventInfo>();
  public readonly selectAllRequest = new Subject<EventInfo>();
  public readonly selectedElementsChange = new Subject<EventInfo>();
  public readonly templateToggle = new Subject<EventInfo>();
  public readonly titleBlockToggle = new Subject<EventInfo>();
  public readonly toolsToggle = new Subject<EventInfo>();
  public readonly undoRequest = new Subject<EventInfo>();
  public readonly unstableBridgeDialogOpenRequest = new Subject<EventInfo>();
}
