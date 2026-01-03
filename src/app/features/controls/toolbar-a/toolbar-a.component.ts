/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { ComponentService } from '../../../shared/core/component.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../management/ui-state.service';
import { UndoManagerService } from '../../drafting/shared/undo-manager.service';
import { UndoRedoDropdownComponent } from '../undo-redo-dropdown/undo-redo-dropdown.component';
import { StatusIndicatorComponent } from '../status-indicator/status-indicator.component';
import { CostIndicatorComponent } from '../cost-indicator/cost-indicator.component';
import { IterationIndicatorComponent } from '../iteration-indicator/iteration-indicator.component';
import { DebugDisplayComponent } from '../debug-display/debug-display.component';

const enum Tools {
  NEW,
  OPEN,
  SAVE,
  PRINT,
  PRINT_3D,
  DESIGN,
  LOAD_TEST,
  SELECT_ALL,
  DELETE,
  UNDO,
  UNDO_MULTIPLE,
  REDO,
  REDO_MULTIPLE,
  ITERATION,
  BACK_ITERATION,
  FORWARD_ITERATION,
  GOTO_ITERATION,
  COST,
  COST_REPORT,
  STATUS,
  LOAD_TEST_REPORT,
  MEMBER_DETAILS_REPORT,
  DEBUG_DISPLAY,
}

@Component({
  selector: 'toolbar-a',
  imports: [jqxToolBarModule],
  templateUrl: './toolbar-a.component.html',
  styleUrl: './toolbar-a.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarAComponent implements AfterViewInit {
  readonly tools: string =
    'button button button button button | ' +
    'toggleButton toggleButton | ' +
    'button button | ' +
    'button toggleButton | ' +
    'button toggleButton | ' +
    'custom button button button | ' +
    'custom button | ' +
    'custom | ' +
    'button | ' +
    'button | ' +
    'custom';

  @ViewChild('toolbar') toolbar!: jqxToolBarComponent;

  constructor(
    private readonly componentService: ComponentService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly uiStateService: UiStateService,
    private readonly undoManagerService: UndoManagerService,
  ) {
    this.initTools = this.initTools.bind(this);
  }

  initTools(_type?: string, index?: number, tool?: any, _menuToolIninitialization?: boolean): any {
    switch (index) {
      case Tools.NEW:
        WidgetHelper.initToolbarImgButton('Make new bridge', 'img/new.png', tool);
        break;
      case Tools.OPEN:
        WidgetHelper.initToolbarImgButton('Open an existing bridge', 'img/open.png', tool);
        break;
      case Tools.SAVE:
        WidgetHelper.initToolbarImgButton('Save current bridge', 'img/save.png', tool);
        break;
      case Tools.PRINT:
        WidgetHelper.initToolbarImgButton('Print current bridge', 'img/print.png', tool);
        break;
      case Tools.PRINT_3D:
        WidgetHelper.initToolbarImgButton('Export OBJ file to 3d print', 'img/print3d.png', tool);
        break;      
      case Tools.DESIGN:
        WidgetHelper.initToolbarImgToggleButton('Design bridge', 'img/design.png', tool, {
          toggled: true,
          disabled: true,
        });
        break;
      case Tools.LOAD_TEST:
        WidgetHelper.initToolbarImgToggleButton('Run a load test', 'img/loadtest.png', tool, { disabled: true });
        break;
      case Tools.SELECT_ALL:
        WidgetHelper.initToolbarImgButton('Select all', 'img/selectall.png', tool);
        break;
      case Tools.DELETE:
        WidgetHelper.initToolbarImgButton('Delete selection', 'img/delete.png', tool);
        break;
      case Tools.UNDO:
        WidgetHelper.initToolbarImgButton('Undo changes', 'img/undo.png', tool, true);
        break;
      case Tools.UNDO_MULTIPLE:
        WidgetHelper.initToolbarImgToggleButton('Undo multiple changes', 'img/drop.png', tool, { disabled: true });
        const undoDropdown = UndoRedoDropdownComponent.appendDropdownTool(tool);
        const undoComponentRef = this.componentService.load(UndoRedoDropdownComponent, undoDropdown);
        undoComponentRef.setInput('operation', 'Undo');
        undoComponentRef.setInput('actionEmitter', this.eventBrokerService.undoRequest);
        undoComponentRef.instance.initialize(tool, this.undoManagerService.done);
        break;
      case Tools.REDO:
        WidgetHelper.initToolbarImgButton('Redo undone changes', 'img/redo.png', tool, true);
        break;
      case Tools.REDO_MULTIPLE:
        WidgetHelper.initToolbarImgToggleButton('Redo multiple changes', 'img/drop.png', tool, { disabled: true });
        const redoDropdown = UndoRedoDropdownComponent.appendDropdownTool(tool);
        const redoComponentRef = this.componentService.load(UndoRedoDropdownComponent, redoDropdown);
        redoComponentRef.setInput('operation', 'Redo');
        redoComponentRef.setInput('actionEmitter', this.eventBrokerService.redoRequest);
        redoComponentRef.instance.initialize(tool, this.undoManagerService.undone);
        break;
      case Tools.ITERATION:
        this.componentService.load(IterationIndicatorComponent, tool[0]);
        break;
      case Tools.BACK_ITERATION:
        WidgetHelper.initToolbarImgButton('To previous iteration', 'img/left.png', tool, true);
        break;
      case Tools.FORWARD_ITERATION:
        WidgetHelper.initToolbarImgButton('To next iteration', 'img/right.png', tool, true);
        break;
      case Tools.GOTO_ITERATION:
        WidgetHelper.initToolbarImgButton('Choose a previous iteration', 'img/goto.png', tool);
        break;
      case Tools.COST:
        this.componentService.load(CostIndicatorComponent, tool[0]);
        break;
      case Tools.COST_REPORT:
        WidgetHelper.initToolbarImgButton('Show cost details', 'img/calculator.png', tool);
        break;
      case Tools.STATUS:
        this.componentService.load(StatusIndicatorComponent, tool[0]);
        break;
      case Tools.LOAD_TEST_REPORT:
        WidgetHelper.initToolbarImgButton('Show load test details', 'img/loadtestreport.png', tool, true);
        break;
      case Tools.MEMBER_DETAILS_REPORT:
        WidgetHelper.initToolbarImgButton('Show member analysis', 'img/memberreport.png', tool, true);
        break;
      case Tools.DEBUG_DISPLAY:
        this.componentService.load(DebugDisplayComponent, tool[0]);
        break;
    }
    return { minimizable: false, menuTool: false };
  }

  ngAfterViewInit(): void {
    const tools = this.toolbar.getTools();
    const eventBroker = this.eventBrokerService;
    this.uiStateService.registerSelectToolbarButtons(
      tools,
      [Tools.DESIGN, Tools.LOAD_TEST],
      eventBroker.designModeSelection,
    );
    this.uiStateService.registerPlainToolbarButton(tools[Tools.BACK_ITERATION], eventBroker.designIterationBackRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.COST_REPORT], eventBroker.costReportRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.DELETE], eventBroker.deleteSelectionRequest);
    this.uiStateService.registerPlainToolbarButton(
      tools[Tools.FORWARD_ITERATION],
      eventBroker.designIterationForwardRequest,
    );
    this.uiStateService.registerPlainToolbarButton(tools[Tools.GOTO_ITERATION], eventBroker.loadDesignIterationRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.LOAD_TEST_REPORT], eventBroker.analysisReportRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.MEMBER_DETAILS_REPORT], eventBroker.memberDetailsReportRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.NEW], eventBroker.newDesignRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.OPEN], eventBroker.loadBridgeFileRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.PRINT], eventBroker.printRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.PRINT_3D], eventBroker.print3dRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.REDO], eventBroker.redoRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.SAVE], eventBroker.saveBridgeFileRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.SELECT_ALL], eventBroker.selectAllRequest);
    this.uiStateService.registerPlainToolbarButton(tools[Tools.UNDO], eventBroker.undoRequest);
    this.uiStateService.addWidgetDisabler(eventBroker.redoRequest, disable => {
      const tools = this.toolbar.getTools();
      tools[Tools.REDO_MULTIPLE].tool.jqxToggleButton({ disabled: disable });
    });
    this.uiStateService.addWidgetDisabler(eventBroker.undoRequest, disable => {
      const tools = this.toolbar.getTools();
      tools[Tools.UNDO_MULTIPLE].tool.jqxToggleButton({ disabled: disable });
    });
  }
}
