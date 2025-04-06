import { Injectable } from '@angular/core';
import { Joint } from '../classes/joint.model';
import { Utility } from '../classes/utility';

export const enum LoadType {
  NONE = -1,
  STANDARD_TRUCK,
  HEAVY_TRUCK,
}

export const enum DeckType {
  NONE = -1,
  MEDIUM_STRENGTH,
  HIGH_STRENGTH,
}

const enum CodeError {
  MISSING = -1,
  NONE,
  ARCH_AND_PIER_NOT_ALLOWED,
  BAD_ARCH_ANCHORAGE,
  CODE_NOT_INTEGER,
  CONFLICTING_PIER_SPECS,
  HIGH_INTERIOR_PIER_NOT_BOOLEAN,
  INFEASIBLE_DECK_ELEVATION,
  INFEASIBLE_LEFT_LOW_PIER_HEIGHT,
  INFEASIBLE_LOWER_HEIGHT,
  INFEASIBLE_PIER_LOCATION,
  INFEASIBLE_RIGHT_LOW_PIER_HEIGHT,
  INFEASIBLE_SPAN_LENGTH,
  INFEASIBLE_UPPER_HEIGHT,
  LOWER_HEIGHT_OUT_OF_RANGE,
  NO_SUCH_LOAD_CASE,
  PIER_PANEL_OUT_OF_RANGE,
  SPAN_LENGTH_OUT_OF_RANGE,
  UPPER_HEIGHT_OUT_OF_RANGE,
}

export type SiteCostsModel = {
  siteCondition: string;
  panelCount: number;
  deckCostRate: number;
  deckCost: number;
  excavationVolume: number;
  excavationCostRate: number;
  excavationCost: number;
  abutmentType: string;
  abutmentCount: number;
  abutmentCostRate: number;
  abutmentCost: number;
  isPier: boolean;
  pierHeight: number;
  pierCost: number;
  anchorageCount: number;
  anchorageCostRate: number;
  anchorageCost: number;
  totalFixedCost: number;
};

export class DesignConditions {
  public static readonly ANCHOR_OFFSET = 8;
  public static readonly GAP_DEPTH = 24;
  public static readonly MAX_JOINT_COUNT = 50;
  public static readonly MAX_MEMBER_COUNT = 120;
  public static readonly PANEL_SIZE_WORLD = 4;

  private static readonly ANCHORAGE_COST = 6000;
  private static readonly ARCH_INCREMENTAL_COST_PER_DECK_PANEL = 3300;
  private static readonly DECK_COST_PER_PANEL_HI_STRENGTH = 5100;
  private static readonly DECK_COST_PER_PANEL_MED_STRENGTH = 4700;
  private static readonly EXCAVATION_COST_RATE = 1;
  private static readonly FROM_KEY_CODE_TAG = '99Z';
  private static readonly MAX_SLENDERNESS = 300;
  private static readonly MIN_OVERHEAD = 8;
  private static readonly PIER_BASE_COST = 0;
  private static readonly PIER_COST_PER_DECK_PANEL = 4500;
  private static readonly STANDARD_ABUTMENT_BASE_COST = 6000;
  private static readonly STANDARD_ABUTMENT_COST_PER_DECK_PANEL = 500;

  public readonly abutmentCost: number = 0;
  public readonly abutmentJointIndices: number[] = [];
  public readonly allowableSlenderness: number = 0;
  public readonly archHeight: number = 0;
  public readonly archJointIndex: number = 0;
  public readonly code: Uint8Array = new Uint8Array();
  public readonly codeLong: number;
  public readonly deckCostRate: number = 0;
  public readonly deckElevation: number = 0;
  public readonly deckType: DeckType = DeckType.NONE;
  public readonly excavationVolume: number = 0;
  public readonly isHiPier: boolean = false;
  public readonly jointRestraintCount: number = 0;
  public readonly leftAnchorageJointIndex: number = 0;
  public readonly loadedJointCount: number = 0;
  public readonly loadType: LoadType = LoadType.NONE;
  public readonly anchorageCount: number = 0;
  public readonly overClearance: number = 0;
  public readonly overMargin: number = 0;
  public readonly panelCount: number = 0;
  public readonly pierCost: number = 0;
  public readonly pierHeight: number = 0;
  public readonly pierJointIndex: number = 0;
  public readonly pierPanelIndex: number = 0;
  public readonly prescribedJoints: Joint[] = [];
  public readonly rightAnchorageJointIndex: number = 0;
  public readonly spanLength: number = 0;
  public readonly tag: string;
  public readonly totalFixedCost: number = 0;
  public readonly underClearance: number = 0;
  public readonly xLeftmostDeckJoint: number = 0;
  public readonly xRightmostDeckJoint: number = 0;
  public readonly siteCosts: SiteCostsModel = {} as SiteCostsModel;

  private constructor(tag: string, codeLong: number) {
    this.tag = tag;
    this.codeLong = codeLong;
    const code = DesignConditions.getCodeOrThrow(codeLong);
    if (DesignConditions.getCodeError(code) != CodeError.NONE) {
      return;
    }
    this.code = code;

    // code dependencies
    // digit 10 => (0 = low pier, 1 = high pier)
    this.isHiPier = code[9] > 0;
    // digit 9 => panel point at which pier is located. (-1 = no pier).
    this.pierJointIndex = this.pierPanelIndex = code[8] - 1;
    // digit 8 => (0 = simple, 1 = arch, 2 = cable left, 3 = cable both)
    const isArch = code[7] === 1;
    const isLeftCable = code[7] === 2 || code[7] === 3;
    const isRightCable = code[7] === 3;
    // digits 6 and 7 => under span clearance
    this.underClearance = 10 * code[5] + code[6];
    // digits 4 and 5 => overhead clearance
    this.overClearance = 10 * code[3] + code[4];
    // digits 2 and 3 => number of bridge panels
    this.panelCount = 10 * code[1] + code[2];
    // digit 1 is the load case, 1-based
    // -1 correction for 0-based load_case table
    const loadCaseIndex = code[0] - 1;
    this.loadType = (loadCaseIndex & 1) === 0 ? LoadType.STANDARD_TRUCK : LoadType.HEAVY_TRUCK;
    this.deckType = (loadCaseIndex & 2) === 0 ? DeckType.MEDIUM_STRENGTH : DeckType.HIGH_STRENGTH;

    // Precomputation of condition-dependent site geometry and design constraints.

    // Work space dimensions.
    if (isArch) {
      this.deckElevation = 4 * (this.panelCount - 5) + this.underClearance;
      this.archHeight = this.underClearance;
    } else {
      this.deckElevation = 4 * (this.panelCount - 5);
      this.archHeight = -1;
    }
    this.overMargin = DesignConditions.GAP_DEPTH + DesignConditions.MIN_OVERHEAD - this.deckElevation;
    this.pierHeight = this.isHiPier ? this.deckElevation : this.isPier ? this.deckElevation - this.underClearance : -1;

    // Prescribed joint information.
    let prescribedJointCount = this.panelCount + 1;
    this.archJointIndex = this.leftAnchorageJointIndex = this.rightAnchorageJointIndex = -1;
    // Add one prescribed joint for the intermediate support, if any.
    if (this.isPier && !this.isHiPier) {
      this.pierJointIndex = prescribedJointCount;
      prescribedJointCount++;
    }

    // Another two for the arch bases, if we have an arch.
    if (isArch) {
      this.archJointIndex = prescribedJointCount;
      prescribedJointCount += 2;
    }
    // And more for the anchorages, if any.
    this.anchorageCount = 0;
    if (isLeftCable) {
      this.leftAnchorageJointIndex = prescribedJointCount;
      this.anchorageCount++;
      prescribedJointCount++;
    }
    if (isRightCable) {
      this.rightAnchorageJointIndex = prescribedJointCount;
      this.anchorageCount++;
      prescribedJointCount++;
    }

    this.spanLength = this.panelCount * DesignConditions.PANEL_SIZE_WORLD;
    this.loadedJointCount = this.panelCount + 1;
    this.prescribedJoints = new Array(prescribedJointCount);

    let x = 0;
    let y = 0;
    let i = 0;
    for (; i < this.loadedJointCount; i++) {
      this.prescribedJoints[i] = new Joint(i, x, y, true);
      x += DesignConditions.PANEL_SIZE_WORLD;
    }
    this.xLeftmostDeckJoint = this.prescribedJoints[0].x;
    this.xRightmostDeckJoint = this.prescribedJoints[this.loadedJointCount - 1].x;
    // Standard abutments, no pier, no anchorages = 3 restraints.
    this.jointRestraintCount = 3;
    if (this.isPier) {
      if (this.isHiPier) {
        // Pier joint has 2, but we make the left support a roller.
        this.jointRestraintCount += 2 - 1;
      } else {
        this.prescribedJoints[i] = new Joint(
          i,
          this.pierPanelIndex * DesignConditions.PANEL_SIZE_WORLD,
          -this.underClearance,
          true,
        );
        i++;
        this.jointRestraintCount += 2;
      }
    }
    if (isArch) {
      this.prescribedJoints[i] = new Joint(i, this.xLeftmostDeckJoint, -this.underClearance, true);
      i++;
      this.prescribedJoints[i] = new Joint(i, this.xRightmostDeckJoint, -this.underClearance, true);
      i++;
      // Both abutment joints are fully constrained, but the deck joints become unconstrained.
      this.jointRestraintCount += 4 - 3;
    }
    if (isLeftCable) {
      this.prescribedJoints[i] = new Joint(i, this.xLeftmostDeckJoint - DesignConditions.ANCHOR_OFFSET, 0, true);
      i++;
      this.jointRestraintCount += 2;
    }
    if (isRightCable) {
      this.prescribedJoints[i] = new Joint(i, this.xRightmostDeckJoint + DesignConditions.ANCHOR_OFFSET, 0, true);
      i++;
      this.jointRestraintCount += 2;
    }

    // Slenderness limit.
    this.allowableSlenderness = isLeftCable || isRightCable ? Number.POSITIVE_INFINITY : DesignConditions.MAX_SLENDERNESS;

    // Cost calculations.
    this.excavationVolume = DesignConditions.getExcavationVolume(this.deckElevation);
    this.deckCostRate =
      this.deckType === DeckType.MEDIUM_STRENGTH
        ? DesignConditions.DECK_COST_PER_PANEL_MED_STRENGTH
        : DesignConditions.DECK_COST_PER_PANEL_HI_STRENGTH;

    // For the rest of the costs there are two separate models for standard and non-standard design conditions.
    if (this.isFromKeyCode) {
      this.totalFixedCost = 170000;
      // Non-standard case.
      if (this.isPier) {
        this.abutmentCost = DesignConditions.getKeyCodeAbutmentCost(this.deckElevation);
        this.pierCost =
          this.totalFixedCost -
          this.panelCount * this.deckCostRate -
          this.excavationVolume * DesignConditions.EXCAVATION_COST_RATE -
          this.abutmentCost -
          this.anchorageCount * DesignConditions.ANCHORAGE_COST;
      } else {
        this.abutmentCost =
          this.totalFixedCost -
          this.panelCount * this.deckCostRate -
          this.excavationVolume * DesignConditions.EXCAVATION_COST_RATE -
          this.anchorageCount * DesignConditions.ANCHORAGE_COST;
        this.pierCost = 0;
      }
    } else {
      // Standard case.
      this.abutmentCost = isArch
        ? this.panelCount * DesignConditions.ARCH_INCREMENTAL_COST_PER_DECK_PANEL +
          DesignConditions.getArchAbutmentCost(this.underClearance)
        : this.isPier
          ? DesignConditions.STANDARD_ABUTMENT_BASE_COST +
            Math.max(this.pierPanelIndex, this.panelCount - this.pierPanelIndex) *
              DesignConditions.STANDARD_ABUTMENT_COST_PER_DECK_PANEL
          : DesignConditions.STANDARD_ABUTMENT_BASE_COST +
            this.panelCount * DesignConditions.STANDARD_ABUTMENT_COST_PER_DECK_PANEL;
      this.pierCost = this.isPier
        ? Math.max(this.pierPanelIndex, this.panelCount - this.pierPanelIndex) *
            DesignConditions.PIER_COST_PER_DECK_PANEL +
          DesignConditions.getPierHeightCost(this.pierHeight) +
          DesignConditions.PIER_BASE_COST
        : 0;
      this.totalFixedCost =
        this.excavationVolume * DesignConditions.EXCAVATION_COST_RATE +
        this.abutmentCost +
        this.pierCost +
        this.panelCount * this.deckCostRate +
        this.anchorageCount * DesignConditions.ANCHORAGE_COST;
    }
    this.abutmentCost *= 0.5; // Steve's calcs are for both abutments. UI presents unit cost.

    // Abutment joints.
    this.abutmentJointIndices = isArch
      ? [0, this.panelCount, this.archJointIndex, this.archJointIndex + 1]
      : this.isPier
        ? [0, this.panelCount, this.pierJointIndex]
        : [0, this.panelCount];

    this.siteCosts = {
      siteCondition: this.tag,
      panelCount: this.panelCount,
      deckCostRate: this.deckCostRate,
      deckCost: this.panelCount * this.deckCostRate,
      excavationVolume: this.excavationVolume,
      excavationCostRate: DesignConditions.EXCAVATION_COST_RATE,
      excavationCost: this.excavationVolume * DesignConditions.EXCAVATION_COST_RATE,
      abutmentType: this.isArch ? 'arch' : 'standard',
      abutmentCount: 2,
      abutmentCostRate: this.abutmentCost * 0.5,
      abutmentCost: this.abutmentCost,
      isPier: this.isPier,
      pierHeight: this.pierHeight,
      pierCost: this.pierCost,
      anchorageCount: this.anchorageCount,
      anchorageCostRate: DesignConditions.ANCHORAGE_COST,
      anchorageCost: this.anchorageCount * DesignConditions.ANCHORAGE_COST,
      totalFixedCost: this.totalFixedCost,
    };
  }

  /** Use DesignConditionsService.PLACEHOLDER_CONDITIONS. */
  static get placeholderConditions(): DesignConditions {
    return new DesignConditions('00X', 1110824000);
  }

  private static getKeyCodeAbutmentCost(deckElevation: number): number {
    return [7000, 7000, 7500, 7500, 8000, 8000, 8500][Math.floor(deckElevation / 4)];
  }

  private static getExcavationVolume(deckElevation: number): number {
    return [106500, 90000, 71500, 54100, 38100, 19400, 0][Math.floor(deckElevation / 4)];
  }

  private static getArchAbutmentCost(underClearance: number) {
    return [200, 11300, 20800, 30300, 39000, 49700][Math.floor(underClearance / 4) - 1];
  }

  private static getPierHeightCost(pierHeight: number) {
    return [0, 2800, 5600, 8400, 10200, 12500, 14800][Math.floor(pierHeight / 4)];
  }

  public get deckThickness(): number {
    return this.deckType === DeckType.MEDIUM_STRENGTH ? 0.23 : 0.15;
  }

  public get isArch() {
    return this.archHeight >= 0;
  }

  public get isPier() {
    return this.pierPanelIndex >= 0;
  }

  public get isLeftAnchorage() {
    return this.leftAnchorageJointIndex >= 0;
  }

  public get isRightAnchorage() {
    return this.rightAnchorageJointIndex >= 0;
  }

  public get isAtGrade() {
    return this.deckElevation === DesignConditions.GAP_DEPTH;
  }

  public get isFromKeyCode() {
    return this.tag === DesignConditions.FROM_KEY_CODE_TAG;
  }

  public isGeometricallyIdentical(other: DesignConditions): boolean {
    // code[0] is load condition; the rest are geometry.
    return this.code.slice(1).every((value, index) => value === other.code[index]);
  }

  public get tagGeometryOnly(): string {
    return this.tag.substring(0, 2);
  }
  
  /*
   * Character 1 - Load case scenario (1=Case A, 2=Case B, 3=Case C, 4=Case D); entry of any character other than 1, 2, 3, or 4 is illegal.
   * Characters 2,3 - Span length, expressed as the number of 4-meter panels; any integer from 1 to 20 is allowed
   * Characters 4,5 - upper height of the design space, expressed as number of meters over the deck level; any integer from 0 to 40 is allowed
   * Characters 6,7 - lower height of the design space, expressed as number of meters below the deck level; any integer from 0 to 32 is allowed
   * Character 8 - arch & anchorage status (0=no arch, no anchorage; 1=arch, no anchorage; 2=no arch, single left-side anchorage; 3=no arch,
   *   two anchorages).  Base of arch is  always at bottom of drawing space.
   * Character 9 - Intermediate pier location, expressed as the numbered deck-level joint(i.e., 1=left end of bridge; 2=4 meters from left end; 3=8 meters from left end...)
   * Character 10 - Hi interior pier (0=not a high pier, elevation of pier top is the bottom of drawing space; 1=high pier, elevation is at deck level)
   * A few nuances:
   * - It is possible to have arch supports and an intermediate pier, even though there is no standard scenario that includes both.
   * - It is possible to put an intermediate pier at the left end of the bridge (even though this doesn't really make sense)
   * - For an arch, deck height is driven by the specified span length (char 2-3), the lower height of the design space (char 6,7), and the
   *   shape of the river valley.  Thus it is possible to have a deck level above the normal roadway level.  Extreme cases of this (which I have
   *   never bothered to make illegal) push the deck completely off the screen.
   */
  private static getCode(codeLong: number): Uint8Array | null {
    if (codeLong < 0) {
      return null;
    }
    const rtnCode = new Uint8Array(10);
    for (let i = 9; i >= 0; i--) {
      rtnCode[i] = codeLong % 10;
      codeLong = Math.floor(codeLong / 10);
    }
    if (codeLong > 0) {
      return null;
    }
    return rtnCode;
  }

  private static getCodeOrThrow(codeLong: number): Uint8Array {
    const code = this.getCode(codeLong);
    if (code === null) {
      throw new Error('Bad code: ' + codeLong);
    }
    return code;
  }

  private static getCodeError(code: Uint8Array | null): CodeError {
    if (code === null) {
      return CodeError.MISSING;
    }
    // Character 1 - Load case scenario (1=Case A, 2=Case B, 3=Case C, 4=Case D); entry of any character other than 1, 2, 3, or 4 is illegal.
    if (!Utility.inRange(code[1 - 1], 1, 4)) {
      return CodeError.NO_SUCH_LOAD_CASE;
    }
    // Characters 2,3 - Span length, expressed as the number of 4-meter panels; any integer from 1 to 20 is allowed
    const nPanels = 10 * code[2 - 1] + code[3 - 1];
    if (!Utility.inRange(nPanels, 1, 20)) {
      return CodeError.SPAN_LENGTH_OUT_OF_RANGE;
    }
    // Characters 4,5 - upper height of the design space, expressed as number of meters over the deck level; any integer from 0 to 40 is allowed
    const over = 10 * code[4 - 1] + code[5 - 1];
    if (!Utility.inRange(over, 0, 40)) {
      return CodeError.UPPER_HEIGHT_OUT_OF_RANGE;
    }
    // Character 10 - high interior pier boolean
    if (!Utility.inRange(code[10 - 1], 0, 1)) {
      return CodeError.HIGH_INTERIOR_PIER_NOT_BOOLEAN;
    }
    // Characters 6,7 - lower height of the design space, expressed as number of meters below the deck level; any integer from 0 to 32 is allowed
    const under = 10 * code[6 - 1] + code[7 - 1];
    if (!Utility.inRange(under, 0, 32)) {
      return CodeError.LOWER_HEIGHT_OUT_OF_RANGE;
    }
    // Character 8 - arch & anchorage status (0=no arch, no anchorage; 1=arch, no anchorage; 2=no arch, single left-side anchorage; 3=no arch,
    // two anchorages).  Base of arch is always at bottom of drawing space.
    if (!Utility.inRange(code[8 - 1], 0, 3)) {
      return CodeError.BAD_ARCH_ANCHORAGE;
    }
    const arch = code[8 - 1] === 1;
    // Character 9 - Intermediate pier location, expressed as the numbered deck-level joint(i.e., 1=left end of bridge; 2=4 meters from left end; 3=8 meters from left end...)
    const pierPanelIndex = code[9 - 1] - 1;
    const pier: boolean = pierPanelIndex >= 0;
    // Character 10 - Hi interior pier (0=not a high pier, elevation of pier top is the bottom of drawing space; 1=high pier, elevation is at deck level)
    const hiPier = code[10 - 1] > 0;

    // Consistency checks.
    if (hiPier && !pier) {
      return CodeError.CONFLICTING_PIER_SPECS;
    }
    if (pierPanelIndex >= nPanels) {
      return CodeError.PIER_PANEL_OUT_OF_RANGE;
    }

    // 1. Span length constrained to 5 through 11 panels. This takes the deck from just above the water to existing
    // grade level.  It also ensures arch supports are above water.
    if (nPanels < 5 || nPanels > 11) {
      return CodeError.INFEASIBLE_SPAN_LENGTH;
    }

    // 2. Constrain deck elevation to 0 meters (24 meters below grade) through 24 meters (at grade).  These are as
    // measured in the Wizard.
    const deckElev = arch ? 4 * (nPanels - 5) + under : 4 * (nPanels - 5);
    if (deckElev < 0 || deckElev > this.GAP_DEPTH) {
      return CodeError.INFEASIBLE_DECK_ELEVATION;
    }

    // 3. Restrict upper design space height (above deck level) so that DeckElevation + UpperDesignSpaceHeight <= 32.
    // This is consistent with the power line height specified in the scenario and prevents graphical messes in the
    // drafting view of the bridge.
    if (deckElev + over > this.GAP_DEPTH + this.MIN_OVERHEAD) {
      return CodeError.INFEASIBLE_UPPER_HEIGHT;
    }

    // 4. For non-arches, restrict lower design space height (below deck level) so that
    // DeckElevation - LowerDesignSpaceHeight >= 0.  Prevents structure being under water.
    // (For arches, lower design space height is implicitly restricted by the deck elevation constraint 1.)
    if (!arch && deckElev - under < 0) {
      return CodeError.INFEASIBLE_LOWER_HEIGHT;
    }

    // 5. Restrict the pier to be in the range [left abutment joint + 4 .. right abutment joint - 4].
    // Prevents pier conflict with abutment.
    if ((pier && pierPanelIndex === 0) || pierPanelIndex >= nPanels - 1) {
      return CodeError.INFEASIBLE_PIER_LOCATION;
    }

    // 6. Prevent both arch and pier, primarily because the cost model is not well-defined for this case.
    if (arch && pier) {
      return CodeError.ARCH_AND_PIER_NOT_ALLOWED;
    }

    // 7. Check that if high pier is specified a pier joint index is also given. Simple consistency.
    // Done above.

    // 8. Check low pier joint is above ground as follows. If (xL,y) is the left abutment joint and (xp,yp) is the
    // pier joint, then check
    //        xp >= xL + (yL - yp) * .5
    // Similarly check
    //        xp <= xR - (yR - yp) * .5
    // for the right abutment (xR, yR).
    if (pier && !hiPier) {
      const xp = pierPanelIndex * this.PANEL_SIZE_WORLD;
      const yp = deckElev - under;
      const xL = 0;
      const yL = deckElev;
      const xR = nPanels * this.PANEL_SIZE_WORLD;
      const yR = yL;
      if (xp < xL + (yL - yp) * 0.5) {
        return CodeError.INFEASIBLE_LEFT_LOW_PIER_HEIGHT;
      }
      if (xp > xR - (yR - yp) * 0.5) {
        return CodeError.INFEASIBLE_RIGHT_LOW_PIER_HEIGHT;
      }
    }
    return CodeError.NONE;
  }

  public get setupKey(): string {
    return DesignConditions.getSetupKey(
      this.deckElevation,
      this.archHeight,
      this.pierHeight,
      this.anchorageCount,
      this.loadType,
      this.deckType,
    );
  }

  /** Returns a unique string key for given design condition attributes. */
  static getSetupKey(
    deckElevation: number,
    archHeight: number,
    pierHeight: number,
    anchorageCount: number,
    loadType: LoadType,
    deckType: DeckType,
  ): string {
    return `${deckElevation}|${archHeight}|${pierHeight}|${anchorageCount}|${loadType}|${deckType}`;
  }

  // Static factory intended to be called only by the service.
  static fromTaggedCodeLong(tag: string, codeLong: number): DesignConditions {
    return new DesignConditions(tag, codeLong);
  }

  // Static factory intended to be called only by the service.
  static fromKeyCodeLong(codeLong: number): DesignConditions {
    return new DesignConditions(this.FROM_KEY_CODE_TAG, codeLong);
  }

  // Static factory intended to be called only by the service.
  static fromKeyCode(keyCode: string): DesignConditions | CodeError {
    let codeLong: number = 0;
    try {
      codeLong = parseInt(keyCode, 10);
    } catch (error) {
      return CodeError.CODE_NOT_INTEGER;
    }
    const codeError = this.getCodeError(this.getCode(codeLong));
    if (codeError != CodeError.NONE) {
      return codeError;
    }
    return this.fromKeyCodeLong(codeLong);
  }

  public toString(): string {
    return (
      '{' +
      this.tag +
      ',' +
      this.codeLong +
      ',isHiPier: ' +
      this.isHiPier +
      ',leftCableIndex: ' +
      this.leftAnchorageJointIndex +
      ',rightCableIndex: ' +
      this.rightAnchorageJointIndex +
      ',pierJointIndex: ' +
      this.pierPanelIndex +
      ',underClearance: ' +
      this.underClearance +
      ',overClearance: ' +
      this.overClearance +
      ',nPanels: ' +
      this.panelCount +
      ',loadType: ' +
      this.loadType +
      ',deckType: ' +
      this.deckType +
      ',deckElevation: ' +
      this.deckElevation +
      ',archHeight: ' +
      this.archHeight +
      ',pierHeight: ' +
      this.pierHeight +
      ',nAnchorages: ' +
      this.anchorageCount +
      ',excavationVolume: ' +
      this.excavationVolume +
      ',abutmentCost: ' +
      this.abutmentCost +
      ',pierCost: ' +
      this.pierCost +
      ',deckCostRate: ' +
      this.deckCostRate +
      ',totalFixedCost: ' +
      this.totalFixedCost +
      ',setupKey: ' +
      this.setupKey +
      '}'
    );
  }
}

@Injectable({ providedIn: 'root' })
export class DesignConditionsService {
  /** Placeholder design conditions used e.g. for un-initialized bridge models. */
  public static readonly PLACEHOLDER_CONDITIONS = DesignConditions.placeholderConditions;

  /** Pre-defined design conditions. Intent is that the list of tuples can be garbage-collected. */
  public static readonly STANDARD_CONDITIONS: DesignConditions[] = (
    [
      // #region(collapsed) TABLE
      ['01A', 1110824000],
      ['01B', 2110824000],
      ['01C', 3110824000],
      ['01D', 4110824000],
      ['02A', 1101220000],
      ['02B', 2101220000],
      ['02C', 3101220000],
      ['02D', 4101220000],
      ['03A', 1091616000],
      ['03B', 2091616000],
      ['03C', 3091616000],
      ['03D', 4091616000],
      ['04A', 1082012000],
      ['04B', 2082012000],
      ['04C', 3082012000],
      ['04D', 4082012000],
      ['05A', 1072408000],
      ['05B', 2072408000],
      ['05C', 3072408000],
      ['05D', 4072408000],
      ['06A', 1062804000],
      ['06B', 2062804000],
      ['06C', 3062804000],
      ['06D', 4062804000],
      ['07A', 1053200000],
      ['07B', 2053200000],
      ['07C', 3053200000],
      ['07D', 4053200000],
      ['08A', 1110824200],
      ['08B', 2110824200],
      ['08C', 3110824200],
      ['08D', 4110824200],
      ['09A', 1101220200],
      ['09B', 2101220200],
      ['09C', 3101220200],
      ['09D', 4101220200],
      ['10A', 1091616200],
      ['10B', 2091616200],
      ['10C', 3091616200],
      ['10D', 4091616200],
      ['11A', 1082012200],
      ['11B', 2082012200],
      ['11C', 3082012200],
      ['11D', 4082012200],
      ['12A', 1072408200],
      ['12B', 2072408200],
      ['12C', 3072408200],
      ['12D', 4072408200],
      ['13A', 1062804200],
      ['13B', 2062804200],
      ['13C', 3062804200],
      ['13D', 4062804200],
      ['14A', 1053200200],
      ['14B', 2053200200],
      ['14C', 3053200200],
      ['14D', 4053200200],
      ['15A', 1110824300],
      ['15B', 2110824300],
      ['15C', 3110824300],
      ['15D', 4110824300],
      ['16A', 1101220300],
      ['16B', 2101220300],
      ['16C', 3101220300],
      ['16D', 4101220300],
      ['17A', 1091616300],
      ['17B', 2091616300],
      ['17C', 3091616300],
      ['17D', 4091616300],
      ['18A', 1082012300],
      ['18B', 2082012300],
      ['18C', 3082012300],
      ['18D', 4082012300],
      ['19A', 1072408300],
      ['19B', 2072408300],
      ['19C', 3072408300],
      ['19D', 4072408300],
      ['20A', 1062804300],
      ['20B', 2062804300],
      ['20C', 3062804300],
      ['20D', 4062804300],
      ['21A', 1053200300],
      ['21B', 2053200300],
      ['21C', 3053200300],
      ['21D', 4053200300],
      ['22A', 1100804100],
      ['22B', 2100804100],
      ['22C', 3100804100],
      ['22D', 4100804100],
      ['23A', 1090808100],
      ['23B', 2090808100],
      ['23C', 3090808100],
      ['23D', 4090808100],
      ['24A', 1080812100],
      ['24B', 2080812100],
      ['24C', 3080812100],
      ['24D', 4080812100],
      ['25A', 1070816100],
      ['25B', 2070816100],
      ['25C', 3070816100],
      ['25D', 4070816100],
      ['26A', 1060820100],
      ['26B', 2060820100],
      ['26C', 3060820100],
      ['26D', 4060820100],
      ['27A', 1050824100],
      ['27B', 2050824100],
      ['27C', 3050824100],
      ['27D', 4050824100],
      ['28A', 1091204100],
      ['28B', 2091204100],
      ['28C', 3091204100],
      ['28D', 4091204100],
      ['29A', 1081208100],
      ['29B', 2081208100],
      ['29C', 3081208100],
      ['29D', 4081208100],
      ['30A', 1071212100],
      ['30B', 2071212100],
      ['30C', 3071212100],
      ['30D', 4071212100],
      ['31A', 1061216100],
      ['31B', 2061216100],
      ['31C', 3061216100],
      ['31D', 4061216100],
      ['32A', 1051220100],
      ['32B', 2051220100],
      ['32C', 3051220100],
      ['32D', 4051220100],
      ['33A', 1081604100],
      ['33B', 2081604100],
      ['33C', 3081604100],
      ['33D', 4081604100],
      ['34A', 1071608100],
      ['34B', 2071608100],
      ['34C', 3071608100],
      ['34D', 4071608100],
      ['35A', 1061612100],
      ['35B', 2061612100],
      ['35C', 3061612100],
      ['35D', 4061612100],
      ['36A', 1051616100],
      ['36B', 2051616100],
      ['36C', 3051616100],
      ['36D', 4051616100],
      ['37A', 1072004100],
      ['37B', 2072004100],
      ['37C', 3072004100],
      ['37D', 4072004100],
      ['38A', 1062008100],
      ['38B', 2062008100],
      ['38C', 3062008100],
      ['38D', 4062008100],
      ['39A', 1052012100],
      ['39B', 2052012100],
      ['39C', 3052012100],
      ['39D', 4052012100],
      ['40A', 1062404100],
      ['40B', 2062404100],
      ['40C', 3062404100],
      ['40D', 4062404100],
      ['41A', 1052408100],
      ['41B', 2052408100],
      ['41C', 3052408100],
      ['41D', 4052408100],
      ['42A', 1052804100],
      ['42B', 2052804100],
      ['42C', 3052804100],
      ['42D', 4052804100],
      ['43A', 1110824060],
      ['43B', 2110824060],
      ['43C', 3110824060],
      ['43D', 4110824060],
      ['44A', 1110820060],
      ['44B', 2110820060],
      ['44C', 3110820060],
      ['44D', 4110820060],
      ['45A', 1110816060],
      ['45B', 2110816060],
      ['45C', 3110816060],
      ['45D', 4110816060],
      ['46A', 1110812060],
      ['46B', 2110812060],
      ['46C', 3110812060],
      ['46D', 4110812060],
      ['47A', 1110808060],
      ['47B', 2110808060],
      ['47C', 3110808060],
      ['47D', 4110808060],
      ['48A', 1110804060],
      ['48B', 2110804060],
      ['48C', 3110804060],
      ['48D', 4110804060],
      ['49A', 1110824061],
      ['49B', 2110824061],
      ['49C', 3110824061],
      ['49D', 4110824061],
      ['50A', 1101220060],
      ['50B', 2101220060],
      ['50C', 3101220060],
      ['50D', 4101220060],
      ['51A', 1101216060],
      ['51B', 2101216060],
      ['51C', 3101216060],
      ['51D', 4101216060],
      ['52A', 1101212060],
      ['52B', 2101212060],
      ['52C', 3101212060],
      ['52D', 4101212060],
      ['53A', 1101208060],
      ['53B', 2101208060],
      ['53C', 3101208060],
      ['53D', 4101208060],
      ['54A', 1101204060],
      ['54B', 2101204060],
      ['54C', 3101204060],
      ['54D', 4101204060],
      ['55A', 1101220061],
      ['55B', 2101220061],
      ['55C', 3101220061],
      ['55D', 4101220061],
      ['56A', 1091616050],
      ['56B', 2091616050],
      ['56C', 3091616050],
      ['56D', 4091616050],
      ['57A', 1091612050],
      ['57B', 2091612050],
      ['57C', 3091612050],
      ['57D', 4091612050],
      ['58A', 1091608050],
      ['58B', 2091608050],
      ['58C', 3091608050],
      ['58D', 4091608050],
      ['59A', 1091604050],
      ['59B', 2091604050],
      ['59C', 3091604050],
      ['59D', 4091604050],
      ['60A', 1091616051],
      ['60B', 2091616051],
      ['60C', 3091616051],
      ['60D', 4091616051],
      ['61A', 1082012050],
      ['61B', 2082012050],
      ['61C', 3082012050],
      ['61D', 4082012050],
      ['62A', 1082008050],
      ['62B', 2082008050],
      ['62C', 3082008050],
      ['62D', 4082008050],
      ['63A', 1082004050],
      ['63B', 2082004050],
      ['63C', 3082004050],
      ['63D', 4082004050],
      ['64A', 1082012051],
      ['64B', 2082012051],
      ['64C', 3082012051],
      ['64D', 4082012051],
      ['65A', 1072408040],
      ['65B', 2072408040],
      ['65C', 3072408040],
      ['65D', 4072408040],
      ['66A', 1072404040],
      ['66B', 2072404040],
      ['66C', 3072404040],
      ['66D', 4072404040],
      ['67A', 1072408041],
      ['67B', 2072408041],
      ['67C', 3072408041],
      ['67D', 4072408041],
      ['68A', 1062804040],
      ['68B', 2062804040],
      ['68C', 3062804040],
      ['68D', 4062804040],
      ['69A', 1062804041],
      ['69B', 2062804041],
      ['69C', 3062804041],
      ['69D', 4062804041],
      ['70A', 1053200031],
      ['70B', 2053200031],
      ['70C', 3053200031],
      ['70D', 4053200031],
      ['71A', 1110824360],
      ['71B', 2110824360],
      ['71C', 3110824360],
      ['71D', 4110824360],
      ['72A', 1110820360],
      ['72B', 2110820360],
      ['72C', 3110820360],
      ['72D', 4110820360],
      ['73A', 1110816360],
      ['73B', 2110816360],
      ['73C', 3110816360],
      ['73D', 4110816360],
      ['74A', 1110812360],
      ['74B', 2110812360],
      ['74C', 3110812360],
      ['74D', 4110812360],
      ['75A', 1110808360],
      ['75B', 2110808360],
      ['75C', 3110808360],
      ['75D', 4110808360],
      ['76A', 1110804360],
      ['76B', 2110804360],
      ['76C', 3110804360],
      ['76D', 4110804360],
      ['77A', 1110824361],
      ['77B', 2110824361],
      ['77C', 3110824361],
      ['77D', 4110824361],
      ['78A', 1101220360],
      ['78B', 2101220360],
      ['78C', 3101220360],
      ['78D', 4101220360],
      ['79A', 1101216360],
      ['79B', 2101216360],
      ['79C', 3101216360],
      ['79D', 4101216360],
      ['80A', 1101212360],
      ['80B', 2101212360],
      ['80C', 3101212360],
      ['80D', 4101212360],
      ['81A', 1101208360],
      ['81B', 2101208360],
      ['81C', 3101208360],
      ['81D', 4101208360],
      ['82A', 1101204360],
      ['82B', 2101204360],
      ['82C', 3101204360],
      ['82D', 4101204360],
      ['83A', 1101220361],
      ['83B', 2101220361],
      ['83C', 3101220361],
      ['83D', 4101220361],
      ['84A', 1091616350],
      ['84B', 2091616350],
      ['84C', 3091616350],
      ['84D', 4091616350],
      ['85A', 1091612350],
      ['85B', 2091612350],
      ['85C', 3091612350],
      ['85D', 4091612350],
      ['86A', 1091608350],
      ['86B', 2091608350],
      ['86C', 3091608350],
      ['86D', 4091608350],
      ['87A', 1091604350],
      ['87B', 2091604350],
      ['87C', 3091604350],
      ['87D', 4091604350],
      ['88A', 1091616351],
      ['88B', 2091616351],
      ['88C', 3091616351],
      ['88D', 4091616351],
      ['89A', 1082012350],
      ['89B', 2082012350],
      ['89C', 3082012350],
      ['89D', 4082012350],
      ['90A', 1082008350],
      ['90B', 2082008350],
      ['90C', 3082008350],
      ['90D', 4082008350],
      ['91A', 1082004350],
      ['91B', 2082004350],
      ['91C', 3082004350],
      ['91D', 4082004350],
      ['92A', 1082012351],
      ['92B', 2082012351],
      ['92C', 3082012351],
      ['92D', 4082012351],
      ['93A', 1072408340],
      ['93B', 2072408340],
      ['93C', 3072408340],
      ['93D', 4072408340],
      ['94A', 1072404340],
      ['94B', 2072404340],
      ['94C', 3072404340],
      ['94D', 4072404340],
      ['95A', 1072408341],
      ['95B', 2072408341],
      ['95C', 3072408341],
      ['95D', 4072408341],
      ['96A', 1062804340],
      ['96B', 2062804340],
      ['96C', 3062804340],
      ['96D', 4062804340],
      ['97A', 1062804341],
      ['97B', 2062804341],
      ['97C', 3062804341],
      ['97D', 4062804341],
      ['98A', 1053200331],
      ['98B', 2053200331],
      ['98C', 3053200331],
      ['98D', 4053200331],
      //#endregion
    ] as [string, number][]
  ).map(p => DesignConditions.fromTaggedCodeLong(...p));

  private static readonly STANDARD_CONDITIONS_FROM_SETUP_KEY: Map<string, DesignConditions> =
    DesignConditionsService.STANDARD_CONDITIONS.reduce((map, conditions) => {
      map.set(conditions.setupKey, conditions);
      return map;
    }, new Map<string, DesignConditions>());

  public getConditionsForSetupKey(key: string): DesignConditions {
    return Utility.assertNotUndefined(DesignConditionsService.STANDARD_CONDITIONS_FROM_SETUP_KEY.get(key), 'design conditions for key');
  }

  private static readonly STANDARD_CONDITIONS_FROM_CODE: Map<number, DesignConditions> =
    DesignConditionsService.STANDARD_CONDITIONS.reduce((map, conditions) => {
      map.set(conditions.codeLong, conditions);
      return map;
    }, new Map<number, DesignConditions>());

  private static readonly STANDARD_CONDITIONS_FROM_TAG: Map<string, DesignConditions> =
    DesignConditionsService.STANDARD_CONDITIONS.reduce((index, conditions) => {
      index.set(conditions.tag, conditions);
      return index;
    }, new Map<string, DesignConditions>());

  /** Tries to fetch conditions for the given code from tagged standards. If none exists, builds a new one tagged as a key code. */
  public getConditionsForCodeLong(code: number): DesignConditions {
    const conditions = DesignConditionsService.STANDARD_CONDITIONS_FROM_CODE.get(code);
    return conditions === undefined ? DesignConditions.fromKeyCodeLong(code) : conditions;
  }

  /** Fetches conditions with given standard tag. Returns undefined if none. */
  public getStandardConditionsForTag(tag: string): DesignConditions | undefined {
    return DesignConditionsService.STANDARD_CONDITIONS_FROM_TAG.get(tag);
  }

  public getConditionsForKeyCode(keyCode: string): DesignConditions | CodeError {
    return DesignConditions.fromKeyCode(keyCode);
  }

  /**
   * Returns valid but not intended for use design conditions. E.g. for un-initialized bridge models.
   * Always returns the same object, so if (foo === service.placeholderConditions) ... is useful.
   */
  public get placeholderConditions(): DesignConditions {
    return DesignConditionsService.PLACEHOLDER_CONDITIONS;
  }

  public isTagPrefix(s: string): boolean {
    let lo = 0;
    let hi = DesignConditionsService.STANDARD_CONDITIONS.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const midKey = DesignConditionsService.STANDARD_CONDITIONS[mid].tag.substring(0, s.length);
      if (s < midKey) {
        hi = mid - 1;
      } else if (s > midKey) {
        lo = mid + 1;
      } else {
        return true;
      }
    }
    return false;
  }
}
