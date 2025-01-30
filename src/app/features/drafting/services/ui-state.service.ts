import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EventInfo, EventOrigin } from '../../../shared/services/event-broker.service';
import { jqxToggleButtonComponent } from 'jqwidgets-ng/jqxtogglebutton';

/** Container for state and logic that sychronizes multiple UI elements having the same purpose. */
@Injectable({ providedIn: 'root' })
export class UiStateService {
  // Workaround for jqxMenu limitation: menu item click handlers aren't allowed, only the
  // global itemclicked() handler. So can't hang this info on the DOM, which would be simpler.
  private readonly selectMenuItemInfosById: { [id: string]: [number, Subject<EventInfo>] } = {};
  private readonly toggleMenuItemInfosById: { [id: string]: [HTMLSpanElement, Subject<EventInfo>] } = {};
  private readonly plainMenuItemInfosById: { [id: string]: [Subject<EventInfo>, any] } = {};

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

  public registerSelectMenuItems(itemIds: string[], subject: Subject<EventInfo>): void {
    itemIds.forEach((id, index) => (this.selectMenuItemInfosById[id] = [index, subject]));
    const menuItems = itemIds.map(UiStateService.queryMenuItem);
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

  public registerToggleMenuItem(itemId: string, subject: Subject<EventInfo>) {
    const menuItem = UiStateService.queryMenuItem(itemId);
    this.toggleMenuItemInfosById[itemId] = [menuItem, subject];
    subject.subscribe((eventInfo: EventInfo) => {
      if (eventInfo.origin != EventOrigin.MENU) {
        UiStateService.setMenuItemCheck(menuItem, eventInfo.data);
      }
    });
  }

  public registerToggleToolbarButton(buttonItem: jqwidgets.ToolBarToolItem, subject: Subject<EventInfo>) {
    buttonItem.tool.on('click', () => {
      subject.next({ origin: EventOrigin.TOOLBAR, data: buttonItem.tool.jqxToggleButton('toggled') });
    });
    subject.subscribe((eventInfo: EventInfo) => {
      if (eventInfo.origin !== EventOrigin.TOOLBAR) {
        buttonItem.tool.jqxToggleButton('toggled', eventInfo.data);
      }
    });
  }

  public registerPlainMenuEntry(itemId: string, subject: Subject<EventInfo>, data?: any) {
    this.plainMenuItemInfosById[itemId] = [subject, data];
  }

  public registerPlainToolbarButton(buttonItem: jqwidgets.ToolBarToolItem, subject: Subject<EventInfo>, data?: any) {
    buttonItem.tool.on('click', () => {
      subject.next({ origin: EventOrigin.TOOLBAR, data });
    });
  }

  private static setMenuItemCheck(menuItem: HTMLSpanElement, value: boolean) {
    menuItem.textContent = value ? '✔' : '';
  }

  private static isMenuItemChecked(menuItem: HTMLSpanElement) {
    return menuItem.textContent === '✔';
  }

  private static queryMenuItem(id: string): HTMLSpanElement {
    return document.querySelector(`li#${id} > span.menu-mark`) as HTMLSpanElement;
  }
}
