export const enum LegendMask {
  RIVER_BANK = 1,
  EXCAVATION = 2,
  RIVER = 4,
  DECK = 8,
  ABUTMENT = 16,
  PIER = 32,
}

export const enum DisabledElement {
  BACK_BUTTON,
  NEXT_BUTTON,
  FINISH_BUTTON,
  SITE_COST,
}

export interface WizardPagesView {
   hasPageBeenLoaded(pageNumber: number): boolean;
   get deckCartoonSrcSelected(): string | undefined;
   get isValidLocalContestCode(): boolean;
}

/**
 * Container for per-setup-wizard-page logic. Calls back to an 
 * interface to query and mutate the wizard.
 */
export abstract class PageInfo {
  constructor(protected readonly wizardView: WizardPagesView) {}

  abstract pageNumber: number;

  get nextPageNumber(): number {
    return this.pageNumber + 1;
  }

  get backPageNumber(): number {
    return this.pageNumber - 1;
  }

  get deckCartoonSrc(): number {
    // TODO: || local contest code is valid.
    return this.wizardView.hasPageBeenLoaded(4) || this.wizardView.isValidLocalContestCode ? this.
  }
  abstract get elevationCartoonOptions(): number;
  abstract get disabledLegends(): number;
  abstract get disabledElementMask(): number;
}

export class Page1 extends PageInfo {
  override pageNumber: number = 1;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page2 extends PageInfo {
  override pageNumber: number = 2;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page3 extends PageInfo {
  override pageNumber: number = 3;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page4 extends PageInfo {
  override pageNumber: number = 4;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page5 extends PageInfo {
  override pageNumber: number = 5;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page6 extends PageInfo {
  override pageNumber: number = 6;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}

export class Page7 extends PageInfo {
  override pageNumber: number = 7;

  override get nextPageNumber(): number {}

  override get backPageNumber(): number {}

  override get deckCartoonSrc(): number {}

  override get elevationCartoonOptions(): number {}

  override getDisabledLegends(): number {}

  override get disabledElementMask(): number {}
}
