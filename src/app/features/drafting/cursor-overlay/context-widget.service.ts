/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { HotElementService } from '../shared/hot-element.service';
import { SelectedElementsService } from '../shared/selected-elements-service';
import { Member } from '../../../shared/classes/member.model';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { Utility } from '../../../shared/classes/utility';

/** Manager for right-click context menu and dialog of the drawing panel. */
@Injectable({ providedIn: 'root' })
export class ContextWidgetService {
  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly hotElementService: HotElementService,
    private readonly selectedElementService: SelectedElementsService,
  ) {}

  /** Installs a listener that pops up appropriate context widget on contextmenu event. */
  public listenForContextMenuClicks(contextMenu: ContextMenuComponent, host: HTMLElement, bounds: HTMLElement): void {
    host.addEventListener('contextmenu', (event: MouseEvent) => {
      // Ignore clicks where the user already had a button down. It's normally unintended and messes up cursor drags.
      if (Utility.countOnes(event.buttons) <= 1) {
        this.handleContextMenuClick(event, contextMenu, bounds);
      }
      // Don't show the browser right click menu.
      event.preventDefault();
    });
  }

  private handleContextMenuClick(event: MouseEvent, contextMenu: ContextMenuComponent, bounds: HTMLElement) {
    const hotElement = this.hotElementService.hotElement;
    // Member edit dialog if hovering near selected member, else menu.
    if (hotElement instanceof Member && this.selectedElementService.isMemberSelected(hotElement)) {
      this.eventBrokerService.memberEditRequest.next({
        origin: EventOrigin.SERVICE,
        data: { x: event.clientX, y: event.clientY },
      });
    } else {
      contextMenu.open(event.clientX, event.clientY, bounds);
    }
  }
}
