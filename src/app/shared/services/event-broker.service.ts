import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AnalysisStatus } from './analysis.service';
import { ToastKind } from '../../features/toast/toast/toast-error';
import { UiMode } from '../../features/controls/management/ui-state.service';

/** Origin of an event. For breaking event cycles. */
export const enum EventOrigin {
  ABOUT_DIALOG,
  APP,
  CURSOR_OVERLAY,
  DESIGN_ITERATION_DIALOG,
  DRAFTING_PANEL,
  MEMBER_EDIT_DIALOG,
  MEMBER_TABLE,
  MENU,
  SAMPLE_DIALOG,
  SERVICE,
  SETUP_DIALOG,
  SLENDERNESS_FAIL_DIALOG,
  TEMPLATE_DIALOG,
  TOOL_SELECTOR,
  TOOLBAR,
  WELCOME_DIALOG,
}

export type EventInfo = { origin: EventOrigin; data?: any };
export type TypedEventInfo<T> = { origin: EventOrigin; data: T };

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
  // TODO: Finish replacing EventInfo with TypedEventInfo. (UiStateService makes this hard.)
  public readonly aboutRequest = new Subject<EventInfo>();
  public readonly analysisCompletion = new Subject<TypedEventInfo<AnalysisStatus>>();
  public readonly analysisReportRequest = new Subject<EventInfo>();
  public readonly animationControlsToggle = new Subject<EventInfo>();
  public readonly animationToggle = new Subject<EventInfo>();
  public readonly autoCorrectToggle = new Subject<EventInfo>();
  public readonly costReportRequest = new Subject<EventInfo>();
  public readonly deleteSelectionRequest = new Subject<EventInfo>();
  public readonly designIterationBackRequest = new Subject<EventInfo>();
  public readonly designIterationChange = new Subject<EventInfo>();
  public readonly designIterationForwardRequest = new Subject<EventInfo>();
  public readonly designModeSelection = new Subject<EventInfo>();
  public readonly draftingPanelInvalidation = new Subject<EventInfo>();
  public readonly draftingViewportPendingChange = new Subject<EventInfo>();
  public readonly editCommandCompletion = new Subject<EventInfo>();
  public readonly editModeSelection = new Subject<EventInfo>();
  public readonly flyThruViewportChange = new Subject<TypedEventInfo<void>>();
  public readonly gridDensityChange = new Subject<EventInfo>();
  public readonly gridDensitySelection = new Subject<EventInfo>();
  public readonly guidesToggle = new Subject<EventInfo>();
  public readonly helpRequest = new Subject<EventInfo>();
  public readonly inventorySelectionChange = new Subject<EventInfo>();
  public readonly inventorySelectionCompletion = new Subject<EventInfo>();
  public readonly legacyGraphicsToggle = new Subject<EventInfo>();
  public readonly loadBridgeCompletion = new Subject<EventInfo>();
  public readonly loadBridgeFileRequest = new Subject<EventInfo>();
  public readonly loadBridgeRequest = new Subject<EventInfo>();
  public readonly loadDesignIterationRequest = new Subject<EventInfo>();
  public readonly loadInventorySelectorRequest = new Subject<EventInfo>();
  public readonly loadSampleRequest = new Subject<EventInfo>();
  public readonly loadSketchRequest = new Subject<EventInfo>();
  public readonly loadTemplateRequest = new Subject<EventInfo>();
  public readonly memberEditRequest = new Subject<EventInfo>();
  public readonly memberNumbersToggle = new Subject<EventInfo>();
  public readonly memberSizeDecreaseRequest = new Subject<EventInfo>();
  public readonly memberSizeIncreaseRequest = new Subject<EventInfo>();
  public readonly memberTableToggle = new Subject<EventInfo>();
  public readonly newDesignRequest = new Subject<EventInfo>();
  public readonly printRequest = new Subject<EventInfo>();
  public readonly redoRequest = new Subject<EventInfo>();
  public readonly rulersToggle = new Subject<EventInfo>();
  public readonly saveBridgeFileRequest = new Subject<EventInfo>();
  public readonly selectAllRequest = new Subject<EventInfo>();
  public readonly selectedElementsChange = new Subject<EventInfo>();
  public readonly selectNoneRequest = new Subject<EventInfo>();
  public readonly sessionStateEnableToggle = new Subject<EventInfo>();
  public readonly sessionStateRestoreCompletion = new Subject<TypedEventInfo<void>>();
  public readonly sessionStateSaveEssentialRequest = new Subject<TypedEventInfo<void>>();
  public readonly sessionStateSaveRequest = new Subject<TypedEventInfo<void>>();
  public readonly slendernessFailDialogOpenRequest = new Subject<EventInfo>();
  public readonly templateToggle = new Subject<EventInfo>();
  public readonly tipRequest = new Subject<EventInfo>();
  public readonly titleBlockToggle = new Subject<EventInfo>();
  public readonly toastRequest = new Subject<TypedEventInfo<ToastKind>>();
  public readonly toolsToggle = new Subject<EventInfo>();
  public readonly uiModeRequest = new Subject<TypedEventInfo<UiMode>>();
  public readonly undoRequest = new Subject<EventInfo>();
  public readonly unstableBridgeDialogOpenRequest = new Subject<EventInfo>();
  public readonly welcomeRequest = new Subject<EventInfo>();

  public get namesBySubject(): Map<Subject<any>, string> {
    const map = new Map<Subject<any>, string>();
    for (const name in this) {
      if (this[name] instanceof Subject) {
        map.set(this[name], name);
      }
    }
    return map;
  }

  public get subjectsByName(): Map<string, Subject<any>> {
    const map = new Map<string, Subject<any>>();
    for (const name in this) {
      if (this[name] instanceof Subject) {
        map.set(name, this[name]);
      }
    }
    return map;
  }
}
