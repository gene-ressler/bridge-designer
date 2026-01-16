/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

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
import { MemberDetailsDialogComponent } from './features/member-details/member-details-dialog/member-details-dialog.component';
import { MemberEditDialogComponent } from './features/drafting/member-edit-dialog/member-edit-dialog.component';
import { MemberTableComponent } from './features/drafting/member-table/member-table.component';
import { MenusComponent } from './features/controls/menus/menus.component';
import { RulerComponent } from './features/drafting/ruler/ruler.component';
import { SampleSelectionDialogComponent } from './features/sample-bridge/sample-selection-dialog/sample-selection-dialog.component';
import { SessionStateService } from './features/session-state/session-state.service';
import { SetupWizardComponent } from './features/setup/setup-wizard/setup-wizard.component';
import { SlendernessFailDialogComponent } from './features/testing/slenderness-fail-dialog/slenderness-fail-dialog.component';
import { TemplateSelectionDialogComponent } from './features/template/template-selection-dialog/template-selection-dialog.component';
import { TipDialogComponent, TipDialogKind } from './features/tips/tip-dialog/tip-dialog.component';
import { ToolbarAComponent } from './features/controls/toolbar-a/toolbar-a.component';
import { ToolbarBComponent } from './features/controls/toolbar-b/toolbar-b.component';
import { UnstableBridgeDialogComponent } from './features/testing/unstable-bridge-dialog/unstable-bridge-dialog.component';
import { WelcomeDialogComponent } from './features/welcome/welcome-dialog/welcome-dialog.component';
import { WorkflowManagementService } from './features/controls/management/workflow-management.service';
import { DrawingsService } from './features/drawings/drawings.service';
import { Printing3dService } from './features/printing-3d/printing-3d.service';
import { Print3dDialogComponent } from './features/printing-3d/print-3d-dialog/print-3d-dialog.component';
import { MissingFeatureDisablerDialogComponent } from './features/browser/missing-feature-disabler-dialog/missing-feature-disabler-dialog.componet';
import { AllowFreshStartDialogComponent } from './features/session-state/allow-fresh-start-dialog/allow-fresh-start-dialog.component';
import { BridgeService } from './shared/services/bridge.service';
import { DesignConditionsService } from './shared/services/design-conditions.service';

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
    MemberDetailsDialogComponent,
    MemberEditDialogComponent,
    MemberTableComponent,
    MenusComponent,
    MissingFeatureDisablerDialogComponent,
    Print3dDialogComponent,
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
    AllowFreshStartDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('allowFreshStartDialog') allowFreshStartDialog!: AllowFreshStartDialogComponent;
  @ViewChild('bottomRuler') bottomRuler!: RulerComponent;
  @ViewChild('draftingAreaCover') draftingAreaCover!: ElementRef<HTMLDivElement>;
  @ViewChild('leftRuler') leftRuler!: RulerComponent;
  @ViewChild('memberTable') memberTable!: MemberTableComponent;
  @ViewChild('missingFeatureDisablerDialog') missingFeatureDisablerDialog!: MissingFeatureDisablerDialogComponent;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly sessionStateService: SessionStateService,
    _drawingsService: DrawingsService, // Instantiate only.
    _printing3dService: Printing3dService, // Instantiate only.
    _workflowManagementService: WorkflowManagementService, // Instantiate only.
  ) {}

  /** Shows the drafting panel or hides it under a gray facade. */
  private showDraftingPanelCover(value: boolean): void {
    this.draftingAreaCover.nativeElement.style.display = value ? 'block' : 'none';
  }

  @HostListener('window:beforeunload')
  handleBeforeUnload(): void {
    // Don't save state until the user has begun work on a bridge.
    if (this.bridgeService.designConditions !== DesignConditionsService.PLACEHOLDER_CONDITIONS) {
      this.sessionStateService.saveState();
    }
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
    // Not an obvious place to handle this, but it's simplest.
    if (this.sessionStateService.hasRestoredState) {
      this.sessionStateService.notifyRestoreComplete();
      // Quietly disable stuff for missing browser features. The user was informed earlier (more or less).
      this.missingFeatureDisablerDialog.disableFeatures();
      if (!this.sessionStateService.isCurrentStateReloaded) {
        // The dialog resets the app via redirect to ?reset or chains to a tip.
        this.allowFreshStartDialog.open();
      }
    } else {
      this.eventBrokerService.uiModeRequest.next({ origin: EventOrigin.APP, data: 'initial' });
      // The dialog chains to a tip request.
      this.missingFeatureDisablerDialog.disableAndInformUser();
    }
    this.handleUrlParameters();
  }

  /** Takes the welcome step of the startup tip+welcome sequence. */
  handleTipDialogClose(kind: TipDialogKind) {
    if (kind === 'startup') {
      this.eventBrokerService.welcomeRequest.next({ origin: EventOrigin.APP });
    }
  }

  /** Handles initial URL parameters then deletes them. */
  private handleUrlParameters(): void {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(window.location.search);
    const reset = 'reset';

    // Allow user to reset local storage with URL query string "?reset".
    if (params.get(reset) !== null) {
      // Probably already cleared. See SessionStateService.
      localStorage.clear();
      params.delete(reset);
    }

    // Show a help topic after all else is ready.
    const help = 'help';
    const helpTopic = params.get(help);
    if (helpTopic !== null) {
      const data = { topic: helpTopic || 'hlp_how_to' };
      this.eventBrokerService.helpRequest.next({ origin: EventOrigin.APP, data });
      params.delete(help);
    }

    // Update the browser's displayed URL without reloading.
    const resetUrl = `${url.origin}${url.pathname}?${params.toString()}`;
    window.history.pushState({}, '', resetUrl);
  }
}
