import { Injectable } from '@angular/core';

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

/** Container for setup wizard page presentation and control logic. */
@Injectable({ providedIn: 'root' })
export class SetupPagesService {
  private pageInfo: PageInfo;
  private _hasBeenLoadedMask: number = 1;

  constructor() { }

  public get pageNumber(): number {
    return this._pageNumber;
  }

  public goNext(): [number, number] | undefined{
    const nextPageNumber = 
  }

  public goBack(): [number, number] | undefined {

  }

  public get deckCartoonSrc(): string {

  }

  public get elevationCartoonOptions(): number {

  }

  public get disabledLegends(): number {

  }

  public get disabledElementMask(): number {

  }

  private hasPageBeenLoaded(pageNumber: number): boolean {
    return (this._hasBeenLoadedMask & (1 << (pageNumber - 1))) != 0;
  }
}

abstract class PageInfo {
  abstract pageNumber: number;
  abstract get nextPageNumber(): number;
  abstract get backPageNumber(): number;
  abstract get deckCartoonSrc(): number;
  abstract get elevationCartoonOptions(): number
  abstract get disabledLegends(isPierButtonChecked: boolean): number;
  abstract get disabledElementMask(): number;
}

class Page1 extends PageInfo {
  override pageNumber: number = 1;
 
  override get nextPageNumber(): number {
  }
 
  override get backPageNumber(): number {
  }
 
  override get deckCartoonSrc(): number {
  }
 
  override get elevationCartoonOptions(): number {
  }
 
  override getDisabledLegends(): number {
  }
 
  override get disabledElementMask(): number {
  }
}
