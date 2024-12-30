import { Injectable } from '@angular/core';

export const enum LegendMask {
  RIVER_BANK = 0x1,
  EXCAVATION = 0x2,
  RIVER = 0x4,
  DECK = 0x8,
  ABUTMENT = 0x10,
  PIER = 0x20,
}

export const enum DisabledElementMask {
  BACK_BUTTON = 0x1,
  NEXT_BUTTON = 0x2,
  FINISH_BUTTON = 0x4,
  SITE_COST = 0x8,
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

