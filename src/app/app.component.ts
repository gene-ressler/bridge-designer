import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { EventBrokerService, EventOrigin } from './shared/services/event-broker.service';
import { MemberTableComponent } from './features/drafting/member-table/member-table.component';
import { TemplateSelectionDialogComponent } from './features/template/template-selection-dialog/template-selection-dialog.component';
import { WorkflowManagementService } from './features/controls/management/workflow-management.service';
import { UnstableBridgeDialogComponent } from './features/testing/unstable-bridge-dialog/unstable-bridge-dialog.component';
import { LoadTestReportDialogComponent } from './features/testing/load-test-report-dialog/load-test-report-dialog.component';
import { CostReportDialogComponent } from './features/costs/cost-report-dialog/cost-report-dialog.component';
import { DesignIterationDialogComponent } from './features/iterations/design-iteration-dialog/design-iteration-dialog.component';
import { DesignConditionsService } from './shared/services/design-conditions.service';
import { WelcomeDialogComponent } from './features/welcome/welcome-dialog/welcome-dialog.component';
import { SessionStateService } from './shared/services/session-state.service';
import { UndoManagerSessionStateService } from './features/drafting/shared/undo-manager-session-state.service';
import { HelpDialogComponent } from './features/help/help-dialog/help-dialog.component';
import { SlendernessFailDialogComponent } from './features/testing/slenderness-fail-dialog/slenderness-fail-dialog.component';

// ¯\_(ツ)_/¯

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CostReportDialogComponent,
    DesignIterationDialogComponent,
    DraftingPanelComponent,
    HelpDialogComponent,
    LoadTestReportDialogComponent,
    MemberTableComponent,
    MenusComponent,
    RulerComponent,
    SampleSelectionDialogComponent,
    SetupWizardComponent,
    SlendernessFailDialogComponent,
    TemplateSelectionDialogComponent,
    ToolbarAComponent,
    ToolbarBComponent,
    UnstableBridgeDialogComponent,
    WelcomeDialogComponent,
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
  @ViewChild('draftingAreaCover') draftingAreaCover!: ElementRef<HTMLDivElement>;

  constructor(
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
    _undoManagerSessionStateService: UndoManagerSessionStateService, // Instantiate only.
    _workflowManagementService: WorkflowManagementService, // Instantiate only.
  ) {}

  /** Shows the drafting panel or hides it under a gray facade. */
  private showDraftingPanel(value: boolean): void {
    const coverStyle = this.draftingAreaCover.nativeElement.style;
    const toggleTools = (value: boolean) =>
      this.eventBrokerService.toolsToggle.next({ origin: EventOrigin.APP, data: value });
    if (value) {
      coverStyle.display = 'none';
      toggleTools(true);
    } else {
      coverStyle.display = 'block';
      toggleTools(false); // Ignores former user intent, but currently never happens. Cover can't be replaced.
    }
  }

  @HostListener('window:beforeunload')
  handleBeforUnload(): void {
    this.sessionStateService.saveState();
  }

  ngAfterViewInit(): void {
    // Toggle rulers visibility.
    this.eventBrokerService.rulersToggle.subscribe(info => {
      this.leftRuler.visible = this.bottomRuler.visible = info.data;
    });
    this.eventBrokerService.memberTableToggle.subscribe(info => {
      this.memberTable.visible = info.data;
    });
    // Cancel the cover over the drafting area when the user loads a bridge.
    this.eventBrokerService.loadBridgeRequest.subscribe(eventInfo => {
      this.showDraftingPanel(eventInfo.data.bridge.designConditions !== DesignConditionsService.PLACEHOLDER_CONDITIONS);
    });
    // Omit the welcome sequence and send a completion event if we're rehydrating.
    if (this.sessionStateService.isRehydrating) {
      this.showDraftingPanel(true);
      this.sessionStateService.notifyComplete();
    } else {
      this.showDraftingPanel(false);
    }
  }
}
