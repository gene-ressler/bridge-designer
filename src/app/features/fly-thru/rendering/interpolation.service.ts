import { Inject, Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { CenterlinePost, TerrainModelService } from '../models/terrain-model.service';
import { vec2 } from 'gl-matrix';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { Geometry } from '../../../shared/classes/graphics';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { SiteConstants } from '../../../shared/classes/site-constants';
import { COLLAPSE_ANALYSIS } from '../pane/constants';
import { FlyThruSettingsService } from './fly-thru-settings.service';

/** Source data for an interpolator. Has several purpose-built implementations. */
interface InterpolatorSource {
  getJointDisplacementXForDeadLoadOnly(index: number): number;
  getJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2;
  getMemberForce(index: number, ctx: InterpolatorContext): number;
}

/** Whether a member is failed and, if so, the kind of failure. */
export enum FailedMemberKind {
  NONE = 0, // Falsy
  COMPRESSION,
  TENSION,
}

/** Interpolator between various analysis states to drive the animation. */
export interface Interpolator {
  /** Interpolation parameter: roughly meters right from the left abutment. */
  readonly parameter: number;
  /** Count of members failed during the last parameter advance. */
  readonly failedMemberCount: number;
  /** Which members failed during the last parameter advance. */
  readonly failedMemberKinds: Uint8Array; // FailedMemberKind[]
  /** Member force/strength ratios after the last parameter advance. */
  readonly memberForceStrengthRatios: Float32Array;
  /** Returns the interpolator advanced to a new parameter value. */
  withParameter(t: number): Interpolator;
  /** Gets front tire contact and load rotation as a unit vector at current parameter. */
  getLoadPosition(frontOut: vec2, rotationOut: vec2): void;
  /** Gets the displaced (with exaggeration) joint locations at current parameter. */
  getAllDisplacedJointLocations(out: Float32Array): Float32Array;
  /** Gets interpolated force on given member at current parameter. Source for cached member status. */
  getMemberForce(index: number): number;
}

/** Internal holder for an interpolation parameter and dependent values common to several interpolator methods. */
type InterpolatorContext = {
  /** Overall parameter. Roughly directed distance in x-coordinate meters from left abutment. */
  t: number;
  /** t scaled to bridge panel coordinate space. */
  tBridge: number;
  /** Whether tBridge is in the range [0..maxLoadCaseIndex]. */
  isLoadOnBridge: boolean;
  /** Value in [0..1) showing progress along the current panel. */
  tPanel: number;
  /** Left joint and load case index of the current panel. */
  leftLoadCase: number;
  /**
   * Right joint and load case index of the current panel or  zero if leftLoadCase is
   * maxLoadCaseIndex. Appropriate because load case 0 is "no live load.""
   */
  rightLoadCase: number;
};

/** Wrapper for an interpolation based on a, given source. */
class SourceInterpolator implements Interpolator {
  // Result buffers.
  private readonly post: CenterlinePost = { elevation: 0, xNormal: 0, yNormal: 1 };
  private readonly tmpJointA = vec2.create();
  private readonly tmpJointB = vec2.create();
  private readonly tmpDiff = vec2.create();
  private readonly tmpContext: InterpolatorContext = {} as InterpolatorContext;

  // Member status info is cached here upon advancing the parameter to save redundant
  // computation across simulation state machine and frame rendering.
  public readonly memberForceStrengthRatios = new Float32Array(DesignConditions.MAX_MEMBER_COUNT);
  public readonly failedMemberKinds = new Uint8Array(DesignConditions.MAX_MEMBER_COUNT); // FailedMemberKind[].
  public failedMemberCount: number = 0;

  private readonly ctx: InterpolatorContext = {} as InterpolatorContext;

  constructor(
    private readonly service: InterpolationService,
    private readonly interpolationSource: InterpolatorSource,
  ) {}

  /** Sets the context for interpolations by all other methods. */
  public withParameter(t: number): Interpolator {
    return this.setContextForParameter(this.ctx, t).updateMemberFailureStatus();
  }

  /** Returns the current parameter value. */
  public get parameter(): number {
    return this.ctx.t;
  }

  /**
   * Finds the way point (truck front wheel contact) and load rotation (to place rear wheels on the road)
   * for the current parameter. The rotation vector isn't normalized.
   */
  public getLoadPosition(frontOut: vec2, rotationOut: vec2): void {
    this.getWayPoint(frontOut);
    // Find a point one truck-length behind the load location by binary search.
    const truckLength = DesignConditions.PANEL_SIZE_WORLD;
    // Work with squared truck length to avoid square roots.
    const squaredTruckLength = truckLength * truckLength;
    let t0 = this.ctx.t - truckLength;
    // Use rotation vector as a buffer for the rear point.
    const rear = rotationOut;
    // Move t0 left until the bracket must include the rear wheel. Normally a single iteration.
    do {
      t0 -= truckLength;
      this.setContextForParameter(this.tmpContext, t0);
      this.getWayPoint(rear, this.tmpContext);
    } while (Geometry.distanceSquared2D(frontOut[0], frontOut[1], rear[0], rear[1]) < squaredTruckLength);
    let t1 = this.ctx.t;
    const eps2 = 0.08; // ~1 cm accuracy
    const hiLimit = squaredTruckLength + eps2;
    const loLimit = squaredTruckLength - eps2;
    // Bail at a fixed limit for safety e.g. for elevation discontinuities at bridge ends, where
    // no solution may exist.  Since the resulting point is still on the way, it's the best we can do.
    for (let i = 0; i < 16; ++i) {
      const t = (t0 + t1) * 0.5;
      this.setContextForParameter(this.tmpContext, t);
      this.getWayPoint(rear, this.tmpContext);
      const d2 = Geometry.distanceSquared2D(frontOut[0], frontOut[1], rear[0], rear[1]);
      if (d2 > hiLimit) {
        t0 = t;
      } else if (d2 < loLimit) {
        t1 = t;
      } else {
        break;
      }
    }
    vec2.sub(rotationOut, frontOut, rear);
  }

  /** Returns the interpolated displaced joint location for the current parameter. Exaggeration is incorporated. */
  public getAllDisplacedJointLocations(out: Float32Array): Float32Array {
    const joints = this.service.bridgeService.bridge.joints;
    for (let i = 0, i2 = 0; i < joints.length; ++i, i2 += 2) {
      const joint = joints[i];
      const v = this.getExaggeratedJointDisplacement(this.tmpJointA, i);
      out[i2] = v[0] + joint.x;
      out[i2 + 1] = v[1] + joint.y;
    }
    return out;
  }

  /** Returns interpolated member forces from adjacent load cases. */
  public getMemberForce(index: number): number {
    return this.interpolationSource.getMemberForce(index, this.ctx);
  }

  /**
   * Returns the current position of the load along its path. An optional context is
   * used for fetching alternate position data with the current load case.
   */
  private getWayPoint(out: vec2, ctx: InterpolatorContext = this.ctx): vec2 {
    if (ctx.isLoadOnBridge) {
      const leftIndex = ctx.leftLoadCase;
      this.getExaggeratedDisplacedJointLocation(this.tmpJointA, leftIndex);
      this.getExaggeratedDisplacedJointLocation(this.tmpJointB, leftIndex + 1);
      vec2.lerp(out, this.tmpJointA, this.tmpJointB, ctx.tPanel);
      // Offset result by deck height along the member perpendicular.
      const diff = this.tmpDiff;
      vec2.sub(diff, this.tmpJointB, this.tmpJointA);
      const s = SiteConstants.DECK_TOP_HEIGHT / vec2.length(diff);
      out[0] -= diff[1] * s;
      out[1] += diff[0] * s;
    } else {
      out[0] = ctx.t;
      out[1] = this.service.terrainModelService.getRoadCenterlinePostAtX(this.post, ctx.t).elevation;
    }
    return out;
  }

  /** Returns the interpolated displaced joint location for given joint index and the current parameter. */
  private getExaggeratedDisplacedJointLocation(pt: vec2, index: number): vec2 {
    this.getExaggeratedJointDisplacement(pt, index);
    const joint = this.service.bridgeService.bridge.joints[index];
    pt[0] += joint.x;
    pt[1] += joint.y;
    return pt;
  }

  /** Fills a context with calculations common to several methods for the given parameter. Avoids redundancy. */
  private setContextForParameter(ctx: InterpolatorContext, t: number): SourceInterpolator {
    ctx.t = t;
    const leftmostJointX = this.getExaggeratedJointDisplacementXForDeadLoadOnly(0);
    const panelIndexMax = this.service.bridgeService.designConditions.loadedJointCount - 1;
    const rightmostJointX = this.getExaggeratedJointDisplacementXForDeadLoadOnly(panelIndexMax);
    ctx.tBridge = ((t - leftmostJointX) / (rightmostJointX - leftmostJointX)) * panelIndexMax;
    if (t < leftmostJointX || t >= rightmostJointX) {
      // Not on bridge case.
      ctx.tPanel = ctx.leftLoadCase = ctx.rightLoadCase = NaN;
      ctx.isLoadOnBridge = false;
      return this;
    }
    ctx.isLoadOnBridge = true;
    ctx.leftLoadCase = Math.trunc(ctx.tBridge);
    ctx.tPanel = ctx.tBridge - ctx.leftLoadCase;
    ctx.rightLoadCase = ctx.leftLoadCase + 1;
    if (ctx.rightLoadCase >= panelIndexMax) {
      ctx.rightLoadCase = 0; // Off deck to the right: dead load only.
    }
    return this;
  }

  /** Fills fields that cache bridge failure status for the current parameter. Avoids redundancey. */
  private updateMemberFailureStatus(): SourceInterpolator {
    const members = this.service.bridgeService.bridge.members;
    this.failedMemberCount = 0;
    this.failedMemberKinds.fill(0); // NONE
    for (let i = 0; i < members.length; ++i) {
      const force = this.getMemberForce(i);
      const strength =
        force < 0
          ? this.service.analysisService.getMemberCompressiveStrength(i)
          : this.service.analysisService.getMemberTensileStrength(i);
      const ratio = force / strength;
      this.memberForceStrengthRatios[i] = ratio;
      if (ratio < -1) {
        this.failedMemberCount++;
        this.failedMemberKinds[i] = FailedMemberKind.COMPRESSION;
      } else if (ratio > 1) {
        this.failedMemberCount++;
        this.failedMemberKinds[i] = FailedMemberKind.TENSION;
      }
    }
    return this;
  }

  private getExaggeratedJointDisplacement(out: vec2, index: number): vec2 {
    this.interpolationSource.getJointDisplacement(out, index, this.ctx);
    return vec2.scale(out, out, this.service.settingsService.exaggeration);
  }

  /** Gets a displaced joint's x-coordinate for the dead load only case. */
  private getExaggeratedJointDisplacementXForDeadLoadOnly(index: number): number {
    const joint = this.service.bridgeService.bridge.joints[index];
    const exaggeration = this.service.settingsService.exaggeration;
    return joint.x + this.interpolationSource.getJointDisplacementXForDeadLoadOnly(index) * exaggeration;
  }
}

/**
 * Interpolator for the bridge collapse animation that bi-interpolates positions between a "base" analysis
 * (in practice one where a member fails) and a "dummy" one (in practice one with the same failed
 * members severely weakend). The dummy will have extreme joint displacements, a gross approximation of
 * collapse. For non-position values, i.e. those related to member forces, this interpolator delegates
 * directly to the base. Forces in the dummy aren't useful.
 */
class CollapseInterpolator implements Interpolator {
  private readonly collapseSource: BiInterpolatorSource;
  private readonly interpolator: Interpolator;

  constructor(
    private readonly service: InterpolationService,
    private readonly failedInterpolator: Interpolator,
  ) {
    // Base source
    const failedAnalysisSource = new AnalysisInterpolationSource(this.service.analysisService);
    // Dummy source
    const collapsedAnalysisSource = new AnalysisInterpolationSource(this.service.collapseAnalysisService);
    // Bi-interpolation source for positions
    this.collapseSource = new BiInterpolatorSource(failedAnalysisSource, collapsedAnalysisSource);
    // Bi-interpolator for positions with parameter frozen at the failure point
    const t = failedInterpolator.parameter;
    this.interpolator = new SourceInterpolator(service, this.collapseSource).withParameter(t);
  }

  /** Sets the source parameter: zero is the base, one is the dummy collapse. Advancing approximates collapse.  */
  public withParameter(t: number): Interpolator {
    this.collapseSource.withParameter(t);
    return this;
  }

  /** Returns the parameter at the failure collapse point, which is common to base and dummy interpolators. */
  public get parameter(): number {
    return this.interpolator.parameter;
  }

  /** Returns force strength rations from the base interpolator. */
  public get memberForceStrengthRatios(): Float32Array {
    return this.failedInterpolator.memberForceStrengthRatios;
  }

  /** Returns interpolated dummy load position. */
  public getLoadPosition(frontOut: vec2, rotationOut: vec2): void {
    return this.interpolator.getLoadPosition(frontOut, rotationOut);
  }

  /** Returns interpolated dummy joint locations.  */
  public getAllDisplacedJointLocations(out: Float32Array): Float32Array {
    return this.interpolator.getAllDisplacedJointLocations(out);
  }

  /** Returns failed member count from the base interpolator. */
  public get failedMemberCount(): number {
    return this.failedInterpolator.failedMemberCount;
  }

  /** Returns the failed member kinds mask of the base interpolator. */
  public get failedMemberKinds(): Uint8Array /* FailedMemberKind[] */ {
    return this.failedInterpolator.failedMemberKinds;
  }

  /** Returns a member force from the base interpolator. */
  public getMemberForce(index: number): number {
    return this.failedInterpolator.getMemberForce(index);
  }
}

/** An interpolation source between load cases of a single analysis. */
class AnalysisInterpolationSource implements InterpolatorSource {
  private readonly tmpDisplacementA = vec2.create();
  private readonly tmpDisplacementB = vec2.create();

  constructor(private readonly analysisService: AnalysisService) {}

  /** 
   * Returns the interpolated joint displacement for the given parameter. 
   * Parameters right of the failure load case, if any, interpolate to the failure.
   */
  getJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2 {
    const failureLoadCase = this.analysisService.failureLoadCase;
    if (failureLoadCase !== undefined && ctx.tBridge >= failureLoadCase) {
      this.analysisService.getJointDisplacement(out, failureLoadCase, index);
    } else if (ctx.isLoadOnBridge) {
      const left = this.analysisService.getJointDisplacement(this.tmpDisplacementA, ctx.leftLoadCase, index);
      const right = this.analysisService.getJointDisplacement(this.tmpDisplacementB, ctx.rightLoadCase, index);
      vec2.lerp(out, left, right, ctx.tPanel);
    } else {
      this.analysisService.getJointDisplacement(out, 0, index);
    }
    return out;
  }

  /** Returns the x-coordinate of joint displacement when only dead loads are applied. */
  getJointDisplacementXForDeadLoadOnly(index: number): number {
    return this.analysisService.getJointDisplacementX(0, index);
  }

  /** 
   * Returns the interpolated member force for the given parameter. 
   * Parameters right of the failure load case, if any, interpolate to the failure.
   */
  getMemberForce(index: number, ctx: InterpolatorContext): number {
    const failureLoadCase = this.analysisService.failureLoadCase;
    if (failureLoadCase !== undefined && ctx.tBridge >= failureLoadCase) {
      return this.analysisService.getMemberForce(failureLoadCase, index);
    }
    if (ctx.isLoadOnBridge) {
      const leftLoadCaseForce = this.analysisService.getMemberForce(ctx.leftLoadCase, index);
      const rightLoadCaseForce = this.analysisService.getMemberForce(ctx.rightLoadCase, index);
      return leftLoadCaseForce + ctx.tPanel * (rightLoadCaseForce - leftLoadCaseForce);
    }
    // Dead load only force if not on bridge.
    return this.analysisService.getMemberForce(0, index);
  }
}

/** A source that interpolates two other sources. */
class BiInterpolatorSource implements InterpolatorSource {
  public t: number = 0;
  private readonly tmpVecA = vec2.create();
  private readonly tmpVecB = vec2.create();

  constructor(
    private readonly sourceA: InterpolatorSource,
    private readonly sourceB: InterpolatorSource,
  ) {}

  getJointDisplacementXForDeadLoadOnly(index: number): number {
    const dxA = this.sourceA.getJointDisplacementXForDeadLoadOnly(index);
    const dxB = this.sourceB.getJointDisplacementXForDeadLoadOnly(index);
    return dxA + this.t * (dxB - dxA);
  }

  getJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2 {
    const aDisplacement = this.sourceA.getJointDisplacement(this.tmpVecA, index, ctx);
    const bDisplacement = this.sourceB.getJointDisplacement(this.tmpVecB, index, ctx);
    return vec2.lerp(out, aDisplacement, bDisplacement, this.t);
  }

  getMemberForce(index: number, ctx: InterpolatorContext): number {
    const aForce = this.sourceA.getMemberForce(index, ctx);
    const bForce = this.sourceB.getMemberForce(index, ctx);
    return aForce + this.t * (bForce - aForce);
  }

  public withParameter(t: number): BiInterpolatorSource {
    this.t = t;
    return this;
  }
}

/** Container for various kinds of interpolators. */
@Injectable({ providedIn: 'root' })
export class InterpolationService {
  /** An interpolation source simulating a bridge with no loads applied, including dead loads. */
  private static readonly ZERO_FORCE_INTERPOLATION_SOURCE: InterpolatorSource = {
    getJointDisplacement: (out: vec2, _index: number, _ctx: InterpolatorContext): vec2 => vec2.zero(out),
    getJointDisplacementXForDeadLoadOnly: (_index: number): number => 0,
    getMemberForce: (_index: number, _ctx: InterpolatorContext): number => 0,
  };

  constructor(
    readonly analysisService: AnalysisService,
    @Inject(COLLAPSE_ANALYSIS) readonly collapseAnalysisService: AnalysisService,
    readonly bridgeService: BridgeService,
    readonly settingsService: FlyThruSettingsService,
    readonly terrainModelService: TerrainModelService,
  ) {}

  /** Creates an interpolator between load cases of the current analysis. A valid underlying analysis is required. */
  public createAnalysisInterpolator(): Interpolator {
    const source = new AnalysisInterpolationSource(this.analysisService);
    return new SourceInterpolator(this, source);
  }

  /** Creates an interpolator between zero and dead load conditions with given load location. A valid underlying analysis is required. */
  public createDeadLoadingInterpolator(t: number): Interpolator {
    const source = new AnalysisInterpolationSource(this.analysisService);
    const deadLoadingSource = new BiInterpolatorSource(InterpolationService.ZERO_FORCE_INTERPOLATION_SOURCE, source);
    const interpolator = new SourceInterpolator(this, deadLoadingSource).withParameter(t);
    // Monkey patch the interpolator's parameter setter to operate on the bi-source.
    const interpolatorWithParameter = interpolator.withParameter.bind(interpolator);
    interpolator.withParameter = tSource => {
      deadLoadingSource.withParameter(tSource);
      interpolatorWithParameter(t); // Refresh interpolator internal state with new source value
      return interpolator;
    };
    return interpolator;
  }

  /**
   * From the given failed analysis interpolator, creates an interpolator
   * between it and a dummy collapsed analysis with the same parameter value.
   */
  public createCollapseInterpolator(failedInterpolator: Interpolator): Interpolator {
    return new CollapseInterpolator(this, failedInterpolator);
  }
}
