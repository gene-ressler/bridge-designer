import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxToggleButtonComponent, jqxToggleButtonModule } from 'jqwidgets-ng/jqxtogglebutton';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { UiStateService } from '../management/ui-state.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { SessionStateService } from '../../../shared/services/session-state.service';
@Component({
  selector: 'tool-selector',
  standalone: true,
  imports: [jqxToggleButtonModule, jqxWindowModule],
  templateUrl: './tool-selector.component.html',
  styleUrl: './tool-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolSelectorComponent implements AfterViewInit {
  private static readonly SESSION_STATE_KEY = 'toolSelector.component';

  readonly imgSize = 25;
  readonly buttonSize = 34;
  readonly windowWidth = 4 * this.buttonSize + 2;
  readonly windowHeight = 68;

  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('jointsButton') jointsButton!: jqxToggleButtonComponent;
  @ViewChild('membersButton') membersButton!: jqxToggleButtonComponent;
  @ViewChild('selectButton') selectButton!: jqxToggleButtonComponent;
  @ViewChild('eraseButton') eraseButton!: jqxToggleButtonComponent;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly uiStateService: UiStateService,
    private readonly sessionStateService: SessionStateService,
  ) {}

  /** Returns the index of the selected tool. Defaults to 0 (joints) if none selected. */
  private get selectedIndex(): number {
    if (this.eraseButton.toggled()) return 3;
    if (this.selectButton.toggled()) return 2;
    if (this.membersButton.toggled()) return 1;
    return 0;
  }

  ngAfterViewInit(): void {
    this.uiStateService.registerSelectButtons(
      [this.jointsButton, this.membersButton, this.selectButton, this.eraseButton],
      this.eventBrokerService.editModeSelection,
    );
    this.eventBrokerService.toolsToggle.subscribe(eventInfo => {
      if (eventInfo.data) {
        this.dialog.open();
      } else {
        this.dialog.close();
      }
    });
    // Split the usual registration in order to wait until the app view is hydrated for restoring selected tool.
    // This ensures all listeners are subscribed. Their AfterViewInit methods are complete. 
    this.eventBrokerService.sessionStateSaveRequest.subscribe(_eventInfo =>
      this.sessionStateService.recordState(ToolSelectorComponent.SESSION_STATE_KEY, this.dehydrated),
    );
    this.eventBrokerService.sessionStateRestoreComplete.subscribe(_eventInfo => {
      const state = this.sessionStateService.getSavedState(ToolSelectorComponent.SESSION_STATE_KEY) as State;
      this.rehydrate(state);
    });
  }

  private get dehydrated(): State {
    return {
      selectedIndex: this.selectedIndex,
    };
  }

  private rehydrate(state: State | undefined): void {
    if (!state) {
      return;
    }
    this.eventBrokerService.editModeSelection.next({
      origin: EventOrigin.TOOL_SELECTOR,
      data: state.selectedIndex,
    });
  }
}

type State = {
  selectedIndex: number;
};
