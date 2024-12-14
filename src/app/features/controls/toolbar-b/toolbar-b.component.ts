import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { InventorySelectorComponent } from '../../../shared/components/inventory-selector/inventory-selector.component';
import { ComponentService } from '../../../shared/services/component.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { UiStateService } from '../../drafting/services/ui-state.service';

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
    private readonly componentService: ComponentService
  ) {
    this.initTools = this.initTools.bind(this);
  }

  initTools(
    _type?: string,
    index?: number,
    tool?: any,
    _menuToolIninitialization?: boolean
  ) {
    switch (index) {
      case Tools.INVENTORY_SELECTOR:
        this.componentService.load(InventorySelectorComponent, tool[0]);
        break;
      case Tools.SIZE_UP:
        WidgetHelper.initToolbarImgButton(
          'Upsize selected members',
          'img/sizeup.png',
          tool
        );
        break;
      case Tools.SIZE_DOWN:
        WidgetHelper.initToolbarImgButton(
          'Downsize selected members',
          'img/sizedown.png',
          tool
        );
        break;
      case Tools.MEMBER_TABLE:
        WidgetHelper.initToolbarImgButton(
          'Show/hide member table',
          'img/memtable.png',
          tool
        );
        break;
      case Tools.MEMBER_NUMBERS:
        WidgetHelper.initToolbarImgButton(
          'Show/hide member numbers',
          'img/numbers.png',
          tool
        );
        break;
      case Tools.GUIDES:
        WidgetHelper.initToolbarImgButton(
          'Show/hide drawing guides',
          'img/guides.png',
          tool
        );
        break;
      case Tools.TEMPLATE:
        WidgetHelper.initToolbarImgButton(
          'Show/hide template',
          'img/template.png',
          tool
        );
        break;
      case Tools.COARSE_GRID:
        WidgetHelper.initToolbarImgButton(
          'Use coarse drawing grid',
          'img/coarsegrid.png',
          tool
        );
        break;
      case Tools.MEDIUM_GRID:
        WidgetHelper.initToolbarImgButton(
          'Use medium drawing grid',
          'img/mediumgrid.png',
          tool
        );
        break;
      case Tools.FINE_GRID:
        WidgetHelper.initToolbarImgButton(
          'Use fine drawing grid',
          'img/finegrid.png',
          tool
        );
        break;
    }
    return { minimizable: false };
  }

  ngAfterViewInit(): void {
    const tools = this.toolbar.getTools();
    this.uiStateService.registerSelectToolbarButtons(
      tools,
      [Tools.COARSE_GRID, Tools.MEDIUM_GRID, Tools.FINE_GRID],
      this.eventBrokerService.gridDensitySelection
    );
    this.uiStateService.registerToggleToobarButton(
      tools[Tools.MEMBER_TABLE],
      this.eventBrokerService.memberTableToggle
    );
    this.uiStateService.registerToggleToobarButton(
      tools[Tools.MEMBER_NUMBERS],
      this.eventBrokerService.memberNumbersToggle
    );
    this.uiStateService.registerToggleToobarButton(
      tools[Tools.GUIDES],
      this.eventBrokerService.guidesToggle
    );
    this.uiStateService.registerToggleToobarButton(
      tools[Tools.TEMPLATE],
      this.eventBrokerService.templateToggle
    );
  }
}
