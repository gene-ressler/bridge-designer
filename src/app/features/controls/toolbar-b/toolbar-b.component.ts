import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { InventorySelectorComponent } from '../../../shared/components/inventory-selector/inventory-selector.component';
import { ComponentService } from '../../../shared/core/component.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../management/ui-state.service';

const enum Tools {
  INVENTORY_SELECTOR,
  SIZE_UP,
  SIZE_DOWN,
  MEMBER_TABLE,
  MEMBER_NUMBERS,
  GUIDES,
  TEMPLATE,
  COARSE_GRID,
  MEDIUM_GRID,
  FINE_GRID,
}

@Component({
  selector: 'toolbar-b',
  standalone: true,
  imports: [jqxToolBarModule, jqxDropDownListModule],
  templateUrl: './toolbar-b.component.html',
  styleUrl: './toolbar-b.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarBComponent implements AfterViewInit {
  readonly tools: string =
    'custom | ' +
    'button button | ' +
    'toggleButton toggleButton toggleButton toggleButton | ' +
    'toggleButton toggleButton toggleButton';

  @ViewChild('toolbar') toolbar!: jqxToolBarComponent;

  constructor(
    private readonly uiStateService: UiStateService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly componentService: ComponentService,
  ) {
    this.initTools = this.initTools.bind(this);
  }

  initTools(_type?: string, index?: number, tool?: any, _menuToolIninitialization?: boolean) {
    switch (index) {
      case Tools.INVENTORY_SELECTOR:
        this.componentService.load(InventorySelectorComponent, tool[0]);
        break;
      case Tools.SIZE_UP:
        WidgetHelper.initToolbarImgButton('Upsize selected members', 'img/sizeup.png', tool, true);
        break;
      case Tools.SIZE_DOWN:
        WidgetHelper.initToolbarImgButton('Downsize selected members', 'img/sizedown.png', tool, true);
        break;
      case Tools.MEMBER_TABLE:
        WidgetHelper.initToolbarImgToggleButton('Show/hide member table', 'img/memtable.png', tool, { toggled: true });
        break;
      case Tools.MEMBER_NUMBERS:
        WidgetHelper.initToolbarImgButton('Show/hide member numbers', 'img/numbers.png', tool);
        break;
      case Tools.GUIDES:
        WidgetHelper.initToolbarImgToggleButton('Show/hide drawing guides', 'img/guides.png', tool);
        break;
      case Tools.TEMPLATE:
        WidgetHelper.initToolbarImgToggleButton('Show/hide template', 'img/template.png', tool, { toggled: true });
        break;
      case Tools.COARSE_GRID:
        WidgetHelper.initToolbarImgToggleButton('Use coarse drawing grid', 'img/coarsegrid.png', tool, {
          toggled: true,
        });
        break;
      case Tools.MEDIUM_GRID:
        WidgetHelper.initToolbarImgToggleButton('Use medium drawing grid', 'img/mediumgrid.png', tool);
        break;
      case Tools.FINE_GRID:
        WidgetHelper.initToolbarImgToggleButton('Use fine drawing grid', 'img/finegrid.png', tool);
        break;
    }
    return { minimizable: false, menuTool: false };
  }

  ngAfterViewInit(): void {
    const tools = this.toolbar.getTools();
    const gridTools = [Tools.COARSE_GRID, Tools.MEDIUM_GRID, Tools.FINE_GRID];
    const uiState = this.uiStateService;
    uiState.registerSelectToolbarButtons(tools, gridTools, this.eventBrokerService.gridDensitySelection);
    uiState.registerPlainToolbarButton(tools[Tools.SIZE_DOWN], this.eventBrokerService.memberSizeDecreaseRequest);
    uiState.registerPlainToolbarButton(tools[Tools.SIZE_UP], this.eventBrokerService.memberSizeIncreaseRequest);
    uiState.registerToggleToolbarButton(tools[Tools.MEMBER_TABLE], this.eventBrokerService.memberTableToggle);
    uiState.registerToggleToolbarButton(tools[Tools.MEMBER_NUMBERS], this.eventBrokerService.memberNumbersToggle);
    uiState.registerToggleToolbarButton(tools[Tools.GUIDES], this.eventBrokerService.guidesToggle);
    uiState.registerToggleToolbarButton(tools[Tools.TEMPLATE], this.eventBrokerService.templateToggle);
  }
}
