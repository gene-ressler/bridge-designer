import { Injectable } from '@angular/core';
import { HotElementService } from '../shared/hot-element.service';
import { SelectedElementsService } from '../shared/selected-elements-service';
import { Member } from '../../../shared/classes/member.model';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';

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
      const hotElement = this.hotElementService.hotElement;
      if (hotElement instanceof Member && this.selectedElementService.isMemberSelected(hotElement)) {
        this.eventBrokerService.memberEditRequest.next({
          origin: EventOrigin.SERVICE,
          data: { x: event.clientX, y: event.clientY },
        });
      } else {
        contextMenu.open(event.clientX, event.clientY, bounds);
      }
      event.preventDefault();
    });
  }
}
