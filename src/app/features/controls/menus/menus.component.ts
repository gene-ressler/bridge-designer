import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxMenuComponent, jqxMenuModule } from 'jqwidgets-ng/jqxmenu';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../management/ui-state.service';

@Component({
  selector: 'menus',
  standalone: true,
  imports: [CommonModule, jqxMenuModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenusComponent implements AfterViewInit {
  @ViewChild('mainMenu') mainMenu!: jqxMenuComponent;

  constructor(
    private readonly uiStateService: UiStateService,
    private readonly eventBrokerService: EventBrokerService,
  ) { }

  handleItemClick(event: any): void {
    const liElement = event.args as HTMLElement;
    this.uiStateService.handleMenuItemClicked(liElement.id);
  }

  ngAfterViewInit(): void {
    // this.mainMenu.disable('print', true); // TODO: Example/test. Remove.
    this.uiStateService.registerForDisablement(this.mainMenu);

    const gridGroup = ['coarseGrid', 'mediumGrid', 'fineGrid'];
    this.uiStateService.registerSelectMenuItems(gridGroup, this.eventBrokerService.gridDensitySelection);

    const draftingGroup = ['drawingBoard', 'loadTest'];
    this.uiStateService.registerSelectMenuItems(draftingGroup, this.eventBrokerService.designModeSelection);

    const toolsGroup = ['joints', 'members', 'select', 'erase'];
    this.uiStateService.registerSelectMenuItems(toolsGroup, this.eventBrokerService.editModeSelection);

    this.uiStateService.registerPlainMenuEntry('delete', this.eventBrokerService.deleteSelectionRequest);
    this.uiStateService.registerPlainMenuEntry('loadSample', this.eventBrokerService.loadSampleRequest);
    this.uiStateService.registerPlainMenuEntry('loadTemplate', this.eventBrokerService.loadTemplateRequest);
    this.uiStateService.registerPlainMenuEntry('new', this.eventBrokerService.newDesignRequest);
    this.uiStateService.registerPlainMenuEntry('redo', this.eventBrokerService.redoRequest);
    this.uiStateService.registerPlainMenuEntry('selectAll', this.eventBrokerService.selectAllRequest);
    this.uiStateService.registerPlainMenuEntry('sizedown', this.eventBrokerService.memberSizeChangeRequest, -1);
    this.uiStateService.registerPlainMenuEntry('sizeup', this.eventBrokerService.memberSizeChangeRequest, +1);
    this.uiStateService.registerPlainMenuEntry('undo', this.eventBrokerService.undoRequest);

    this.uiStateService.registerToggleMenuItem('animation', this.eventBrokerService.animationToggle);
    this.uiStateService.registerToggleMenuItem('animationControls', this.eventBrokerService.animationControlsToggle);
    this.uiStateService.registerToggleMenuItem('autoCorrect', this.eventBrokerService.autoCorrectToggle);
    this.uiStateService.registerToggleMenuItem('guides', this.eventBrokerService.guidesToggle);
    this.uiStateService.registerToggleMenuItem('legacyGraphics', this.eventBrokerService.legacyGraphicsToggle);
    this.uiStateService.registerToggleMenuItem('loadTestResults', this.eventBrokerService.analysisReportRequest);
    this.uiStateService.registerToggleMenuItem('memberList', this.eventBrokerService.memberTableToggle);
    this.uiStateService.registerToggleMenuItem('memberNumbers', this.eventBrokerService.memberNumbersToggle);
    this.uiStateService.registerToggleMenuItem('rulers', this.eventBrokerService.rulersToggle);
    this.uiStateService.registerToggleMenuItem('template', this.eventBrokerService.templateToggle);
    this.uiStateService.registerToggleMenuItem('titleBlock', this.eventBrokerService.titleBlockToggle);
    this.uiStateService.registerToggleMenuItem('tools', this.eventBrokerService.toolsToggle);
  }
}
