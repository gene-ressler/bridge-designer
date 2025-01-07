import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxExpanderComponent, jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { jqxInputModule } from 'jqwidgets-ng/jqxinput';
import { jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxRadioButtonComponent, jqxRadioButtonModule } from 'jqwidgets-ng/jqxradiobutton';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
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
import { HeightListComponent } from '../height-list/height-list.component';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { CardService, DeckCartoonSrc, LegendItemName, SetupWizardCardView } from './card-service';
import { LocalContestCodeInputComponent } from '../local-contest-code-input/local-contest-code-input.component';

@Component({
  selector: 'setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    HeightListComponent,
    jqxButtonModule,
    jqxDropDownListModule,
    jqxExpanderModule,
    jqxInputModule,
    jqxListBoxModule,
    jqxRadioButtonModule,
    jqxWindowModule,
    LocalContestCodeInputComponent,
  ],
  providers: [
    CardService,
    CartoonRenderingService,
    CartoonSiteRenderingService,
    DesignBridgeService,
    ViewportTransform2D,
  ],
  templateUrl: './setup-wizard.component.html',
  styleUrl: './setup-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupWizardComponent implements AfterViewInit, SetupWizardCardView {
  private static readonly ALL_DECK_ELEVATIONS = [
    '24 meters',
    '20 meters',
    '16 meters',
    '12 meters',
    '8 meters',
    '4 meters',
    '0 meters',
  ];
  /** Pixel height of site cost dropdown. Can't reasonably be computed. */
  private static readonly SITE_COST_DROPDOWN_HEIGHT = 115;

  /** Elements with 'card-X' classes. Display style is set to switch cards. */
  private readonly cardElements: NodeListOf<HTMLElement>[] = new Array<NodeListOf<HTMLElement>>(CardService.CARD_COUNT);

  private readonly legendItemsByName = new Map<LegendItemName, HTMLDivElement>();

  readonly archHeights: string[] = SetupWizardComponent.ALL_DECK_ELEVATIONS.slice(0, -1);
  readonly buttonWidth = 80;
  deckCartoonSrc: DeckCartoonSrc = DeckCartoonSrc.NONE;
  readonly deckElevations = SetupWizardComponent.ALL_DECK_ELEVATIONS;
  readonly edition = 'Cloud edition';
  readonly pierHeights: string[] = SetupWizardComponent.ALL_DECK_ELEVATIONS;
  /** Local contest code or 4's followed by scenario tag. */
  scenarioId: string = '00001A';
  // TODO: Load from template library.
  readonly templates = ['&lt;none&gt;', 'Through truss - Howe'];

  /** Current dialog height. Varies with site cost expander state. */
  dialogHeight: number = 594;
  readonly dialogWidth: number = 850;
  toDollars = DOLLARS_FORMATTER.format;
  toCount = COUNT_FORMATTER.format;

  @ViewChild('archAbutmentsButton') archAbutmentsButton!: jqxRadioButtonComponent;
  @ViewChild('archHeightList') archHeightList!: HeightListComponent;
  @ViewChild('backButton') backButton!: jqxButtonComponent;
  @ViewChild('content') content!: ElementRef<HTMLDivElement>;
  @ViewChild('deckElevationList') deckElevationList!: jqxDropDownListComponent;
  @ViewChild('dialog') dialog!: jqxWindowComponent;
  @ViewChild('elevationCanvas') elevationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('finishButton') finishButton!: jqxButtonComponent;
  @ViewChild('highStrengthConcreteButton') highStrengthConcreteButton!: jqxRadioButtonComponent;
  @ViewChild('isPierButton') isPierButton!: jqxRadioButtonComponent;
  @ViewChild('localContestCodeInput') localContestCodeInput!: LocalContestCodeInputComponent;
  @ViewChild('mediumStrengthConcreteButton') mediumStrengthConcreteButton!: jqxRadioButtonComponent;
  @ViewChild('nextButton') nextButton!: jqxButtonComponent;
  @ViewChild('noAnchoragesButton') noAnchoragesButton!: jqxRadioButtonComponent;
  @ViewChild('noPierButton') noPierButton!: jqxRadioButtonComponent;
  @ViewChild('oneAnchorageButton') oneAnchorageButton!: jqxRadioButtonComponent;
  @ViewChild('permitTruckLoad') permitTruckLoad!: jqxRadioButtonComponent;
  @ViewChild('pierHeightList') pierHeightList!: HeightListComponent;
  @ViewChild('projectIdSiteConditionsCode') projectIdSiteConditionsCode!: ElementRef<HTMLSpanElement>;
  @ViewChild('siteCostExpander') siteCostExpander!: jqxExpanderComponent;
  @ViewChild('standardAbutmentsButton') standardAbutmentsButton!: jqxRadioButtonComponent;
  @ViewChild('standardTruckLoad') standardTruckLoad!: jqxRadioButtonComponent;
  @ViewChild('twoAnchoragesButton') twoAnchoragesButton!: jqxRadioButtonComponent;

  constructor(
    private readonly cartoonRenderingService: CartoonRenderingService,
    private readonly designBridgeService: DesignBridgeService,
    private readonly designConditionsService: DesignConditionsService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly cardService: CardService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    this.designConditions = designBridgeService.designConditions;
    cardService.initialize(this);
  }

  get designConditions(): DesignConditions {
    return this.designBridgeService.designConditions;
  }

  private set designConditions(value: DesignConditions) {
    this.designBridgeService.bridge = new BridgeModel(value);
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
      this.archHeightList.selectedIndex = archHeightIndex;
    } else {
      this.standardAbutmentsButton.check();
    }

    // Pier: is with height or no
    if (conditions.isPier) {
      this.isPierButton.check();
      const pierHeightIndex = Math.trunc((24 - conditions.pierHeight) / 4);
      this.pierHeightList.selectedIndex = pierHeightIndex;
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
    this.updateDependentWidgets();
  }

  setDesignConditionsFromWidgets(): void {
    const key = DesignConditions.getSetupKey(
      24 - 4 * this.deckElevationList.getSelectedIndex(),
      this.archAbutmentsButton.checked() ? 24 - 4 * this.archHeightList.selectedIndex : -1,
      this.isPierButton.checked() ? 24 - 4 * this.pierHeightList.selectedIndex : -1,
      this.oneAnchorageButton.checked() ? 1 : this.twoAnchoragesButton.checked() ? 2 : 0,
      this.standardTruckLoad.checked() ? LoadType.STANDARD_TRUCK : LoadType.HEAVY_TRUCK,
      this.highStrengthConcreteButton.checked() ? DeckType.HIGH_STRENGTH : DeckType.MEDIUM_STRENGTH,
    );
    this.designConditions = this.designConditionsService.getConditionsForSetupKey(key);
    this.updateDependentWidgets();
  }

  /** Sets up widgets that depend on those directly associated with design conditions. */
  private updateDependentWidgets(): void {
    const card = this.cardService.card;
    // TODO: If this ends up only manipulating card, move these to a cardservice update method.
    card.renderDeckCartoon();
    card.renderElevationCartoon();
    card.renderLegendItemsForCartoon();
  }

  private setCardVisibility(index: number, isVisible: boolean = true): void {
    this.cardElements[index].forEach(element => (element.style.display = isVisible ? '' : 'none'));
  }

  private goToCard(newCardIndex: number | undefined): void {
    if (newCardIndex === undefined || newCardIndex < 0 || newCardIndex >= CardService.CARD_COUNT) {
      return;
    }
    this.setCardVisibility(this.cardService.card.index, false);
    this.setCardVisibility(newCardIndex);
    this.backButton.disabled(newCardIndex == 0);
    this.nextButton.disabled(newCardIndex == CardService.CARD_COUNT - 1);
    this.cardService.goToCard(newCardIndex);
    this.updateDependentWidgets();
  }

  get costSummary(): FixedCostSummary {
    return this.designConditions.fixedCostSummary!;
  }

  archAbutmentRadioChangeHandler(event: any): void {
    if (event.args.checked) {
      this.archHeightList.disabled = false;
      this.noPierButton.check();
      this.isPierButton.disable();
      this.pierHeightList.disabled = true;
      this.noAnchoragesButton.check();
      this.oneAnchorageButton.disable();
      this.twoAnchoragesButton.disable();
    } else {
      this.isPierButton.enable();
      this.pierHeightList.disabled = false;
      this.oneAnchorageButton.enable();
      this.twoAnchoragesButton.enable();
    }
    this.setDesignConditionsFromWidgets();
  }

  backButtonOnClickHandler(): void {
    this.goToCard(this.cardService.card.backCardIndex);
  }

  deckElevationSelectHandler(event: any): void {
    const index = event.args.index;
    this.archHeightList.startIndex = this.pierHeightList.startIndex = index;
    // Handle deck height where no arch is possible.
    if (index >= this.archHeights.length) {
      this.standardAbutmentsButton.check();
      this.archAbutmentsButton.disable();
    } else {
      this.archAbutmentsButton.enable();
    }
    this.setDesignConditionsFromWidgets();
  }

  finishButtonOnClickHandler(): void {
    this.eventBrokerService.loadBridgeRequest.next({
      source: EventOrigin.SETUP_DIALOG,
      data: this.designBridgeService.bridge,
    });
    this.dialog.close();
  }

  helpButtonOnClickHandler(): void {
    // TODO: Dev only. Implement me for real.
    // console.log(DesignConditionsService.STANDARD_CONDITIONS);
    // window.open('https://google.com', '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
  }

  localContestYesRadioChangeHandler(event: any) {
    if (event.args.checked) {
      this.localContestCodeInput.disabled = false;
      this.localContestCodeInput.focus();
    } else {
      this.localContestCodeInput.disabled = true;
    }
  }

  nextButtonOnClickHandler(): void {
    this.goToCard(this.cardService.card.nextCardIndex);
  }

  isPierRadioChangeHandler(event: any): void {
    if (event.args.checked) {
      this.pierHeightList.disabled = false;
      if (this.oneAnchorageButton.checked()) {
        this.noAnchoragesButton.check();
      }
      this.oneAnchorageButton.disable();
    } else {
      this.pierHeightList.disabled = true;
      this.oneAnchorageButton.enable();
    }
    this.setDesignConditionsFromWidgets();
  }

  siteCostExpandingHandler(): void {
    this.dialogHeight += SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  siteCostCollapsedHandler(): void {
    this.dialogHeight -= SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  private get elevationCtx(): CanvasRenderingContext2D {
    return Graphics.getContext(this.elevationCanvas);
  }

  renderElevationCartoon(options: number): void {
    this.viewportTransform.setWindow(this.designBridgeService.siteInfo.drawingWindow);
    this.cartoonRenderingService.options = options;
    this.cartoonRenderingService.render(this.elevationCtx);
  }

  /** Returns the current, validated content of the local contest code input. */
  get localContestCode(): string | undefined {
    return this.localContestCodeInput.code;
  }

  /** Opens the dialog, setting up widgets with given design conditions. */
  private open(conditions: DesignConditions) {
    this.designConditions = conditions;
    this.setWidgetsFromDesignConditions();
    this.dialog.open();
  }

  enableSiteCostExpander(isEnabled: boolean): void {
    if (isEnabled) {
    this.siteCostExpander.enable();
    } else {
      this.siteCostExpander.collapse();
      this.siteCostExpander.disable();
    }
  }

  setLegendItemVisibility(item: LegendItemName, isVisible: boolean = true) {
    this.legendItemsByName.get(item)!.style.display = isVisible ? '' : 'none';
  }

  ngAfterViewInit(): void {
    // Find all the elements associated with cards and hide all but 'card-1'.
    for (var i: number = 0; i < CardService.CARD_COUNT; ++i) {
      this.cardElements[i] = this.content.nativeElement.querySelectorAll(`.card-${i + 1}`);
      if (i !== 0) {
        this.setCardVisibility(i, false);
      }
    }
    // In html, legend items look like <div class="legenditem NAME">..., where NAME is bank|river|deck|...
    const elementList: NodeListOf<HTMLDivElement> = this.content.nativeElement.querySelectorAll('.legenditem');
    elementList.forEach(element => {
      const legendItemName = element.classList[1].toString();
      this.legendItemsByName.set(legendItemName as LegendItemName, element);
    });
    const canvas = this.elevationCtx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.cardService.card.renderElevationCartoon();
    this.eventBrokerService.newDesignRequest.subscribe(info => this.open(info.data));
  }
}
