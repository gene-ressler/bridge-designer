import { Injectable } from '@angular/core';
import { DeckType, LoadType } from './design-conditions.service';
import { InventoryService } from './inventory.service';
import { Utility } from '../classes/utility';
import { BitVector } from '../core/bitvector';
import { BridgeService } from './bridge.service';
import { EventBrokerService, EventOrigin } from './event-broker.service';
import { vec2 } from 'gl-matrix';

export type ForceStrengthRatios = { compression: number; tension: number };

/** Status of the analysis. Use status > UNSTABLE to test whether report will be valid.  */
export const enum AnalysisStatus {
  /** No analysis yet. */
  NONE,
  /** Analysis complete, but the final slenderness check failed. */
  FAILS_SLENDERNESS,
  /** Analysis could not be completed because the bridge is unstable. */
  UNSTABLE,
  /** Analysis was completed, but the load test failed. */
  FAILS_LOAD_TEST,
  /** Analysis was completed, and the bridge passed. */
  PASSES,
}

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  private static readonly deadLoadFactor = 1.35;
  private static readonly liveLoadFactor = 1.75 * 1.33;

  /** Multiplier for degrading the strength of members to animate the bridge failure. */
  private static readonly failedMemberDegradation = 1.0 / 50.0;

  // Results matrices:
  // For member forces, indexes are [load index] [member index]
  // For joint displacements, indexes are [load index] [joint index]
  // In turn, there is one load index for each loaded (deck) joint.
  private memberForce: Float64Array[] = [];
  private jointDisplacement: Float64Array[] = [];
  private memberFails: BitVector[] = [];
  private memberCompressionStrength: Float64Array = new Float64Array();
  private memberTensionStrength: Float64Array = new Float64Array();
  private maxMemberCompressiveForces: Float64Array = new Float64Array();
  private maxMemberTensileForces: Float64Array = new Float64Array();
  private _status: AnalysisStatus = AnalysisStatus.NONE;

  /**
   * Return the analysis status.
   * <pre>
   * NONE = 0;          analysis has not been performed
   * UNSTABLE = 1;           analysis could not complete because bridge is unstable
   * FAILS_SLENDERNESS = 2;  analysis completed, but at least one member is too slender
   * FAILS_LOAD_TEST = 3;    analysis completed, but bridge could not carry the load
   * PASSES = 4;             analysis completed, and bridge carries load
   * </pre>
   * @return analysis status indicator
   */
  public get status(): AnalysisStatus {
    return this._status;
  }

  /**
   * Return the member force of a given member and load case.  It is the caller's responsibility
   * to ensure the analysis is valid and indices are in range.
   *
   * @param ilc load case index
   * @param im member index
   * @return member force
   */
  public getMemberForce(ilc: number, im: number) {
    return this.memberForce[ilc][im];
  }

  /**
   * Get the vector displacement of a given joint and load case.  It is the caller's responsibility
   * to ensure the analysis is valid and indices are in range.
   *
   * @param value provided result buffer
   * @param ilc load case index
   * @param ij joint index
   */
  public getJointDisplacement(value: vec2, ilc: number, ij: number): vec2 {
    const iBase = 2 * ij;
    value[0] = this.jointDisplacement[ilc][iBase];
    value[1] = this.jointDisplacement[ilc][iBase + 1];
    return value;
  }

  public getJointDisplacementX(ilc: number, ij: number): number {
    return this.jointDisplacement[ilc][2 * ij];
  }

  public getJointDisplacementY(ilc: number, ij: number): number {
    return this.jointDisplacement[ilc][2 * ij + 1];
  }

  /**
   * Return the maximum compressive force acting on a given member among all load cases.  It is the caller's
   * responsibility to ensure the analysis is valid and indices are in range.
   *
   * @param i member index
   * @return maximum compressive force
   */
  public getMemberCompressiveForce(i: number): number {
    return this.maxMemberCompressiveForces[i];
  }

  /**
   * Return the maximum tensile force acting on a given member among all load cases.  It is the caller's
   * responsibility to ensure the analysis is valid and indices are in range.
   *
   * @param i member index
   * @return maximum tensile force
   */
  public getMemberTensileForce(i: number): number {
    return this.maxMemberTensileForces[i];
  }

  /**
   * Return the max allowable compressive force that may act on a given member before it fails.
   *
   * This computation ignores slenderness.  Slenderness failures are considered separately.
   *
   * @param i member index
   * @return compressive strength
   */
  public getMemberCompressiveStrength(i: number): number {
    return this.memberCompressionStrength[i];
  }

  /**
   * Return the max allowable tensile force that may act on a given member before it fails.
   *
   * @param i member index
   * @return tensile strength
   */
  public getMemberTensileStrength(i: number): number {
    return this.memberTensionStrength[i];
  }

  /**
   * Analyzes the bridge provided by BridgeService.
   *
   * Optionally populates the bridge with UI info and degrades selected members for failure animation.
   *
   * @param bridge bridge to analyze
   * @param failureStatus status of failed members: FAILED, NOT_FAILED, base member getLength, which implies FAILED.
   */
  public analyze(options?: { degradeMembersMask?: BitVector; populateBridgeMembers?: boolean }): void {
    this.analyzeImpl(options || {});
    if (options?.populateBridgeMembers) {
      this.eventBrokerService.analysisCompletion.next({ origin: EventOrigin.SERVICE, data: this._status });
    }
  }

  private analyzeImpl(options: { degradeMembersMask?: BitVector; populateBridgeMembers?: boolean }): void {
    const bridge = this.bridgeService.bridge;
    const conditions = this.bridgeService.designConditions;
    this._status = AnalysisStatus.NONE;
    const nJoints = bridge.joints.length;
    const nEquations = 2 * nJoints;
    const members = bridge.members;
    const nMembers = members.length;
    const length = new Float64Array(members.length);
    const cosX = new Float64Array(members.length);
    const cosY = new Float64Array(members.length);
    for (let i = 0; i < members.length; i++) {
      const a = members[i].a;
      const b = members[i].b;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      length[i] = Math.hypot(dx, dy);
      cosX[i] = dx / length[i];
      cosY[i] = dy / length[i];
    }
    const nLoadInstances = conditions.loadedJointCount;
    const pointLoads = Utility.create2dFloat64Array(nLoadInstances, nEquations);
    for (let im = 0; im < nMembers; im++) {
      const member = members[im];
      const deadLoad =
        (AnalysisService.deadLoadFactor * member.shape.area * length[im] * member.material.density * 9.8066) / 2000.0;
      const dof1 = 2 * member.a.index + 1;
      const dof2 = 2 * member.b.index + 1;
      for (let ilc = 0; ilc < nLoadInstances; ilc++) {
        pointLoads[ilc][dof1] -= deadLoad;
        pointLoads[ilc][dof2] -= deadLoad;
      }
    }
    const pointDeadLoad =
      conditions.deckType === DeckType.MEDIUM_STRENGTH
        ? AnalysisService.deadLoadFactor * 120.265 + 33.097
        : AnalysisService.deadLoadFactor * 82.608 + 33.097;
    for (let ij = 0; ij < conditions.loadedJointCount; ij++) {
      const dof = 2 * ij + 1;
      for (let ilc = 0; ilc < nLoadInstances; ilc++) {
        let load = pointDeadLoad;
        if (ij === 0 || ij === conditions.loadedJointCount - 1) {
          load /= 2;
        }
        pointLoads[ilc][dof] -= load;
      }
    }
    // Standard (light) truck.
    const [frontAxleLoad, rearAxleLoad] = conditions.loadType === LoadType.STANDARD_TRUCK ? [71, 181] : [137, 137];
    for (let ilc = 1; ilc < nLoadInstances; ilc++) {
      const iFront = 2 * ilc + 1;
      const iRear = iFront - 2;
      pointLoads[ilc][iFront] -= AnalysisService.liveLoadFactor * frontAxleLoad;
      pointLoads[ilc][iRear] -= AnalysisService.liveLoadFactor * rearAxleLoad;
    }
    const xRestraint = new BitVector(nJoints);
    const yRestraint = new BitVector(nJoints);
    xRestraint.setBit(0);
    yRestraint.setBit(0).setBit(conditions.loadedJointCount - 1);
    if (conditions.isPier) {
      const i = conditions.pierJointIndex;
      xRestraint.setBit(i);
      yRestraint.setBit(i);
      if (conditions.isHiPier) {
        xRestraint.clearBit(0);
      }
    }
    if (conditions.isArch) {
      const i = conditions.archJointIndex;
      xRestraint
        .clearBit(0)
        .setBit(i)
        .setBit(i + 1);
      yRestraint
        .clearBit(0)
        .setBit(i)
        .setBit(i + 1)
        .clearBit(conditions.loadedJointCount - 1);
    }
    if (conditions.isLeftAnchorage) {
      const i = conditions.leftAnchorageJointIndex;
      xRestraint.setBit(i);
      yRestraint.setBit(i);
    }
    if (conditions.isRightAnchorage) {
      const i = conditions.rightAnchorageJointIndex;
      xRestraint.setBit(i);
      yRestraint.setBit(i);
    }
    const stiffness = Utility.create2dFloat64Array(nEquations, nEquations);
    for (let im = 0; im < nMembers; im++) {
      let e = members[im].material.e;
      if (options?.degradeMembersMask?.getBit(im)) {
        e *= AnalysisService.failedMemberDegradation;
      }
      const aEOverL = (members[im].shape.area * e) / length[im];
      const xx = aEOverL * Utility.sqr(cosX[im]);
      const yy = aEOverL * Utility.sqr(cosY[im]);
      const xy = aEOverL * cosX[im] * cosY[im];
      const j1 = members[im].a.index;
      const j2 = members[im].b.index;
      const j1x = 2 * j1;
      const j1y = 2 * j1 + 1;
      const j2x = 2 * j2;
      const j2y = 2 * j2 + 1;
      stiffness[j1x][j1x] += xx;
      stiffness[j1x][j1y] += xy;
      stiffness[j1x][j2x] -= xx;
      stiffness[j1x][j2y] -= xy;
      stiffness[j1y][j1x] += xy;
      stiffness[j1y][j1y] += yy;
      stiffness[j1y][j2x] -= xy;
      stiffness[j1y][j2y] -= yy;
      stiffness[j2x][j1x] -= xx;
      stiffness[j2x][j1y] -= xy;
      stiffness[j2x][j2x] += xx;
      stiffness[j2x][j2y] += xy;
      stiffness[j2y][j1x] -= xy;
      stiffness[j2y][j1y] -= yy;
      stiffness[j2y][j2x] += xy;
      stiffness[j2y][j2y] += yy;
    }
    for (let ilc = 0; ilc < nLoadInstances; ilc++) {
      for (let ij = 0; ij < nJoints; ij++) {
        if (xRestraint.getBit(ij)) {
          const ix = 2 * ij;
          for (let ie = 0; ie < nEquations; ie++) {
            stiffness[ix][ie] = stiffness[ie][ix] = 0;
          }
          stiffness[ix][ix] = 1;
          pointLoads[ilc][ix] = 0;
        }
        if (yRestraint.getBit(ij)) {
          const iy = 2 * ij + 1;
          for (let ie = 0; ie < nEquations; ie++) {
            stiffness[iy][ie] = stiffness[ie][iy] = 0;
          }
          stiffness[iy][iy] = 1;
          pointLoads[ilc][iy] = 0;
        }
      }
    }
    for (let ie = 0; ie < nEquations; ie++) {
      const pivot = stiffness[ie][ie];
      if (Math.abs(pivot) < 0.99) {
        this._status = AnalysisStatus.UNSTABLE;
        if (options?.populateBridgeMembers) {
          this.depopulateBridgeMembers();
        }
        return;
      }
      const pivr = 1.0 / pivot;
      for (let k = 0; k < nEquations; k++) {
        stiffness[ie][k] *= pivr;
      }
      for (let k = 0; k < nEquations; k++) {
        if (k != ie) {
          const p = stiffness[k][ie];
          for (let j = 0; j < nEquations; j++) {
            stiffness[k][j] -= stiffness[ie][j] * p;
          }
          stiffness[k][ie] = -p * pivr;
        }
      }
      stiffness[ie][ie] = pivr;
    }
    this.memberForce = Utility.create2dFloat64Array(nLoadInstances, nMembers);
    this.memberFails = Utility.create2dBitArray(nLoadInstances, nMembers);
    this.jointDisplacement = Utility.create2dFloat64Array(nLoadInstances, nEquations);
    const displacementA = vec2.create();
    const displacementB = vec2.create();
    for (let ilc = 0; ilc < nLoadInstances; ilc++) {
      for (let ie = 0; ie < nEquations; ie++) {
        let tmp = 0;
        for (let je = 0; je < nEquations; je++) {
          tmp += stiffness[ie][je] * pointLoads[ilc][je];
        }
        this.jointDisplacement[ilc][ie] = tmp;
      }
      // Compute member forces.
      for (let im = 0; im < nMembers; im++) {
        const member = members[im];
        let e = member.material.e;
        if (options?.degradeMembersMask?.getBit(im)) {
          e *= AnalysisService.failedMemberDegradation;
        }
        this.getJointDisplacement(displacementA, ilc, member.a.index);
        this.getJointDisplacement(displacementB, ilc, member.b.index);
        this.memberForce[ilc][im] =
          ((member.shape.area * e) / length[im]) *
          (cosX[im] * (displacementB[0] - displacementA[0]) + cosY[im] * (displacementB[1] - displacementA[1]));
      }
    }

    this.memberCompressionStrength = new Float64Array(nMembers);
    this.memberTensionStrength = new Float64Array(nMembers);
    this.maxMemberCompressiveForces = new Float64Array(nMembers);
    this.maxMemberTensileForces = new Float64Array(nMembers);

    for (let im = 0; im < nMembers; im++) {
      const material = members[im].material;
      const shape = members[im].shape;
      this.memberCompressionStrength[im] = InventoryService.compressiveStrength(material, shape, length[im]);
      this.memberTensionStrength[im] = InventoryService.tensileStrength(material, shape);
    }
    this._status = AnalysisStatus.PASSES;
    for (let im = 0; im < nMembers; im++) {
      let maxCompression: number = 0;
      let maxTension: number = 0;
      for (let ilc = 0; ilc < nLoadInstances; ilc++) {
        let force = this.memberForce[ilc][im];
        if (force < 0) {
          force = -force;
          if (force > maxCompression) {
            maxCompression = force;
          }
          this.memberFails[ilc].setBitValue(im, force / this.memberCompressionStrength[im] > 1.0);
        } else {
          if (force > maxTension) {
            maxTension = force;
          }
          this.memberFails[ilc].setBitValue(im, force / this.memberTensionStrength[im] > 1.0);
        }
      }
      const compressionStrength = this.memberCompressionStrength[im];
      const tensionStrength = this.memberTensionStrength[im];
      // A fail for any member of any kind is a fail overall.
      if (maxCompression > compressionStrength || maxTension > tensionStrength) {
        this._status = AnalysisStatus.FAILS_LOAD_TEST;
      }
      if (options?.populateBridgeMembers) {
        const member = members[im];
        member.maxCompression = maxCompression;
        member.compressionStrength = compressionStrength;
        member.maxTension = maxTension;
        member.tensionStrength = tensionStrength;
      }
      this.maxMemberCompressiveForces[im] = maxCompression;
      this.maxMemberTensileForces[im] = maxTension;
    }
    if (!this.bridgeService.isPassingSlendernessCheck) {
      this._status = AnalysisStatus.FAILS_SLENDERNESS;
    }
  }

  public static getStatusIcon(status: AnalysisStatus, useSmall?: boolean): { src: string; title: string } {
    const small = useSmall ? 'small' : '';
    switch (status) {
      case AnalysisStatus.PASSES:
        return { src: `img/good${small}.png`, title: 'The design passed its last test.' };
      case AnalysisStatus.FAILS_LOAD_TEST:
        return { src: `img/bad${small}.png`, title: 'The design failed its last test.' };
      case AnalysisStatus.FAILS_SLENDERNESS:
        return { src: `img/bad${small}.png`, title: 'Some members that are too slender.' };
      case AnalysisStatus.UNSTABLE:
        return { src: `img/bad${small}.png`, title: 'The design is unstable.' };
      default:
        return { src: `img/working${small}.png`, title: "The design hasn't been analyzed." };
    }
  }

  private depopulateBridgeMembers(): void {
    for (const member of this.bridgeService.bridge.members) {
      member.maxCompression = member.compressionStrength = member.maxTension = member.tensionStrength = NaN;
    }
  }
}
