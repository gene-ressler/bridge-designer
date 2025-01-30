import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { SampleSelectionDialogComponent } from './features/sample-bridge/sample-selection-dialog/sample-selection-dialog.component';
import { SetupWizardComponent } from './features/setup/setup-wizard/setup-wizard.component';
import { RulerComponent } from './features/drafting/ruler/ruler.component';
import { EventBrokerService } from './shared/services/event-broker.service';
import { MemberTableComponent } from './features/drafting/member-table/member-table.component';
import { TemplateSelectionDialogComponent } from './features/template/template-selection-dialog/template-selection-dialog.component';
import { WorkflowManagementService } from './features/controls/management/workflow-management.service';
import { UnstableBridgeDialogComponent } from './features/testing/unstable-bridge-dialog/unstable-bridge-dialog.component';

// ¯\_(ツ)_/¯

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DraftingPanelComponent,
    MemberTableComponent,
    MenusComponent,
    RulerComponent,
    SampleSelectionDialogComponent,
    SetupWizardComponent,
    TemplateSelectionDialogComponent,
    ToolbarAComponent,
    ToolbarBComponent,
    UnstableBridgeDialogComponent,
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
export class AppComponent implements AfterViewInit {
  @ViewChild('leftRuler') leftRuler!: RulerComponent;
  @ViewChild('bottomRuler') bottomRuler!: RulerComponent;
  @ViewChild('memberTable') memberTable!: MemberTableComponent;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    _workflowManagementService: WorkflowManagementService, // Instantiate only.
  ) {}

  ngAfterViewInit(): void {
    this.eventBrokerService.rulersToggle.subscribe(info => {
      this.leftRuler.visible = this.bottomRuler.visible = info.data;
    });
    this.eventBrokerService.memberTableToggle.subscribe(info => {
      this.memberTable.visible = info.data;
    });
  }
}
