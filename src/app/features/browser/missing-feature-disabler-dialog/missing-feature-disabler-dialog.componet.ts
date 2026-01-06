import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UiStateService } from '../../controls/management/ui-state.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { BROWSER_FEATURES } from '../browser-checks';

/** 
 * A component for disabling features due to missing dialog capabilities, 
 * also a dialog for informing the user about that.
 * 
 * Unlike most dialogs, this one is used directly by the app, not via the event broker.
 */
@Component({
  selector: 'missing-feature-disabler-dialog',
  imports: [ConfirmationDialogComponent],
  templateUrl: './missing-feature-disabler-dialog.componet.html',
  styleUrl: './missing-feature-disabler-dialog.componet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingFeatureDisablerDialogComponet {
  contentHtml: string = '';

  @ViewChild('dialog') dialog!: ConfirmationDialogComponent;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
    private readonly uiStateService: UiStateService,
  ) {}

  handleOkButtonClick(): void {
    // This continues the app welcome sequence.
    this.showTipDialog();
  }

  private showTipDialog(): void {
    this.eventBrokerService.tipRequest.next({ origin: EventOrigin.APP, data: 'startup' });
  }

  public disableAndInformUser(): void {
    const disabled = this.disableFeatures();
    if (disabled.length === 0) {
      // Simulated user ack.
      this.handleOkButtonClick();
      return;
    }
    this.contentHtml = `<p>BridgeDesigner has disabled options your browser can't support:</p>
<ul>
${disabled.map(item => `<li>${item}</li>`).join('\n')}
</ul>
<p>Click Help... for more information.</p>
<p>This message won't be repeated.`;
    // Push text change to the confirmation dialog component.
    this.changeDetectorRef.detectChanges();
    this.dialog.open();
  }

  /** Quietly disable features when user has already been warned. */
  public disableFeatures(): string[] {
    const disabled = [];
    if (!BROWSER_FEATURES.webAssembly) {
      disabled.push('Export for 3d printing requires WebAssembly.');
      this.uiStateService.globallyDisable(this.eventBrokerService.print3dRequest);
    }
    if (!BROWSER_FEATURES.webgl2) {
      disabled.push('Fly-thru load test animation requires WebGL2.');
      // First toggle off, then disable.
      this.eventBrokerService.animationToggle.next({ origin: EventOrigin.MISSING_BROWSER_FEATURE_DIALOG, data: false });
      this.uiStateService.globallyDisable(this.eventBrokerService.animationToggle);
    }
    return disabled;
  }
}
