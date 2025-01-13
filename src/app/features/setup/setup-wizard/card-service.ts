import { CartoonOptionMask } from '../../../shared/services/cartoon-rendering.service';
import { Injectable } from '@angular/core';
import { DeckType, DesignConditions, LoadType } from '../../../shared/services/design-conditions.service';
import { Utility } from '../../../shared/classes/utility';

export const enum LegendItemMask {
  NONE = 0,
  RIVER_BANK = 0x1,
  EXCAVATION = 0x2,
  RIVER = 0x4,
  DECK = 0x8,
  ABUTMENT = 0x10,
  PIER = 0x20,
  ALL = 0x40 - 1,
}

/** .legenditem class names matching setup-wizard.component.html. */
export type LegendItemName = 'bank' | 'excavation' | 'river' | 'deck' | 'abutment' | 'pier';

export const enum ControlMask {
  NONE = 0,
  BACK_BUTTON = 0x1,
  NEXT_BUTTON = 0x2,
  FINISH_BUTTON = 0x4,
  SITE_COST = 0x8,
  ALL = 0x10 - 1,
}

export const enum DeckCartoonSrc {
  NONE = 'img/nodecknoload.png',
  MEDIUM_DECK_STANDARD_LOAD = 'img/meddeckstdload.png',
  HIGH_DECK_STANDARD_LOAD = 'img/hghdeckstdload.png',
  MEDIUM_DECK_PERMIT_LOAD = 'img/meddeckpmtload.png',
  HIGH_DECK_PERMIT_LOAD = 'img/hghdeckpmtload.png',
}

/** A view back into the supported wizard that houses the cards. */
export interface SetupWizardCardView {
  /** Property mutated to set deck cartoon. */
  deckCartoonSrc: DeckCartoonSrc;

  /** Current design conditions the cards represent. */
  // TODO: Consider injecting in CardService instead.
  get designConditions(): DesignConditions;

  /** Enables or disables various navigation and view controls. See enum ControlMask. */
  enableControls(enabledMask: number): void;

  /** Loads design templates for current design conditions. */
  loadDesignTemplates(): void;

  /** Current value of the local contest code input widget. */
  get localContestCode(): string | null| undefined;

  /** Renders am elevation cartoon of current design conditions with given options. See enum CartoonOptionsMask. */
  renderElevationCartoon(optionsMask: number): void;

  /** Sets the visiblity of one legend item. */
  setLegendItemVisibility(item: LegendItemName, isVisible?: boolean): void;
}

/**
 * Container for per-setup-wizard-card logic. Calls back to a view
 * interface to query and mutate the wizard.
 */
export abstract class Card {
  constructor(protected readonly cardService: CardService) {}

  abstract index: number;

  get wizardView(): SetupWizardCardView {
    return this.cardService.wizardView;
  }

  get nextCardIndex(): number | undefined {
    return this.index + 1;
  }

  get backCardIndex(): number | undefined {
    return this.index - 1;
  }

  get elevationCartoonOptions(): number {
    return this.cardService.hasCardBeenVisited(2) || this.wizardView.localContestCode?.length === 6
      ? CartoonOptionMask.STANDARD_OPTIONS
      : CartoonOptionMask.SITE_ONLY;
  }

  get enabledControlMask(): number {
    return ControlMask.ALL;
  }

  renderDeckCartoon(): void {
    this.wizardView.deckCartoonSrc = this.deckCartoonSrcForConditions;
  }

  renderElevationCartoon(): void {
    this.wizardView.renderElevationCartoon(this.elevationCartoonOptions);
  }

  renderLegendItemsForCartoon(): void {
    const options = this.elevationCartoonOptions;
    this.wizardView.setLegendItemVisibility('abutment', (options & CartoonOptionMask.ABUTMENTS) !== 0);
    this.wizardView.setLegendItemVisibility('bank', (options & CartoonOptionMask.IN_SITU_TERRAIN) !== 0);
    this.wizardView.setLegendItemVisibility('deck', (options & CartoonOptionMask.DECK) !== 0);
    const showExcavation = (options & CartoonOptionMask.EXCAVATED_TERRAIN) !== 0;
    this.wizardView.setLegendItemVisibility('excavation', showExcavation);
    const showAbutments = (options & CartoonOptionMask.ABUTMENTS) !== 0;
    const isPier = this.wizardView.designConditions.isPier;
    this.wizardView.setLegendItemVisibility('pier', showAbutments && isPier);
    this.wizardView.setLegendItemVisibility('river', (options & CartoonOptionMask.IN_SITU_TERRAIN) !== 0);
  }

  enableControls(): void {
    this.wizardView.enableControls(this.enabledControlMask);
  }

  /** Performs card-specific initialization for the goToCard() target. */
  initializeOnGoTo(): void {}

  protected get deckCartoonSrcForConditions(): DeckCartoonSrc {
    const conditions = this.wizardView.designConditions;
    switch (conditions.deckType) {
      case DeckType.MEDIUM_STRENGTH:
        switch (conditions.loadType) {
          case LoadType.STANDARD_TRUCK:
            return DeckCartoonSrc.MEDIUM_DECK_STANDARD_LOAD;
          case LoadType.HEAVY_TRUCK:
            return DeckCartoonSrc.MEDIUM_DECK_PERMIT_LOAD;
        }
        break;
      case DeckType.HIGH_STRENGTH:
        switch (conditions.loadType) {
          case LoadType.STANDARD_TRUCK:
            return DeckCartoonSrc.HIGH_DECK_STANDARD_LOAD;
          case LoadType.HEAVY_TRUCK:
            return DeckCartoonSrc.HIGH_DECK_PERMIT_LOAD;
        }
        break;
    }
    return DeckCartoonSrc.NONE;
  }
}

class Card1 extends Card {
  override index: number = 0;

  override get elevationCartoonOptions(): number {
    return CartoonOptionMask.SITE_ONLY;
  }

  override renderDeckCartoon(): void {
    this.wizardView.deckCartoonSrc = DeckCartoonSrc.NONE;
  }

  override get enabledControlMask(): number {
    return ControlMask.NEXT_BUTTON;
  }
}

class Card2 extends Card {
  override index: number = 1;

  override get enabledControlMask(): number {
    let mask = ControlMask.BACK_BUTTON;
    const code = this.wizardView.localContestCode;
    if (code === undefined || code?.length) {
      mask |= ControlMask.NEXT_BUTTON;
    }
    if (this.cardService.hasCardBeenVisited(2)) {
      mask |= ControlMask.SITE_COST;
    }
    return mask;
  }

  override get nextCardIndex(): number | undefined {
    return this.wizardView.localContestCode?.length ? 4 : this.index + 1;
  }
}

class Card3 extends Card {
  override index: number = 2;

  override get enabledControlMask(): number {
    return ControlMask.BACK_BUTTON | ControlMask.NEXT_BUTTON | ControlMask.SITE_COST;
  }
}

class Card4 extends Card {
  override index: number = 3;
}

class Card5 extends Card {
  override index: number = 4;

  override get backCardIndex(): number | undefined {
    return this.wizardView.localContestCode?.length ? 1 : this.index - 1;
  }

  override initializeOnGoTo(): void {
    this.wizardView.loadDesignTemplates();
  }
}

class Card6 extends Card {
  override index: number = 5;

  override get elevationCartoonOptions(): number {
    return CartoonOptionMask.STANDARD_OPTIONS | CartoonOptionMask.TITLE_BLOCK;
  }
}

class Card7 extends Card {
  override index: number = 6;

  override get elevationCartoonOptions(): number {
    return CartoonOptionMask.STANDARD_OPTIONS | CartoonOptionMask.TITLE_BLOCK | CartoonOptionMask.JOINTS;
  }

  override get enabledControlMask(): number {
    return ControlMask.BACK_BUTTON | ControlMask.FINISH_BUTTON | ControlMask.SITE_COST;
  }
}

@Injectable({ providedIn: 'root' })
export class CardService {
  public static readonly CARD_COUNT = 7;

  private _cards: Card[] | undefined;
  private cardIndex: number = 0;
  private visitedMask: number = 1; // Page index 0 is initially visited.
  private _wizardView: SetupWizardCardView | undefined;

  public initialize(wizardView: SetupWizardCardView): void {
    this._wizardView = wizardView;
    this._cards = [
      new Card1(this),
      new Card2(this),
      new Card3(this),
      new Card4(this),
      new Card5(this),
      new Card6(this),
      new Card7(this),
    ];
  }

  /** Gets the current card. */
  public get card(): Card {
    return this.cards[this.cardIndex];
  }

  /** Changes the current card using the given index. */
  public goToCard(index: number | undefined): void {
    if (index === undefined || index < 0 || index >= this.cards.length) {
      return;
    }
    this.visitedMask |= 1 << index;
    this.cardIndex = index;
    this.card.initializeOnGoTo();
  }

  /** Returns whether card with given index has been visited by the user. Index 0 always is. */
  public hasCardBeenVisited(index: number): boolean {
    return ((1 << index) | this.visitedMask) !== 0;
  }

  get wizardView(): SetupWizardCardView {
    return Utility.assertNotUndefined(this._wizardView, 'wizard view');
  }

  private get cards(): Card[] {
    return Utility.assertNotUndefined(this._cards, 'cards');
  }
}
