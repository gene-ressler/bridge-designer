/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxMenuModule, jqxMenuComponent } from 'jqwidgets-ng/jqxmenu';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../../controls/management/ui-state.service';

/** Drafting panel right-click context menu. */
@Component({
    selector: 'context-menu',
    imports: [jqxMenuModule],
    templateUrl: './context-menu.component.html',
    styleUrl: './context-menu.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent implements AfterViewInit {
  @ViewChild('menu') menu!: jqxMenuComponent;
  menuWidth: number = 160;
  menuHeight: number = 320;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    readonly uiStateService: UiStateService,
  ) {}

  handleItemClick(event: any): void {
    this.menu.close();
    const liElement = event.args as HTMLElement;
    this.uiStateService.handleMenuItemClicked(liElement.id);
  }

  public open(x: number, y: number, bounds?: HTMLElement) {
    if (bounds) {
      const wrapperRect = bounds.getBoundingClientRect();
      if (wrapperRect.right < x + this.menuWidth) {
        x = wrapperRect.right - this.menuWidth;
      }
      if (wrapperRect.bottom < y + this.menuHeight) {
        y = wrapperRect.bottom - this.menuHeight;
      }
    }
    this.menu.open(x, y);
  }

  ngAfterViewInit(): void {
    const gridGroup = ['coarseGridCm', 'mediumGridCm', 'fineGridCm'];
    this.uiStateService.registerSelectMenuItems(this.menu, gridGroup, this.eventBrokerService.gridDensitySelection);

    const toolsGroup = ['jointsCm', 'membersCm', 'selectCm', 'eraseCm'];
    this.uiStateService.registerSelectMenuItems(this.menu, toolsGroup, this.eventBrokerService.editModeSelection);

    this.uiStateService.registerPlainMenuEntry(this.menu, 'selectAllCm', this.eventBrokerService.selectAllRequest);
    this.uiStateService.registerToggleMenuItem(this.menu, 'memberListCm', this.eventBrokerService.memberTableToggle);
  }
}
