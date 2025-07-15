import { Inject, Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { CenterlinePost, TerrainModelService } from '../models/terrain-model.service';
import { vec2 } from 'gl-matrix';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { Geometry } from '../../../shared/classes/graphics';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { SimulationParametersService } from './simulation-parameters.service';
import { SiteConstants } from '../../../shared/classes/site.model';
import { BitVector } from '../../../shared/core/bitvector';
import { COLLAPSE_ANALYSIS } from '../pane/constants';

/** Source data for an interpolator. Has several purpose-built implementations. */
interface InterpolatorSource {
  getJointDisplacementXForDeadLoadOnly(index: number): number;
  getJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2;
  getMemberForce(index: number, ctx: InterpolatorContext): number;
}

/** Interpolator between various analysis states to drive the animation. */
export interface Interpolator {
  readonly memberForceStrengthRatios: Float32Array;
  readonly isTestFailed: boolean;
  readonly parameter: number;
  readonly failedMemberMask: BitVector;
  withParameter(t: number): Interpolator;
  getLoadPosition(frontOut: vec2, rotationOut: vec2): void;
  getAllDisplacedJointLocations(out: Float32Array): Float32Array;
  getMemberForce(index: number): number;
}

/** Internal holder for calculations common to several interpolator methods. */
type InterpolatorContext = {
  /** Overall parameter. Roughly directed distance in x-coordinate meters from left abutment. */
  t: number;
  /**
   * If truck is on the bridge, parameter in [0..maxLoadCaseIndex] showing progress or NaN
   * if not. The max load case is at the second last deck joint looking left to right.
   */
  tBridge: number;
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

/** Wrapper for interpolation logic that refers to a given source. */
class AnalysisInterpolator implements Interpolator {
  // Result buffers.
  private readonly post: CenterlinePost = { elevation: 0, xNormal: 0, yNormal: 1 };
  private readonly tmpJointA = vec2.create();
  private readonly tmpJointB = vec2.create();
  private readonly tmpDiff = vec2.create();
  private readonly tmpContext: InterpolatorContext = {} as InterpolatorContext;

  // Member status info is cached here while advancing the parameter to save redundant
  // computation across simulation state machine and frame rendering.
  public readonly memberForceStrengthRatios = new Float32Array(DesignConditions.MAX_MEMBER_COUNT);
  public readonly failedMemberMask = new BitVector(DesignConditions.MAX_MEMBER_COUNT);
  public isTestFailed: boolean = false;

  private readonly ctx: InterpolatorContext = {} as InterpolatorContext;

  constructor(
    private readonly service: InterpolationService,
    private readonly interpolationSource: InterpolatorSource,
  ) {}

  /** Sets the context for interpolations by all other methods. */
  public withParameter(t: number): Interpolator {
    return this.setContextForParameter(this.ctx, t).updateMemberFailureStatus();
  }

  public get parameter(): number {
    return this.ctx.t;
  }

  public getWayPoint(out: vec2, ctx: InterpolatorContext = this.ctx): vec2 {
    if (isNaN(ctx.tBridge)) {
      out[0] = ctx.t;
      out[1] = this.service.terrainModelService.getRoadCenterlinePostAtX(this.post, ctx.t).elevation;
    } else {
      this.getExaggeratedDisplacedJointLocation(this.tmpJointA, ctx.leftLoadCase, ctx);
      this.getExaggeratedDisplacedJointLocation(this.tmpJointB, ctx.leftLoadCase + 1, ctx);
      vec2.lerp(out, this.tmpJointA, this.tmpJointB, ctx.tPanel);
      // Offset result by deck height along the member perpendicular.
      const diff = this.tmpDiff;
      vec2.sub(diff, this.tmpJointB, this.tmpJointA);
      const s = SiteConstants.DECK_TOP_HEIGHT / vec2.length(diff);
      out[0] -= diff[1] * s;
      out[1] += diff[0] * s;
    }
    return out;
  }

  /** Finds the front and rear load way points corresponding to the given front one; returns the rear.  */
  public getLoadPosition(frontOut: vec2, rotationOut: vec2): void {
    this.getWayPoint(frontOut);
    // Find a point one truck-length behind the load location by binary search.
    const truckLength = DesignConditions.PANEL_SIZE_WORLD;
    let t0 = this.ctx.t - truckLength;
    // Use rotation vector as a buffer for the rear point.
    const rear = rotationOut;
    // Move t0 left until the bracket must include the rear wheel. Normally a single iteration.
    do {
      t0 -= truckLength;
      this.setContextForParameter(this.tmpContext, t0);
      this.getWayPoint(rear, this.tmpContext);
    } while (frontOut[0] - rear[0] < truckLength);
    let t1 = this.ctx.t;
    const target = truckLength * truckLength;
    const eps2 = 0.05; // ~half centimeter accuracy
    const hiLimit = target + eps2;
    const loLimit = target - eps2;
    // Bail at a fixed limit for safety e.g. for elevation discontinuities at bridge ends, where no solution may exist.
    for (let i = 0; i < 20; ++i) {
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
    vec2.normalize(rotationOut, rotationOut);
  }

  /** Returns the interpolated displaced joint location for the current parameter. Exaggeration is incorporated. */
  public getAllDisplacedJointLocations(out: Float32Array): Float32Array {
    const joints = this.service.bridgeService.bridge.joints;
    let i2 = 0;
    for (const joint of joints) {
      const v = this.getExaggeratedJointDisplacement(this.tmpJointA, joint.index, this.ctx);
      out[i2] = v[0] + joint.x;
      out[i2 + 1] = v[1] + joint.y;
      i2 += 2;
    }
    return out;
  }

  public getMemberForce(index: number): number {
    return this.interpolationSource.getMemberForce(index, this.ctx);
  }

  /**
   * Returns the interpolated displaced joint location for given joint index and, by default, the current parameter.
   * An alternate context is optional.
   */
  private getExaggeratedDisplacedJointLocation(pt: vec2, index: number, ctx: InterpolatorContext = this.ctx): vec2 {
    this.getExaggeratedJointDisplacement(pt, index, ctx);
    const joint = this.service.bridgeService.bridge.joints[index];
    pt[0] += joint.x;
    pt[1] += joint.y;
    return pt;
  }

  /** Fills a wrapper for calculations common to several methods. */
  private setContextForParameter(ctx: InterpolatorContext, t: number): AnalysisInterpolator {
    const leftmostJointX = this.getExaggeratedJointDisplacementXForDeadLoadOnly(0);
    const panelIndexMax = this.service.bridgeService.designConditions.loadedJointCount - 1;
    const rightmostJointX = this.getExaggeratedJointDisplacementXForDeadLoadOnly(panelIndexMax);
    const tBridge =
      leftmostJointX <= t && t < rightmostJointX
        ? ((t - leftmostJointX) / (rightmostJointX - leftmostJointX)) * panelIndexMax
        : NaN;
    const leftLoadCase = Math.trunc(tBridge);
    const tPanel = tBridge - leftLoadCase;
    let rightLoadCase = leftLoadCase + 1;
    if (rightLoadCase >= panelIndexMax) {
      rightLoadCase = 0; // Off deck to the right: dead load only.
    }
    ctx.t = t;
    ctx.tBridge = tBridge;
    ctx.tPanel = tPanel;
    ctx.leftLoadCase = leftLoadCase;
    ctx.rightLoadCase = rightLoadCase;
    return this;
  }

  private updateMemberFailureStatus(): AnalysisInterpolator {
    const members = this.service.bridgeService.bridge.members;
    this.isTestFailed = false;
    this.failedMemberMask.clearAll();
    for (let i = 0; i < members.length; ++i) {
      const force = this.getMemberForce(i);
      const strength =
        force < 0
          ? this.service.analysisService.getMemberCompressiveStrength(i)
          : this.service.analysisService.getMemberTensileStrength(i);
      const ratio = force / strength;
      this.memberForceStrengthRatios[i] = ratio;
      if (Math.abs(ratio) > 1) {
        this.isTestFailed = true;
        this.failedMemberMask.setBit(i);
      }
    }
    return this;
  }

  private getExaggeratedJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2 {
    this.interpolationSource.getJointDisplacement(out, index, ctx);
    return vec2.scale(out, out, this.service.parametersService.exaggeration);
  }

  /** Gets a displaced joint's x-coordinate for the dead load only case. */
  private getExaggeratedJointDisplacementXForDeadLoadOnly(index: number): number {
    const joint = this.service.bridgeService.bridge.joints[index];
    const exaggeration = this.service.parametersService.exaggeration;
    return joint.x + this.interpolationSource.getJointDisplacementXForDeadLoadOnly(index) * exaggeration;
  }
}

/**
 * Interpolator for the bridge collapse animation. Bi-interpolates positions between a "base" interpolator
 * (in practice one where a member fails) and a "dummy" analysis interpolator (in practice one with the
 * same failed members severely weakend). The dummy will have extreme joint displacements, a gross
 * approximation of collapse. For non-position values, i.e. those related to member forces, delegates
 * to the base interpolator, since forces in the dummy aren't useful.
 */
class CollapseInterpolator implements Interpolator {
  private readonly collapseSource: BiInterpolatorSource;
  private readonly interpolator: Interpolator;

  constructor(
    private readonly service: InterpolationService,
    private readonly failedInterpolator: Interpolator,
  ) {
    // base source
    const failedAnalysisAdapter = new AnalysisInterpolationSourceAdapter(this.service.analysisService);
    // dummy source
    const collapsedAnalysisAdapter = new AnalysisInterpolationSourceAdapter(this.service.collapseAnalysisService);
    // bi-interpolation source for positions
    this.collapseSource = new BiInterpolatorSource(failedAnalysisAdapter, collapsedAnalysisAdapter);
    // bi-interpolator frozen at the failure point
    const t = failedInterpolator.parameter;
    this.interpolator = new AnalysisInterpolator(service, this.collapseSource).withParameter(t);
  }

  public get memberForceStrengthRatios(): Float32Array {
    return this.failedInterpolator.memberForceStrengthRatios;
  }

  /** Sets the source parameter: zero is the base, one is the dummy collapse. Advancing approximates collapse.  */
  public withParameter(t: number): Interpolator {
    this.collapseSource.withParameter(t);
    return this;
  }

  public get parameter(): number {
    return this.interpolator.parameter;
  }

  public getLoadPosition(frontOut: vec2, rotationOut: vec2): void {
    return this.interpolator.getLoadPosition(frontOut, rotationOut);
  }

  public getAllDisplacedJointLocations(out: Float32Array): Float32Array {
    return this.interpolator.getAllDisplacedJointLocations(out);
  }

  public get isTestFailed(): boolean {
    return this.failedInterpolator.isTestFailed;
  }

  public get failedMemberMask(): BitVector {
    return this.failedInterpolator.failedMemberMask;
  }

  getMemberForce(index: number): number {
    return this.failedInterpolator.getMemberForce(index);
  }
}

/** A source adapter for interpolating between analysis load cases. */
class AnalysisInterpolationSourceAdapter implements InterpolatorSource {
  private readonly tmpDisplacementA = vec2.create();
  private readonly tmpDisplacementB = vec2.create();

  constructor(private readonly analysisService: AnalysisService) {}

  /** Returns the interpolated joint displacement for the given parameter. */
  getJointDisplacement(out: vec2, index: number, ctx: InterpolatorContext): vec2 {
    if (isNaN(ctx.tBridge)) {
      this.analysisService.getJointDisplacement(out, 0, index);
    } else {
      const left = this.analysisService.getJointDisplacement(this.tmpDisplacementA, ctx.leftLoadCase, index);
      const right = this.analysisService.getJointDisplacement(this.tmpDisplacementB, ctx.rightLoadCase, index);
      vec2.lerp(out, left, right, ctx.tPanel);
    }
    return out;
  }

  getJointDisplacementXForDeadLoadOnly(index: number): number {
    return this.analysisService.getJointDisplacementX(0, index);
  }

  getMemberForce(index: number, ctx: InterpolatorContext): number {
    if (isNaN(ctx.tBridge)) {
      return this.analysisService.getMemberForce(0, index);
    }
    const leftLoadCaseForce = this.analysisService.getMemberForce(ctx.leftLoadCase, index);
    const rightLoadCaseForce = this.analysisService.getMemberForce(ctx.rightLoadCase, index);
    return leftLoadCaseForce + ctx.tPanel * (rightLoadCaseForce - leftLoadCaseForce);
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
    readonly parametersService: SimulationParametersService,
    readonly terrainModelService: TerrainModelService,
  ) {}

  /** Creates an interpolator for the given analysis service, which defaults to the current analysis. */
  public createAnalysisInterpolator(): Interpolator {
    const sourceAdapter = new AnalysisInterpolationSourceAdapter(this.analysisService);
    return new AnalysisInterpolator(this, sourceAdapter);
  }

  public createDeadLoadingInterpolator(t: number): Interpolator {
    const sourceAdapter = new AnalysisInterpolationSourceAdapter(this.analysisService);
    const deadLoadingSource = new BiInterpolatorSource(
      InterpolationService.ZERO_FORCE_INTERPOLATION_SOURCE,
      sourceAdapter,
    );
    const interpolator = new AnalysisInterpolator(this, deadLoadingSource).withParameter(t);
    // Monkey patch the interpolator's parameter setter to operate on the bi-source.
    const interpolatorWithParameter = interpolator.withParameter.bind(interpolator);
    interpolator.withParameter = tSource => {
      deadLoadingSource.withParameter(tSource);
      interpolatorWithParameter(t); // Refresh interpolator internal state with new source value
      return interpolator;
    };
    return interpolator;
  }

  public createCollapseInterpolator(failedInterpolator: Interpolator): Interpolator {
    return new CollapseInterpolator(this, failedInterpolator);
  }
}
