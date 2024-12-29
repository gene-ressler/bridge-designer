import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { jqxInputModule } from 'jqwidgets-ng/jqxinput';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxRadioButtonComponent, jqxRadioButtonModule } from 'jqwidgets-ng/jqxradiobutton';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { WidgetHelper } from '../../../shared/classes/widget-helper';
import { COUNT_FORMATTER, DOLLARS_FORMATTER } from '../../../shared/classes/utility';
import {
  DeckType,
  DesignConditions,
  DesignConditionsService,
  FixedCostSummary,
  LoadType,
} from '../../../shared/services/design-conditions.service';
import { CartoonRenderingService } from '../../../shared/services/cartoon-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import { DesignBridgeService } from '../../../shared/services/design-bridge.service';
import { CartoonSiteRenderingService } from '../../../shared/services/cartoon-site-rendering.service';
import { Graphics } from '../../../shared/classes/graphics';

@Component({
  selector: 'setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    jqxButtonModule,
    jqxDropDownListModule,
    jqxExpanderModule,
    jqxInputModule,
    jqxListBoxModule,
    jqxRadioButtonModule,
    jqxWindowModule,
  ],
  providers: [CartoonRenderingService, CartoonSiteRenderingService, ViewportTransform2D],
  templateUrl: './setup-wizard.component.html',
  styleUrl: './setup-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupWizardComponent implements AfterViewInit {
  private static readonly ALL_ARCH_HEIGHTS = [
    '24 meters',
    '20 meters',
    '16 meters',
    '12 meters',
    '8 meters',
    '4 meters',
  ];
  private static readonly ALL_DECK_ELEVATIONS = [
    '24 meters',
    '20 meters',
    '16 meters',
    '12 meters',
    '8 meters',
    '4 meters',
    '0 meters',
  ];
  private static readonly ALL_PIER_HEIGHTS = [
    '24 meters',
    '20 meters',
    '16 meters',
    '12 meters',
    '8 meters',
    '4 meters',
    '0 meters',
  ];
  private static readonly CARD_COUNT = 7;
  /** Pixel height of site cost dropdown. Can't reasonably be computed (until after it's needed). */
  private static readonly SITE_COST_DROPDOWN_HEIGHT = 115;

  private readonly cardElements: NodeListOf<HTMLElement>[] = new Array<NodeListOf<HTMLElement>>(
    SetupWizardComponent.CARD_COUNT,
  );
  private readonly designConditions: DesignConditions;

  archHeights: string[] = SetupWizardComponent.ALL_ARCH_HEIGHTS.slice();
  readonly buttonWidth = 80;
  readonly deckElevations = SetupWizardComponent.ALL_DECK_ELEVATIONS.slice();
  readonly edition = 'Cloud edition';
  pierHeights: string[] = SetupWizardComponent.ALL_PIER_HEIGHTS.slice();
  readonly templates = ['&lt;none&gt;', 'Through truss - Howe'];

  private cardIndex: number = 0;

  dialogHeight: number = 594;
  dialogWidth: number = 850;
  toDollars = DOLLARS_FORMATTER.format;
  toCount = COUNT_FORMATTER.format;

  @ViewChild('archAbutmentsButton') archAbutmentsButton!: jqxRadioButtonComponent;
  @ViewChild('archHeightList') archHeightList!: jqxDropDownListComponent;
  @ViewChild('backButton') backButton!: jqxButtonComponent;
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;
  @ViewChild('deckElevationList') deckElevationList!: jqxDropDownListComponent;
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('elevationCanvas') elevationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('finishButton') finishButton!: jqxButtonComponent;
  @ViewChild('highStrengthConcreteButton') highStrengthConcreteButton!: jqxRadioButtonComponent;
  @ViewChild('isPierButton') isPierButton!: jqxRadioButtonComponent;
  @ViewChild('localContestCodeInput') localContestCodeInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mediumStrengthConcreteButton') mediumStrengthConcreteButton!: jqxRadioButtonComponent;
  @ViewChild('nextButton') nextButton!: jqxButtonComponent;
  @ViewChild('noAnchoragesButton') noAnchoragesButton!: jqxRadioButtonComponent;
  @ViewChild('noPierButton') noPierButton!: jqxRadioButtonComponent;
  @ViewChild('oneAnchorageButton') oneAnchorageButton!: jqxRadioButtonComponent;
  @ViewChild('permitTruckLoad') permitTruckLoad!: jqxRadioButtonComponent;
  @ViewChild('pierHeightDropDownList') pierHeightList!: jqxDropDownListComponent;
  @ViewChild('projectIdSiteConditionsCode') projectIdSiteConditionsCode!: ElementRef<HTMLSpanElement>;
  @ViewChild('standardAbutmentsButton') standardAbutmentsButton!: jqxRadioButtonComponent;
  @ViewChild('standardTruckLoad') standardTruckLoad!: jqxRadioButtonComponent;
  @ViewChild('twoAnchoragesButton') twoAnchoragesButton!: jqxRadioButtonComponent;

  constructor(
    private readonly designBridgeService: DesignBridgeService,
    private readonly cartoonRenderingService: CartoonRenderingService,
    private readonly viewportTransform: ViewportTransform2D,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.designConditions = designBridgeService.designConditions;
  }

  /** Sets up widgets directly associated with bridge service design conditions. */
  private setWidgetsFromDesignConditions(): void {
    const conditions = this.designConditions;

    // Deck elevation
    const deckElevationIndex = Math.trunc((24 - conditions.deckElevation) / 4);
    this.deckElevationList.selectIndex(deckElevationIndex);

    // Support: standard or arch with height
    if (conditions.isArch) {
      this.archAbutmentsButton.check();
      const archHeightIndex = Math.trunc((24 - conditions.archHeight) / 4);
      this.archHeightList.selectIndex(archHeightIndex);
    } else {
      this.standardAbutmentsButton.check();
    }

    // Pier: is with height or no
    if (conditions.isPier) {
      this.isPierButton.check();
      const pierHeightIndex = Math.trunc((24 - conditions.pierHeight) / 4);
      this.pierHeightList.selectIndex(pierHeightIndex);
    } else {
      this.noPierButton.check();
    }

    // Anchorages: 0, 1, or 2
    if (conditions.anchorageCount == 2) {
      this.twoAnchoragesButton.check();
    } else if (conditions.anchorageCount == 1) {
      this.oneAnchorageButton.check();
    } else {
      this.noAnchoragesButton.check();
    }

    // Deck type
    if (conditions.deckType === DeckType.MEDIUM_STRENGTH) {
      this.mediumStrengthConcreteButton.check();
    } else {
      this.highStrengthConcreteButton.check();
    }

    // Load type
    if (conditions.loadType === LoadType.STANDARD_TRUCK) {
      this.standardTruckLoad.check();
    } else {
      this.permitTruckLoad.check();
    }

    // Widgets that depend on ones already initialized.
    this.setDependentWidgets();
  }

  public getDesignConditionsFromWidgets(): DesignConditions {
    const deckSelectedIndex = this.deckElevationList.getSelectedIndex();
    const archHeightSelectedIndex = this.archHeightList.getSelectedIndex() + deckSelectedIndex;
    const pierSelectedIndex = this.pierHeightList.getSelectedIndex() + deckSelectedIndex;
    const key = DesignConditions.getSetupKey(
      24 - 4 * deckSelectedIndex,
      this.archAbutmentsButton.checked() ? 24 - 4 * archHeightSelectedIndex : -1,
      this.isPierButton.checked() ? 24 - 4 * pierSelectedIndex : -1,
      this.oneAnchorageButton.checked() ? 1 : this.twoAnchoragesButton.checked() ? 2 : 0,
      this.standardTruckLoad.checked() ? LoadType.STANDARD_TRUCK : LoadType.HEAVY_TRUCK,
      this.highStrengthConcreteButton.checked() ? DeckType.HIGH_STRENGTH : DeckType.MEDIUM_STRENGTH,
    );
    const conditions = DesignConditionsService.STANDARD_CONDITIONS_FROM_SETUP_KEY.get(key);
    if (!conditions) {
      throw new Error(`No conditions for key ${key}`);
    }
    return conditions;
  }

  /** Sets up widgets that depend on those directly associated with design conditions. */
  private setDependentWidgets(): void {}

  private setCardDisplay(index: number, value: string = ''): void {
    this.cardElements[index].forEach(element => (element.style.display = value));
  }

  private goToCard(newCardIndex: number): void {
    if (newCardIndex < 0 || newCardIndex >= this.cardElements.length) {
      return;
    }
    this.setCardDisplay(this.cardIndex, 'none');
    this.setCardDisplay(newCardIndex);
    this.backButton.disabled(newCardIndex == 0);
    this.nextButton.disabled(newCardIndex == SetupWizardComponent.CARD_COUNT - 1);
    this.cardIndex = newCardIndex;
  }

  get costSummary(): FixedCostSummary {
    return this.designConditions.fixedCostSummary as FixedCostSummary;
  }

  archAbutmentSelectHandler(event: any): void {
    WidgetHelper.disableDropDownList(this.archHeightList, !event.args.checked);
  }

  backButtonOnClickHandler(): void {
    this.goToCard(this.cardIndex - 1);
  }

  private selectedElevationIndex: number = 0;

  deckElevationSelectHandler(event: any): void {
    const index = event.args.index;
    const elevationIndexChange = index - this.selectedElevationIndex;
    if (elevationIndexChange === 0) {
      return;
    }
    this.selectedElevationIndex = index;

    // Handle deck elevations high enough for an arch and not.
    var isArchHeightListDisabled: boolean | undefined;
    var selectedArchIndex: number | undefined;
    if (index < SetupWizardComponent.ALL_ARCH_HEIGHTS.length) {
      selectedArchIndex = Math.max(0, this.archHeightList.selectedIndex() - elevationIndexChange);
      this.archHeights = SetupWizardComponent.ALL_ARCH_HEIGHTS.slice(index);
      this.archAbutmentsButton.enable();
      isArchHeightListDisabled = this.archHeightList.disabled();
    } else {
      this.archHeightList.setContent('');
      this.standardAbutmentsButton.check();
      this.archAbutmentsButton.disable();
      isArchHeightListDisabled = true;
    }

    const selectedPierIndex = Math.max(0, this.pierHeightList.selectedIndex() - elevationIndexChange);
    const isPierHeightListDisabled = this.pierHeightList.disabled();
    this.pierHeights = SetupWizardComponent.ALL_PIER_HEIGHTS.slice(index);

    // Restore after [source] change detection has completed.
    setTimeout(() => {
      this.archHeightList.disabled(isArchHeightListDisabled);
      this.pierHeightList.disabled(isPierHeightListDisabled);
      if (selectedArchIndex !== undefined) {
        console.log(`Set arch: ${selectedArchIndex}`);
        this.archHeightList.selectIndex(selectedArchIndex);
      }
      console.log(`Set pier: ${selectedPierIndex}`);
      this.pierHeightList.selectIndex(selectedPierIndex);
    });
  }

  finishButtonOnClickHandler(): void {
    this.dialog.close();
  }

  helpButtonOnClickHandler(): void {
    this.setWidgetsFromDesignConditions();
    // console.log(DesignConditionsService.STANDARD_CONDITIONS);
    // TODO: URL is a placeholder. Put the real help link here.
    // window.open('https://google.com', '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  localContestRadioYesHandler(event: any) {
    this.localContestCodeInput.nativeElement.disabled = !event.args.checked;
  }

  nextButtonOnClickHandler(): void {
    this.goToCard(this.cardIndex + 1);
  }

  pierSelectHandler(event: any): void {
    WidgetHelper.disableDropDownList(this.pierHeightList, !event.args.checked);
  }

  siteCostExpandingHandler() {
    this.dialogHeight += SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  siteCostCollapsedHandler() {
    this.dialogHeight -= SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  private get elevationCtx(): CanvasRenderingContext2D {
    return Graphics.getContext(this.elevationCanvas);
  }

  private renderElevation(): void {
    this.cartoonRenderingService.render(this.elevationCtx);
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.newDesignRequest.subscribe(_info => this.dialog.open());
    // Find all the elements associated with cards and hide all but card-1.
    for (var i: number = 0; i < SetupWizardComponent.CARD_COUNT; ++i) {
      this.cardElements[i] = this.content.nativeElement.querySelectorAll(`.card-${i + 1}`);
      if (i !== this.cardIndex) {
        this.setCardDisplay(i, 'none');
      }
    }
    const canvas = this.elevationCtx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.viewportTransform.setWindow(this.designBridgeService.siteInfo.drawingWindow);
    this.renderElevation();
  }
}
