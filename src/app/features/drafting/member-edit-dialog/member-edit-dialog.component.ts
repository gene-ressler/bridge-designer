import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { InventorySelectorComponent } from '../../../shared/components/inventory-selector/inventory-selector.component';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxToggleButtonComponent, jqxToggleButtonModule } from 'jqwidgets-ng/jqxtogglebutton';
import { UiStateService } from '../../controls/management/ui-state.service';

@Component({
  selector: 'member-edit-dialog',
  standalone: true,
  imports: [InventorySelectorComponent, jqxToggleButtonModule, jqxWindowModule, jqxButtonModule],
  templateUrl: './member-edit-dialog.component.html',
  styleUrl: './member-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberEditDialogComponent implements AfterViewInit {
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('increaseSizeButton') increaseSizeButton!: jqxButtonComponent;
  @ViewChild('decreaseSizeButton') decreaseSizeButton!: jqxButtonComponent;
  @ViewChild('deleteSelectionButton') deleteSelectionButton!: jqxButtonComponent;
  @ViewChild('memberListToggleButton') memberListToggleButton!: jqxToggleButtonComponent;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly uiStateService: UiStateService,
  ) {}

  private open(x: number, y: number) {
    this.dialog.move(x, y);
    this.dialog.open();
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.memberEditRequest.subscribe(eventInfo =>
      this.open(eventInfo.data.x, eventInfo.data.y),
    );
    // On delete, close the dialog. There's no selection to edit further.
    this.eventBrokerService.deleteSelectionRequest.subscribe(_eventInfo => this.dialog.close());
    this.uiStateService.registerPlainButton(
      this.increaseSizeButton,
      EventOrigin.MEMBER_EDIT_DIALOG,
      this.eventBrokerService.memberSizeIncreaseRequest,
    );
    this.uiStateService.registerPlainButton(
      this.decreaseSizeButton,
      EventOrigin.MEMBER_EDIT_DIALOG,
      this.eventBrokerService.memberSizeDecreaseRequest,
    );
    this.uiStateService.registerPlainButton(
      this.deleteSelectionButton,
      EventOrigin.MEMBER_EDIT_DIALOG,
      this.eventBrokerService.deleteSelectionRequest,
    );
    this.uiStateService.registerToggleButton(
      this.memberListToggleButton,
      EventOrigin.MEMBER_EDIT_DIALOG,
      this.eventBrokerService.memberTableToggle,
    );
  }
}
