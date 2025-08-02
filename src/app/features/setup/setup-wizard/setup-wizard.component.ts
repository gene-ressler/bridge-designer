import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jqxButtonComponent, jqxButtonModule } from 'jqwidgets-ng/jqxbuttons';
import { jqxDropDownListComponent, jqxDropDownListModule } from 'jqwidgets-ng/jqxdropdownlist';
import { jqxExpanderComponent, jqxExpanderModule } from 'jqwidgets-ng/jqxexpander';
import { jqxInputModule } from 'jqwidgets-ng/jqxinput';
import { jqxListBoxComponent, jqxListBoxModule } from 'jqwidgets-ng/jqxlistbox';
import { jqxRadioButtonComponent, jqxRadioButtonModule } from 'jqwidgets-ng/jqxradiobutton';
import { jqxWindowComponent, jqxWindowModule } from 'jqwidgets-ng/jqxwindow';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { COUNT_FORMATTER, DOLLARS_FORMATTER, FIXED_FORMATTER } from '../../../shared/classes/utility';
import {
  DeckType,
  DesignConditions,
  DesignConditionsService,
  SiteCostsModel,
  LoadType,
} from '../../../shared/services/design-conditions.service';
import { CartoonRenderingService } from '../../../shared/services/cartoon-rendering.service';
import { ViewportTransform2D } from '../../../shared/services/viewport-transform.service';
import {
  BridgeService,
  BridgeServiceSessionStateKey,
  RootBridgeService,
} from '../../../shared/services/bridge.service';
import { CartoonSiteRenderingService } from '../../../shared/services/cartoon-site-rendering.service';
import { Graphics } from '../../../shared/classes/graphics';
import { HeightListComponent } from '../height-list/height-list.component';
import { BridgeModel } from '../../../shared/classes/bridge.model';
import { CardService, ControlMask, DeckCartoonSrc, LegendItemName, SetupWizardCardView } from './card-service';
import {
  LocalContestCodeInputComponent,
  LocalContestCodeInputState,
} from '../local-contest-code-input/local-contest-code-input.component';
import { BridgeSketchService } from '../../../shared/services/bridge-sketch.service';
import { CartoonSketchRenderingService } from '../../../shared/services/cartoon-sketch-rendering.service';
import { CartoonJointRenderingService } from '../../../shared/services/cartoon-joint-rendering.service';
import { DraftingPanelState } from '../../../shared/services/persistence.service';

/**
 * The card-based setup wizard.
 *
 * Basic appearance and event-handling happens here. Card-specific logic is delegated to CardService.
 */
@Component({
    selector: 'setup-wizard',
    imports: [
        CommonModule,
        FormsModule,
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
        BridgeService,
        { provide: BridgeServiceSessionStateKey, useValue: { key: undefined } },
        BridgeSketchService,
        CardService,
        CartoonJointRenderingService,
        CartoonRenderingService,
        CartoonSiteRenderingService,
        CartoonSketchRenderingService,
        ViewportTransform2D,
    ],
    templateUrl: './setup-wizard.component.html',
    styleUrl: './setup-wizard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
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

  /** Current dialog height. Varies with site cost expander state. */
  dialogHeight: number = 594;
  readonly dialogWidth: number = 872;
  readonly toDollars = DOLLARS_FORMATTER.format;
  readonly toCount = COUNT_FORMATTER.format;
  readonly toFixed = FIXED_FORMATTER.format;

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
  @ViewChild('permitTruckLoadButton') permitTruckLoadButton!: jqxRadioButtonComponent;
  @ViewChild('pierHeightList') pierHeightList!: HeightListComponent;
  @ViewChild('projectIdSiteConditionsCode') projectIdSiteConditionsCode!: ElementRef<HTMLSpanElement>;
  @ViewChild('siteCostExpander') siteCostExpander!: jqxExpanderComponent;
  @ViewChild('standardAbutmentsButton') standardAbutmentsButton!: jqxRadioButtonComponent;
  @ViewChild('standardTruckLoadButton') standardTruckLoadButton!: jqxRadioButtonComponent;
  @ViewChild('templateList') templateList!: jqxListBoxComponent;
  @ViewChild('twoAnchoragesButton') twoAnchoragesButton!: jqxRadioButtonComponent;

  constructor(
    readonly bridgeService: BridgeService,
    private readonly bridgeSketchService: BridgeSketchService,
    private readonly cardService: CardService,
    private readonly cartoonRenderingService: CartoonRenderingService,
    private readonly designConditionsService: DesignConditionsService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly rootBridgeService: RootBridgeService,
    private readonly viewportTransform: ViewportTransform2D,
  ) {
    this.designConditions = bridgeService.designConditions;
    cardService.initialize(this);
  }

  get designConditions(): DesignConditions {
    return this.bridgeService.designConditions;
  }

  set designConditions(value: DesignConditions) {
    this.bridgeService.setBridge(new BridgeModel(value), DraftingPanelState.createNew());
  }

  /** Sets up widgets directly associated with bridge service design conditions. */
  private setWidgetsFromDesignConditions(): void {
    const conditions = this.designConditions;

    // Deck elevation
    const deckElevationIndex = Math.trunc((24 - conditions.deckElevation) / 4);
    this.deckElevationList.selectedIndex(deckElevationIndex);

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
    if (conditions.anchorageCount === 2) {
      this.twoAnchoragesButton.check();
    } else if (conditions.anchorageCount === 1) {
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
      this.standardTruckLoadButton.check();
    } else {
      this.permitTruckLoadButton.check();
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
      this.standardTruckLoadButton.checked() ? LoadType.STANDARD_TRUCK : LoadType.HEAVY_TRUCK,
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
    card.enableControls();
  }

  private setCardVisibility(index: number, isVisible: boolean): void {
    this.cardElements[index].forEach(element => (element.style.display = isVisible ? '' : 'none'));
  }

  private goToCard(newCardIndex: number | undefined): void {
    if (newCardIndex === undefined || newCardIndex < 0 || newCardIndex >= CardService.CARD_COUNT) {
      return;
    }
    // Make the old card invisible and new one visible.
    this.setCardVisibility(this.cardService.card.index, false);
    this.setCardVisibility(newCardIndex, true);
    // Install the view and navigation logic for the new card.
    this.cardService.goToCard(newCardIndex);
    // Adjust appearance to incorporate the card change (e.g. navigation buttons).
    this.updateDependentWidgets();
  }

  get scenarioId(): string {
    if (!this.localContestCodeInput) {
      return '0001A';
    }
    const localContestCode = this.localContestCodeInput.code;
    return localContestCode?.length === 6 ? localContestCode : `000${this.designConditions.tag}`;
  }

  get siteCosts(): SiteCostsModel {
    return this.designConditions.siteCosts!;
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
      this.archHeightList.disabled = true;
      this.isPierButton.enable();
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
      origin: EventOrigin.SETUP_DIALOG,
      data: { bridge: this.bridgeService.bridge, draftingPanelState: this.bridgeService.draftingPanelState },
    });
    this.eventBrokerService.loadSketchRequest.next({
      origin: EventOrigin.SETUP_DIALOG,
      data: this.bridgeService.sketch,
    });
    this.dialog.close();
  }

  helpButtonOnClickHandler(): void {
    // TODO: Dev only. Implement me for real.
    // window.open('https://google.com', '_blank', 'location=yes,height=570,width=520,scrollbars=yes,status=yes');
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

  localContestInputChangeHandler(_state: LocalContestCodeInputState) {
    this.cardService.card.enableControls(); // Next button.
  }

  localContestYesRadioChangeHandler(event: any) {
    if (event.args.checked) {
      this.localContestCodeInput.disabled = false;
      this.localContestCodeInput.focus();
      this.cardService.card.enableControls(); // Next button
    } else {
      this.localContestCodeInput.disabled = true;
    }
  }

  nextButtonOnClickHandler(): void {
    // If user has entered valid local contest code, set associated design conditions.
    const card = this.cardService.card;
    const conditions = this.localContestCodeInput.designConditions;
    if (card.index === 1 && conditions) {
      this.designConditions = conditions;
      this.setWidgetsFromDesignConditions();
    }
    this.goToCard(card.nextCardIndex);
  }

  siteCostExpandingHandler(): void {
    this.dialogHeight += SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  siteCostCollapsedHandler(): void {
    this.dialogHeight -= SetupWizardComponent.SITE_COST_DROPDOWN_HEIGHT;
  }

  templateListSelectHandler(event: any) {
    this.bridgeService.sketch = this.templateList.source()[event.args.index];
    this.cardService.card.renderElevationCartoon();
  }

  renderElevationCartoon(options: number): void {
    this.viewportTransform.setWindow(this.bridgeService.siteInfo.drawingWindow);
    this.cartoonRenderingService.options = options;
    const ctx = Graphics.getContext(this.elevationCanvas);
    this.cartoonRenderingService.render(ctx);
  }

  /** Opens the dialog, setting up widgets with given design conditions. */
  private open(conditions: DesignConditions) {
    if (conditions === DesignConditionsService.PLACEHOLDER_CONDITIONS) {
      conditions = this.designConditionsService.getConditionsForCodeLong(conditions.codeLong);
    }
    this.designConditions = conditions;
    this.setWidgetsFromDesignConditions();
    this.bridgeService.bridge.projectName = this.rootBridgeService.instance.bridge.projectName;
    this.bridgeService.bridge.designedBy = this.rootBridgeService.instance.bridge.designedBy;
    this.bridgeService.bridge.projectId = this.rootBridgeService.instance.bridge.projectId;
    this.dialog.open();
  }

  // Start SetupWizardCardView methods.

  /** Enables or disabled various navigation and view controls based on a mask. See enum ControlMask. */
  enableControls(enabledMask: number): void {
    this.backButton.disabled(!(enabledMask & ControlMask.BACK_BUTTON));
    this.nextButton.disabled(!(enabledMask & ControlMask.NEXT_BUTTON));
    this.finishButton.disabled(!(enabledMask & ControlMask.FINISH_BUTTON));
    if (enabledMask & ControlMask.SITE_COST) {
      this.siteCostExpander.enable();
    } else {
      this.siteCostExpander.collapse();
      this.siteCostExpander.disable();
    }
  }

  loadDesignTemplates(): void {
    const templateList = this.bridgeSketchService.getSketchList(this.designConditions);
    if (this.templateList.source() === templateList) {
      return;
    }
    this.templateList.displayMember('name');
    this.templateList.source(templateList);
    this.templateList.selectedIndex(0);
    this.templateList.focus();
  }

  /** Returns the current, validated content of the local contest code input. Null means none. Undefined means incomplete. */
  get localContestCode(): string | null | undefined {
    return this.localContestCodeInput.code;
  }

  setLegendItemVisibility(item: LegendItemName, isVisible: boolean = true): void {
    this.legendItemsByName.get(item)!.style.display = isVisible ? '' : 'none';
  }

  private maybeSaveThenStartNewDesign(): void {
    // Let the bridge file loader offer the user to save a dirty edit before opening.
    this.eventBrokerService.loadBridgeFileRequest.next({origin: EventOrigin.SETUP_DIALOG, data: () => {
      this.open(this.rootBridgeService.instance.designConditions);
    }})
  }

  ngAfterViewInit(): void {
    // Find all the elements associated with cards and hide all but 'card-1'.
    for (let i: number = 0; i < CardService.CARD_COUNT; ++i) {
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
    const w = this.elevationCanvas.nativeElement.width;
    const h = this.elevationCanvas.nativeElement.height;
    this.viewportTransform.setViewport(0, h - 1, w - 1, 1 - h);
    this.cardService.card.renderElevationCartoon();
    this.eventBrokerService.newDesignRequest.subscribe(() => this.maybeSaveThenStartNewDesign());
  }
}
