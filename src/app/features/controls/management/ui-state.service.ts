import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxToggleButtonComponent } from 'jqwidgets-ng/jqxtogglebutton';
import { jqxMenuComponent } from 'jqwidgets-ng/jqxmenu';
import { jqxButtonComponent } from 'jqwidgets-ng/jqxbuttons';

export const enum ModifierMask {
  ALT = 0x1,
  CTRL = 0x2,
  META = 0x4,
  SHIFT = 0x8,
}

/** Container for state and logic that sychronizes multiple UI elements having the same purpose. */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  // Workaround for jqxMenu limitation: menu item click handlers aren't allowed, only the
  // global itemclicked() handler. So can't hang this info on the DOM, which would be simpler.
  private readonly selectMenuItemInfosById: { [id: string]: [number, Subject<EventInfo>] } = {};
  private readonly toggleMenuItemInfosById: { [id: string]: [HTMLSpanElement, Subject<EventInfo>] } = {};
  private readonly plainMenuItemInfosById: { [id: string]: [Subject<EventInfo>, any] } = {};
  private readonly widgetDisablersBySubject = new Map<Subject<any>, ((disable: boolean) => void)[]>();
  private readonly keyInfosByKey: { [key: string]: [boolean, Subject<EventInfo>, any] } = {};

  constructor() {
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
    subject.subscribe((eventInfo: EventInfo) =>
      menuItems.forEach((menuItem, menuItemIndex) =>
        UiStateService.setMenuItemCheck(menuItem, eventInfo.data === menuItemIndex),
      ),
    );
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
      button.elementRef.nativeElement.addEventListener('mousedown', () =>
        subject.next({ origin: EventOrigin.TOOLBAR, data: buttonIndex }),
      ),
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
    if (this.keyInfosByKey[lookupKey]) {
      throw new Error(`Multiple reg for key '${key}'`);
    }
    const info: [boolean, Subject<EventInfo>, any] = [false, subject, data];
    this.keyInfosByKey[lookupKey] = info;
    this.addWidgetDisabler(subject, disable => {
      info[0] = disable;
    });
  }

  public disable(subject: Subject<any>, value: boolean = true): void {
    this.widgetDisablersBySubject.get(subject)?.forEach(disabler => disabler(value));
  }

  /** Adds a disabler for given subject. Useful for disabling widgets that don't drive send messages themselves. */
  public addWidgetDisabler(subject: Subject<any>, disabler: (disable: boolean) => void): void {
    let disablers: ((disable: boolean) => void)[] | undefined = this.widgetDisablersBySubject.get(subject);
    if (!disablers) {
      disablers = [];
      this.widgetDisablersBySubject.set(subject, disablers);
    }
    disablers.push(disabler.bind(this));
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
}
