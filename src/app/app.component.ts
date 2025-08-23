import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, ViewEncapsulation } from '@angular/core';
import { AboutDialogComponent } from './features/about/about-dialog/about-dialog.component';
import { CostReportDialogComponent } from './features/costs/cost-report-dialog/cost-report-dialog.component';
import { DesignIterationDialogComponent } from './features/iterations/design-iteration-dialog/design-iteration-dialog.component';
import { DesignSaverLoaderComponent } from './features/save-load/design-saver-loader/design-saver-loader.component';
import { DraftingPanelComponent } from './features/drafting/drafting-panel/drafting-panel.component';
import { EventBrokerService, EventOrigin } from './shared/services/event-broker.service';
import { FlyThruPaneComponent } from './features/fly-thru/pane/fly-thru-pane.component';
import { HelpDialogComponent } from './features/help/help-dialog/help-dialog.component';
import { LoadTestReportDialogComponent } from './features/testing/load-test-report-dialog/load-test-report-dialog.component';
import { MemberEditDialogComponent } from './features/drafting/member-edit-dialog/member-edit-dialog.component';
import { MemberTableComponent } from './features/drafting/member-table/member-table.component';
import { MenusComponent } from './features/controls/menus/menus.component';
import { RulerComponent } from './features/drafting/ruler/ruler.component';
import { SampleSelectionDialogComponent } from './features/sample-bridge/sample-selection-dialog/sample-selection-dialog.component';
import { SessionStateService } from './shared/services/session-state.service';
import { SetupWizardComponent } from './features/setup/setup-wizard/setup-wizard.component';
import { SlendernessFailDialogComponent } from './features/testing/slenderness-fail-dialog/slenderness-fail-dialog.component';
import { TemplateSelectionDialogComponent } from './features/template/template-selection-dialog/template-selection-dialog.component';
import { TipDialogComponent } from './features/tips/tip-dialog/tip-dialog.component';
import { ToolbarAComponent } from './features/controls/toolbar-a/toolbar-a.component';
import { ToolbarBComponent } from './features/controls/toolbar-b/toolbar-b.component';
import { UnstableBridgeDialogComponent } from './features/testing/unstable-bridge-dialog/unstable-bridge-dialog.component';
import { WelcomeDialogComponent } from './features/welcome/welcome-dialog/welcome-dialog.component';
import { WorkflowManagementService } from './features/controls/management/workflow-management.service';
import { DrawingsService } from './features/drawings/drawings.service';

// ¯\_(ツ)_/¯

@Component({
  selector: 'app-root',
  imports: [
    AboutDialogComponent,
    CostReportDialogComponent,
    DesignIterationDialogComponent,
    DesignSaverLoaderComponent,
    DraftingPanelComponent,
    FlyThruPaneComponent,
    HelpDialogComponent,
    LoadTestReportDialogComponent,
    MemberEditDialogComponent,
    MemberTableComponent,
    MenusComponent,
    RulerComponent,
    SampleSelectionDialogComponent,
    SetupWizardComponent,
    SlendernessFailDialogComponent,
    TemplateSelectionDialogComponent,
    TipDialogComponent,
    ToolbarAComponent,
    ToolbarBComponent,
    UnstableBridgeDialogComponent,
    WelcomeDialogComponent,
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
    _drawingsService: DrawingsService, // Instantiate only.
    _workflowManagementService: WorkflowManagementService, // Instantiate only.
  ) {}

  /** Shows the drafting panel or hides it under a gray facade. */
  private showDraftingPanelCover(value: boolean): void {
    this.draftingAreaCover.nativeElement.style.display = value ? 'block' : 'none';
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
    this.eventBrokerService.uiModeRequest.subscribe(eventInfo =>
      this.showDraftingPanelCover(eventInfo.data === 'initial'),
    );
    // Let everyone know if session management is enabled. E.g. the menu checked status.
    this.sessionStateService.restoreSessionManagementEnabled();
    // Manage the welcome sequence if there is one. Send a completion event if we're rehydrating.
    // Not a clean place to handle this, but it's simplest.
    if (this.sessionStateService.hasRestoredState) {
      this.sessionStateService.notifyRestoreComplete();
    } else {
      this.eventBrokerService.uiModeRequest.next({ origin: EventOrigin.APP, data: 'initial' });
      this.eventBrokerService.tipRequest.next({ origin: EventOrigin.APP, data: 'startup' });
    }
  }

  /** Takes the welcome step of the startup tip+welcome sequence. */
  handleTipDialogClose({ isStartupTip }: { isStartupTip: boolean }) {
    if (isStartupTip) {
      this.eventBrokerService.welcomeRequest.next({ origin: EventOrigin.APP });
    }
  }
}
