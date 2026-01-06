/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EventBrokerService, EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxToggleButtonComponent } from 'jqwidgets-ng/jqxtogglebutton';
import { jqxMenuComponent } from 'jqwidgets-ng/jqxmenu';
import { jqxButtonComponent } from 'jqwidgets-ng/jqxbuttons';
import { SessionStateService } from '../../../shared/services/session-state.service';

export const enum ModifierMask {
  ALT = 0x1,
  CTRL = 0x2,
  META = 0x4,
  SHIFT = 0x8,
}

/** Allowed UI modes to which disable overrides can be attached. */
export type UiMode = 'initial' | 'drafting' | 'animation' | 'unknown';

/**
 * Info paired with a subject to connote UI modes where it should be disabled 
 * regardless of its normal disabled state. Also a place to store that normal state.
 * Example: Drafting controls have overrides for animation mode, since the drafting
 * panel can't be seen.
 */
type DisableOverride = { isDisabled: boolean; disabledModes: UiMode[] };

/**
 * Container for logic that sychronizes multiple UI elements having the same purpose.
 *
 * This class doesn't track the state of toggle and select subjects. It only toggles
 * and selects the state of attached UI objects. When explicit state is needed, a separate
 * service should subscribe to the respective subject.
 *
 * An exception is UI elements with registered "disable overrides." An override, as the name
 * implies, causes its element to be disabled regardless of its normal enable/disable state
 * based on UI states specified at registration time. When the UI leaves the disabled state,
 * the element's enable/disable state is restored. This service necessarily tracks the
 * normal states for this purpose.
 *
 * A global disablement feature is also supported to accomodate browsers lacking capabilities
 * that selected features require. Topics placed on the global list are immediately disabled
 * and remain so.
 */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  // Workaround for jqxMenu limitation: menu item click handlers aren't allowed, only the
  // global itemclicked() handler. So can't hang this info there, which would be simpler.
  private readonly selectMenuItemInfosById: { [id: string]: [number, Subject<EventInfo>] } = {};
  private readonly toggleMenuItemInfosById: { [id: string]: [HTMLSpanElement, Subject<EventInfo>] } = {};
  private readonly plainMenuItemInfosById: { [id: string]: [Subject<EventInfo>, any] } = {};
  private readonly widgetDisablersBySubject = new Map<Subject<any>, ((disable: boolean) => void)[]>();
  private readonly keyInfosByKey: { [key: string]: [boolean, Subject<EventInfo>, any] } = {};
  private readonly disableOverridesBySubject = new Map<Subject<any>, DisableOverride>();
  private uiMode: UiMode = 'unknown';
  private readonly globallyDisabledSubjects = new Set<Subject<any>>();

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    sessionStateService: SessionStateService,
  ) {
    // Handle shortcut keystrokes.
    addEventListener('keydown', (event: KeyboardEvent): void => {
      let modifierMask = (+event.shiftKey << 3) | (+event.metaKey << 2) | (+event.ctrlKey << 1) | +event.altKey;
      const info = this.keyInfosByKey[`${event.key}|${modifierMask}`];
      if (!info || info[0]) {
        return;
      }
      // Stop <input> from grabbing focus back on control keys.
      event.preventDefault();
      info[1].next({ origin: EventOrigin.TOOLBAR, data: info[2] });
    });
    eventBrokerService.uiModeRequest.subscribe(eventInfo => {
      this.uiMode = eventInfo.data;
      for (const [subject, override] of this.disableOverridesBySubject) {
        this.disableByOverride(subject, override);
      }
      eventBrokerService.uiModeChange.next({ origin: EventOrigin.SERVICE, data: this.uiMode });
    });
    // By-UI mode disablement setup. Must be complete before session state registration.
    const initial: UiMode[] = ['initial'];
    const initialAndAnimation: UiMode[] = ['initial', 'animation'];
    const initialAndDrafting: UiMode[] = ['initial', 'drafting'];
    this.addDisableOverrides(eventBrokerService.analysisReportRequest, initial, true);
    this.addDisableOverrides(eventBrokerService.animationControlsToggle, initialAndDrafting);
    this.addDisableOverrides(eventBrokerService.costReportRequest, initial);
    this.addDisableOverrides(eventBrokerService.deleteSelectionRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.designIterationBackRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.designIterationForwardRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.designModeSelection, initial);
    this.addDisableOverrides(eventBrokerService.gridDensitySelection, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.guidesToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.inventorySelectionChange, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.loadDesignIterationRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.loadTemplateRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.memberDetailsReportRequest, initial, true);
    this.addDisableOverrides(eventBrokerService.memberNumbersToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.memberSizeDecreaseRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.memberSizeIncreaseRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.memberTableToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.redoRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.rulersToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.selectAllRequest, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.templateToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.titleBlockToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.toolsToggle, initialAndAnimation);
    this.addDisableOverrides(eventBrokerService.undoRequest, initialAndAnimation);
    sessionStateService.register(
      'uistate.service',
      () => this.dehydrate(),
      (state: State) => this.rehydrate(state),
    );
  }

  public handleMenuItemClicked(id: string): void {
    const selectMenuItemInfo = this.selectMenuItemInfosById[id];
    if (selectMenuItemInfo) {
      const [index, subject] = selectMenuItemInfo;
      subject.next({ origin: EventOrigin.MENU, data: index });
      return;
    }
    const toggleMenuItemInfo = this.toggleMenuItemInfosById[id];
    if (toggleMenuItemInfo) {
      const [item, subject] = toggleMenuItemInfo;
      const newIsCheckedValue = !UiStateService.isMenuItemChecked(item);
      UiStateService.setMenuItemCheck(item, newIsCheckedValue);
      subject.next({ origin: EventOrigin.MENU, data: newIsCheckedValue });
      return;
    }
    const plainMenuItemInfo = this.plainMenuItemInfosById[id];
    if (plainMenuItemInfo) {
      plainMenuItemInfo[0].next({ origin: EventOrigin.MENU, data: plainMenuItemInfo[1] });
      return;
    }
  }

  public registerSelectMenuItems(menu: jqxMenuComponent, itemIds: string[], subject: Subject<EventInfo>): void {
    this.addWidgetDisabler(subject, disable => itemIds.forEach(id => menu.disable(id, disable)));
    itemIds.forEach((id, index) => (this.selectMenuItemInfosById[id] = [index, subject]));
    const menuItems = itemIds.map(UiStateService.queryMenuMark);
    subject.subscribe((eventInfo: EventInfo) => {
      menuItems.forEach((menuItem, menuItemIndex) =>
        UiStateService.setMenuItemCheck(menuItem, eventInfo.data === menuItemIndex),
      );
    });
  }

  public registerSelectToolbarButtons(
    buttonItems: jqwidgets.ToolBarToolItem[],
    indices: number[],
    subject: Subject<EventInfo>,
  ): void {
    this.addWidgetDisabler(subject, disable =>
      buttonItems.forEach(item => item.tool.jqxToggleButton({ disabled: disable })),
    );
    buttonItems = indices.map(i => buttonItems[i]);
    buttonItems.forEach((buttonItem, buttonItemIndex) =>
      buttonItem.tool.on('mousedown', () => {
        subject.next({ origin: EventOrigin.TOOLBAR, data: buttonItemIndex });
      }),
    );
    subject.subscribe((eventInfo: EventInfo) => {
      buttonItems.forEach((buttonItem, buttonItemIndex) =>
        buttonItem.tool.jqxToggleButton(
          'toggled',
          // EventOrigin test needed for jqwidgets toggle logic: clicked button can't be already toggled.
          eventInfo.origin !== EventOrigin.TOOLBAR && eventInfo.data === buttonItemIndex,
        ),
      );
    });
  }

  public registerSelectButtons(buttons: jqxToggleButtonComponent[], subject: Subject<EventInfo>): void {
    this.addWidgetDisabler(subject, disable => buttons.forEach(button => button.disabled(disable)));
    buttons.forEach((button, buttonIndex) =>
      button.elementRef.nativeElement.addEventListener('mousedown', () => {
        subject.next({ origin: EventOrigin.TOOLBAR, data: buttonIndex });
      }),
    );
    subject.subscribe((eventInfo: EventInfo) => {
      buttons.forEach((button, buttonIndex) =>
        button.toggled(eventInfo.origin !== EventOrigin.TOOLBAR && eventInfo.data === buttonIndex),
      );
    });
  }

  public registerToggleMenuItem(menu: jqxMenuComponent, itemId: string, subject: Subject<EventInfo>): void {
    this.addWidgetDisabler(subject, disable => menu.disable(itemId, disable));
    const menuItem = UiStateService.queryMenuMark(itemId);
    this.toggleMenuItemInfosById[itemId] = [menuItem, subject];
    subject.subscribe((eventInfo: EventInfo) => {
      if (eventInfo.origin != EventOrigin.MENU) {
        UiStateService.setMenuItemCheck(menuItem, eventInfo.data);
      }
    });
  }

  public registerToggleToolbarButton(buttonItem: jqwidgets.ToolBarToolItem, subject: Subject<EventInfo>): void {
    this.addWidgetDisabler(subject, disable => buttonItem.tool.jqxToggleButton({ disabled: disable }));
    buttonItem.tool.on('click', () => {
      subject.next({ origin: EventOrigin.TOOLBAR, data: buttonItem.tool.jqxToggleButton('toggled') });
    });
    subject.subscribe((eventInfo: EventInfo) => {
      if (eventInfo.origin !== EventOrigin.TOOLBAR) {
        buttonItem.tool.jqxToggleButton('toggled', eventInfo.data);
      }
    });
  }

  public registerToggleButton(
    button: jqxToggleButtonComponent,
    origin: EventOrigin,
    subject: Subject<EventInfo>,
  ): void {
    this.addWidgetDisabler(subject, disable => button.disabled(disable));
    button.elementRef.nativeElement.addEventListener('click', () => {
      subject.next({ origin, data: button.toggled() });
    });
    subject.subscribe((eventInfo: EventInfo) => {
      if (eventInfo.origin !== origin) {
        button.toggled(eventInfo.data);
      }
    });
  }

  public registerPlainMenuEntry(menu: jqxMenuComponent, itemId: string, subject: Subject<EventInfo>, data?: any): void {
    this.addWidgetDisabler(subject, disable => menu.disable(itemId, disable));
    this.plainMenuItemInfosById[itemId] = [subject, data];
  }

  public registerPlainToolbarButton(buttonItem: jqwidgets.ToolBarToolItem, subject: Subject<EventInfo>, data?: any) {
    this.addWidgetDisabler(subject, disable => buttonItem.tool.jqxButton({ disabled: disable }));
    buttonItem.tool.on('click', () => {
      subject.next({ origin: EventOrigin.TOOLBAR, data });
    });
  }

  public registerPlainButton(button: jqxButtonComponent, origin: EventOrigin, subject: Subject<EventInfo>, data?: any) {
    this.addWidgetDisabler(subject, disable => button.disabled(disable));
    button.elementRef.nativeElement.addEventListener('click', () => subject.next({ origin, data }));
  }

  public registerKey(key: string, modifierMask: number, subject: Subject<EventInfo>, data?: any): void {
    const lookupKey = `${key}|${modifierMask}`;
    const info: [boolean, Subject<EventInfo>, any] = [false, subject, data];
    this.keyInfosByKey[lookupKey] = info;
    this.addWidgetDisabler(subject, disable => {
      info[0] = disable;
    });
  }

  public disable(subject: Subject<any>, value: boolean = true): void {
    // Ignore globally disabled subjects. They're already and forever disabled.
    if (this.globallyDisabledSubjects.has(subject)) {
      return;
    }
    const override = this.disableOverridesBySubject.get(subject);
    if (override) {
      override.isDisabled = value;
      this.disableByOverride(subject, override);
    } else {
      this.widgetDisablersBySubject.get(subject)?.forEach(disabler => disabler(value));
    }
  }

  /** Adds a disabler for given subject. Useful for disabling widgets that don't send messages themselves. */
  public addWidgetDisabler(subject: Subject<any>, disabler: (disable: boolean) => void): void {
    let disablers: ((disable: boolean) => void)[] | undefined = this.widgetDisablersBySubject.get(subject);
    if (!disablers) {
      disablers = [];
      this.widgetDisablersBySubject.set(subject, disablers);
    }
    disablers.push(disabler.bind(this));
  }

  /**
   * Adds overrides to disable/re-enable controls based on UI state.
   *
   * When the override is added, the provided initial disabled value must match actual widget state.
   */
  public addDisableOverrides(subject: Subject<any>, overrides: UiMode[], initialDisabled: boolean = false) {
    this.disableOverridesBySubject.set(subject, { isDisabled: initialDisabled, disabledModes: overrides });
  }

  /** Returns whether the given subject is disabled for the current UI state. If no override has been registered, returns false. */
  public isDisabledForCurrentUiMode(subject: Subject<any>): boolean {
    const override = this.disableOverridesBySubject.get(subject);
    return override !== undefined && (override.disabledModes.includes(this.uiMode) || override.isDisabled);
  }

  /** Globally disable a subject to prevent its use entirely. */
  public globallyDisable(subject: Subject<any>): void {
    this.setDisabled(subject, true);
    this.globallyDisabledSubjects.add(subject);
  }

  /** Dis/enables the subject based on override state. */
  private disableByOverride(subject: Subject<any>, override: DisableOverride) {
    this.setDisabled(subject, override.disabledModes.includes(this.uiMode) || override.isDisabled);
  }

  /** Hard sets the disabled state of UI widgets associated with a subject via disablers. */
  private setDisabled(subject: Subject<any>, value: boolean): void {
    this.widgetDisablersBySubject.get(subject)?.forEach(disabler => disabler(value));
  }

  private static setMenuItemCheck(menuItem: HTMLSpanElement, value: boolean): void {
    menuItem.textContent = value ? '✔' : '';
  }

  private static isMenuItemChecked(menuItem: HTMLSpanElement): boolean {
    return menuItem.textContent === '✔';
  }

  // Another way through the jqxMenu object, but it's undocumented:
  // (menu.widgetObject as any).menuElements[id].element.children.item(0) as HTMLSpanElement
  private static queryMenuMark(id: string): HTMLSpanElement {
    return document.querySelector(`li#${id} > span.menu-mark`) as HTMLSpanElement;
  }

  private dehydrate(): State {
    const namesBySubject = this.eventBrokerService.namesBySubject;
    const state: State = {};
    this.disableOverridesBySubject.forEach((override, subject) => {
      state[namesBySubject.get(subject)!] = override.isDisabled;
    });
    return state;
  }

  private rehydrate(state: State): void {
    const subjectsByName = this.eventBrokerService.subjectsByName;
    for (const subjectName in state) {
      const subject = subjectsByName.get(subjectName)!;
      const override = this.disableOverridesBySubject.get(subject)!;
      override.isDisabled = state[subjectName];
    }
  }
}

/** Map from subject name to "is disabled" state of override. */
type State = { [key: string]: boolean };
