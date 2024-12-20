import {
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { jqxGridModule } from 'jqwidgets-ng/jqxgrid';
import { jqxMenuModule } from 'jqwidgets-ng/jqxmenu';
import { jqxRibbonModule } from 'jqwidgets-ng/jqxribbon';
import { jqxToolBarModule } from 'jqwidgets-ng/jqxtoolbar';
import { jqxTreeModule } from 'jqwidgets-ng/jqxtree';
import { jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxButtonGroupModule } from 'jqwidgets-ng/jqxbuttongroup';
import { jqxDropDownButtonModule } from 'jqwidgets-ng/jqxdropdownbutton';
import { jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { DraftingPanelComponent } from './features/drafting/drafting-panel/drafting-panel.component';
import { MenusComponent } from './features/controls/menus/menus.component';
import { ToolbarAComponent } from './features/controls/toolbar-a/toolbar-a.component';
import { ToolbarBComponent } from './features/controls/toolbar-b/toolbar-b.component';
import { SampleSelectionDialogComponent } from './features/sample-bridges/sample-selection-dialog/sample-selection-dialog.component';
import { SetupWizardComponent } from './features/setup/setup-wizard/setup-wizard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DraftingPanelComponent,
    MenusComponent,
    SampleSelectionDialogComponent,
    SetupWizardComponent,
    ToolbarAComponent,
    ToolbarBComponent,
    jqxDropDownButtonModule,
    jqxDropDownListModule,
    jqxGridModule,
    jqxMenuModule,
    jqxRibbonModule,
    jqxToolBarModule,
    jqxTreeModule,
    jqxButtonModule, // don't reorder
    jqxButtonGroupModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  constructor() { }
}
