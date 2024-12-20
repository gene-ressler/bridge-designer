import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { ComponentService } from '../../../shared/services/component.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../../drafting/services/ui-state.service';
import { UndoManagerService } from '../../drafting/services/undo-manager.service';
import { UndoRedoDropdownComponent } from '../undo-redo-dropdown/undo-redo-dropdown.component';

const enum Tools {
  NEW,
  OPEN,
  SAVE,
  PRINT,
  DESIGN,
  LOAD_TEST,
  SELECT_ALL,
  DELETE,
  UNDO,
  UNDO_MULTIPLE,
  REDO,
  REDO_MULTIPLE,
  ITERATION,
  PREVIOUS_ITERATION,
  NEXT_ITERATION,
  COST,
  COST_DETAILS,
  STATUS,
  LOAD_TEST_REPORT,
}

@Component({
  selector: 'toolbar-a',
  standalone: true,
  imports: [jqxToolBarModule],
  templateUrl: './toolbar-a.component.html',
  styleUrl: './toolbar-a.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarAComponent implements AfterViewInit {
  @ViewChild('toolbar') toolbar!: jqxToolBarComponent;

  tools: string =
    'button button button button | ' +
    'toggleButton toggleButton | ' +
    'button button | ' +
    'button toggleButton | ' +
    'button toggleButton | ' +
    'custom button button | ' +
    'custom button | ' +
    'custom | ' +
    'button';

  constructor(
    private readonly undoManagerService: UndoManagerService,
    private readonly componentService: ComponentService,
    private readonly uiStateService: UiStateService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.initTools = this.initTools.bind(this);
  }

  initTools(_type?: string, index?: number, tool?: any, _menuToolIninitialization?: boolean) {
    switch (index) {
      case Tools.NEW:
        WidgetHelper.initToolbarImgButton('Make new bridge', 'img/new.png', tool);
        WidgetHelper.sendEventOnClick(this.eventBrokerService.newDesignRequest, tool);
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
      case Tools.DESIGN:
        WidgetHelper.initToolbarImgToggleButton('Design bridge', 'img/design.png', tool);
        break;
      case Tools.LOAD_TEST:
        WidgetHelper.initToolbarImgToggleButton('Load test bridge', 'img/loadtest.png', tool);
        break;
      case Tools.SELECT_ALL:
        WidgetHelper.initToolbarImgButton('Select all', 'img/selectall.png', tool);
        WidgetHelper.sendEventOnClick(this.eventBrokerService.selectAllRequest, tool);
        break;
      case Tools.DELETE:
        WidgetHelper.initToolbarImgButton('Delete selection', 'img/delete.png', tool);
        WidgetHelper.sendEventOnClick(this.eventBrokerService.deleteSelectionRequest, tool);
        break;
      case Tools.UNDO:
        WidgetHelper.initToolbarImgButton('Undo changes', 'img/undo.png', tool, true);
        WidgetHelper.sendEventOnClick(this.eventBrokerService.undoRequest, tool);
        break;
      case Tools.UNDO_MULTIPLE:
        WidgetHelper.initToolbarImgToggleButton('Undo multiple changes', 'img/drop.png', tool, true);
        const undoDropdown = UndoRedoDropdownComponent.appendDropdownTool(tool);
        const undoComponentRef = this.componentService.load(UndoRedoDropdownComponent, undoDropdown);
        undoComponentRef.setInput('operation', 'Undo');
        undoComponentRef.setInput('actionEmitter', this.eventBrokerService.undoRequest);
        undoComponentRef.instance.initialize(tool, this.undoManagerService.done);
        break;
      case Tools.REDO:
        WidgetHelper.initToolbarImgButton('Redo undone changes', 'img/redo.png', tool, true);
        WidgetHelper.sendEventOnClick(this.eventBrokerService.redoRequest, tool);
        break;
      case Tools.REDO_MULTIPLE:
        WidgetHelper.initToolbarImgToggleButton('Redo multiple changes', 'img/drop.png', tool, true);
        const redoDropdown = UndoRedoDropdownComponent.appendDropdownTool(tool);
        const redoComponentRef = this.componentService.load(UndoRedoDropdownComponent, redoDropdown);
        redoComponentRef.setInput('operation', 'Redo');
        redoComponentRef.setInput('actionEmitter', this.eventBrokerService.redoRequest);
        redoComponentRef.instance.initialize(tool, this.undoManagerService.undone);
        break;
      case Tools.ITERATION:
        tool.append('<div style="padding: 3px;"><div></div></div>');
        const tree = tool.children().children();
        const source = [{ label: 'Iteration 1' }, { label: 'Iteration 2' }];
        tree.jqxTree({ width: 200, source: source });
        tool.jqxDropDownButton({
          width: 100,
          height: 28,
          initContent: function () {
            tool.jqxDropDownButton('setContent', '<div style="padding: 4px;">Iteration 1</div>');
          },
        });
        tool.jqxDropDownButton('setContent', '<div style="padding: 4px;">Iteration 1</div>');
        break;
      case Tools.PREVIOUS_ITERATION:
        WidgetHelper.initToolbarImgButton('To previous iteration', 'img/left.png', tool);
        break;
      case Tools.NEXT_ITERATION:
        WidgetHelper.initToolbarImgButton('To next iteration', 'img/right.png', tool);
        break;
      case Tools.COST:
        tool.append('<div style="line-height: 32px; padding: 0px 8px"></div>');
        const cost = tool.children();
        cost.text('$123,456');
        break;
      case Tools.COST_DETAILS:
        WidgetHelper.initToolbarImgButton('Show cost details', 'img/calculator.png', tool);
        break;
      case Tools.STATUS:
        const imgSrc = 'img/working.png';
        const imgTitle = 'Work in progress';
        tool.append(
          '<div style="display:flex; align-items:center; margin:4px 8px">' +
            '<span style="margin-right:2px;">Status:</span><img style="vertical-align:middle" src="' +
            imgSrc +
            '" title="' +
            imgTitle +
            '"/></div>',
        );
        break;
      case Tools.LOAD_TEST_REPORT:
        WidgetHelper.initToolbarImgButton('Show load test details', 'img/loadtestreport.png', tool);
        break;
    }
    return { minimizable: false, menuTool: false };
  }

  private disableUndo(value: boolean = true) {
    const tools = this.toolbar.getTools();
    tools[Tools.UNDO].tool.jqxButton({ disabled: value });
    tools[Tools.UNDO_MULTIPLE].tool.jqxToggleButton({ disabled: value });
  }

  private disableRedo(value: boolean = true) {
    const tools = this.toolbar.getTools();
    tools[Tools.REDO].tool.jqxButton({ disabled: value });
    tools[Tools.REDO_MULTIPLE].tool.jqxToggleButton({ disabled: value });
  }

  ngAfterViewInit(): void {
    this.uiStateService.registerSelectToolbarButtons(
      this.toolbar.getTools(),
      [Tools.DESIGN, Tools.LOAD_TEST],
      this.eventBrokerService.designModeSelection,
    );
    this.eventBrokerService.undoManagerStateChange.subscribe(info => {
      this.disableUndo(info.data.doneCount === 0);
      this.disableRedo(info.data.undoneCount === 0);
    });
  }
}
