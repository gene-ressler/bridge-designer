import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxMenuComponent, jqxMenuModule } from 'jqwidgets-ng/jqxmenu';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { ModifierMask, UiStateService } from '../management/ui-state.service';
import { HelpTab } from '../../help/help-dialog/help-dialog.component';

@Component({
  selector: 'menus',
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
  ) {}

  handleItemClick(event: any): void {
    const liElement = event.args as HTMLElement;
    this.uiStateService.handleMenuItemClicked(liElement.id);
  }

  // prettier-ignore
  ngAfterViewInit(): void {
    // Can't disable items in HTML :-(
    ['loadTestResults', 'redo', 'sizedown', 'sizeup', 'undo'].forEach(id => this.mainMenu.disable(id, true));

    const gridGroup = ['coarseGrid', 'mediumGrid', 'fineGrid'];
    this.uiStateService.registerSelectMenuItems(this.mainMenu,gridGroup, this.eventBrokerService.gridDensitySelection);

    const draftingGroup = ['drawingBoard', 'loadTest'];
    this.uiStateService.registerSelectMenuItems(this.mainMenu,draftingGroup, this.eventBrokerService.designModeSelection);

    const toolsGroup = ['joints', 'members', 'select', 'erase'];
    this.uiStateService.registerSelectMenuItems(this.mainMenu, toolsGroup, this.eventBrokerService.editModeSelection);

    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'about', this.eventBrokerService.aboutRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'back', this.eventBrokerService.designIterationBackRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'costCalculations', this.eventBrokerService.costReportRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'delete', this.eventBrokerService.deleteSelectionRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'designWindow', this.eventBrokerService.helpRequest, {topic: 'hlp_bridge_design_window' });
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'forward', this.eventBrokerService.designIterationForwardRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'howTo', this.eventBrokerService.helpRequest, {topic: 'hlp_how_to'});
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'loadSample', this.eventBrokerService.loadSampleRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'loadTemplate', this.eventBrokerService.loadTemplateRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'loadTestResults', this.eventBrokerService.analysisReportRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'new', this.eventBrokerService.newDesignRequest);
    // TODO: Make this actually open a bridge file.
    // this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'open', this.eventBrokerService.memberEditRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'redo', this.eventBrokerService.redoRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'searchHelp', this.eventBrokerService.helpRequest, {topic: 'hlp_how_to', tab: HelpTab.SEARCH});
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'selectAll', this.eventBrokerService.selectAllRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'sizedown', this.eventBrokerService.memberSizeDecreaseRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'sizeup', this.eventBrokerService.memberSizeIncreaseRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'tip', this.eventBrokerService.tipRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'topics', this.eventBrokerService.helpRequest, {topic: 'glos_aashto', tab: HelpTab.TOPICS});
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'undo', this.eventBrokerService.undoRequest);
    this.uiStateService.registerPlainMenuEntry(this.mainMenu, 'whatsNew', this.eventBrokerService.helpRequest, {topic: 'hlp_whats_new'});
    

    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'animation', this.eventBrokerService.animationToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'animationControls', this.eventBrokerService.animationControlsToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'autoCorrect', this.eventBrokerService.autoCorrectToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'guides', this.eventBrokerService.guidesToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'legacyGraphics', this.eventBrokerService.legacyGraphicsToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'memberList', this.eventBrokerService.memberTableToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'memberNumbers', this.eventBrokerService.memberNumbersToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'rulers', this.eventBrokerService.rulersToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'session', this.eventBrokerService.sessionStateEnableToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'template', this.eventBrokerService.templateToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'titleBlock', this.eventBrokerService.titleBlockToggle);
    this.uiStateService.registerToggleMenuItem(this.mainMenu, 'tools', this.eventBrokerService.toolsToggle);

    this.uiStateService.registerKey('Delete', 0, this.eventBrokerService.deleteSelectionRequest);
    this.uiStateService.registerKey('a', ModifierMask.CTRL, this.eventBrokerService.selectAllRequest);
    this.uiStateService.registerKey('y', ModifierMask.CTRL, this.eventBrokerService.redoRequest);
    this.uiStateService.registerKey('z', ModifierMask.CTRL, this.eventBrokerService.undoRequest);
  }
}
