import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { jqxToolBarComponent, jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { InventorySelectorComponent } from '../../../shared/components/inventory-selector/inventory-selector.component';
import { ComponentService } from '../../../shared/core/component.service';

@Component({
  selector: 'toolbar-exp',
  standalone: true,
  imports: [
    jqxToolBarModule,
    InventorySelectorComponent,
  ],
  templateUrl: './toolbar-exp.component.html',
  styleUrl: './toolbar-exp.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarExpComponent implements AfterViewInit {
  readonly initTools;
  tools = 'custom | button';

  @ViewChild('toolbar') toolbar!: jqxToolBarComponent;
  @ViewChild('toolbar', { read: ViewContainerRef }) toolbarContainerRef!: ViewContainerRef;

  constructor(componentService: ComponentService) {
    const initTools = (
      _type?: string,
      index?: number,
      tool?: any,
      _menuToolIninitialization?: boolean
    ) => {
      switch (index) {
        case 0:
          componentService.load(InventorySelectorComponent, tool[0]);
          break;
        case 1:
          WidgetHelper.initToolbarImgButton('Make new bridge', 'img/new.png', tool);
          break;
      }
      return { minimizable: false };
    };
    this.initTools = initTools.bind(this);
  }

  ngAfterViewInit(): void {
  }
}
