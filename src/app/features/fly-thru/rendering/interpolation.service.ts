import { Injectable } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';
import { CenterlinePost, TerrainModelService } from '../models/terrain-model.service';
import { vec2 } from 'gl-matrix';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { Geometry } from '../../../shared/classes/graphics';
import { InterpolationSource } from '../../../shared/services/analysis.service';
import { SimulationParametersService } from './simulation-parameters.service';
import { SiteConstants } from '../../../shared/classes/site.model';

/** Internal holder for calculations common to several interpolator methods. */
type InterpolatorContext = {
  t: number;
  tBridge: number;
  tPanel: number;
  leftLoadCase: number;
  rightLoadCase: number;
};

/** Wrapper for interpolation logic that refers to a given bound joint displacement source. */
export class Interpolator {
  // Result buffers.
  private readonly post: CenterlinePost = { elevation: 0, xNormal: 0, yNormal: 1 };
  private readonly tmpJointA = vec2.create();
  private readonly tmpJointB = vec2.create();
  private readonly tmpDisplacementA = vec2.create();
  private readonly tmpDisplacementB = vec2.create();
  private readonly tmpDiff = vec2.create();
  private readonly tmpContext: InterpolatorContext = {} as InterpolatorContext;

  private readonly ctx: InterpolatorContext = {} as InterpolatorContext;

  constructor(
    private readonly service: InterpolationService,
    private readonly interpolationSource: InterpolationSource,
  ) {}

  public withParameter(t: number): Interpolator {
    return this.getContext(this.ctx, t);
  }

  public refreshContext(t: number): Interpolator {
    return this.getContext(this.ctx, t);
  }

  public get parameter(): number {
    return this.ctx.t;
  }

  public getWayPoint(out: vec2, ctx: InterpolatorContext = this.ctx): vec2 {
    if (isNaN(ctx.tBridge)) {
      out[0] = ctx.t;
      out[1] = this.service.terrainModelService.getRoadCenterlinePostAtX(this.post, ctx.t).elevation;
    } else {
      this.getDisplacedJointLocation(this.tmpJointA, ctx.leftLoadCase, ctx);
      this.getDisplacedJointLocation(this.tmpJointB, ctx.leftLoadCase + 1, ctx);
      // TODO: Use vec2.lerp.
      intepolateVec2(out, this.tmpJointA, this.tmpJointB, ctx.tPanel);
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
  public getLoadPosition(frontOut: vec2, rotation: vec2): void {
    this.getWayPoint(frontOut);
    // Find a point one truck-length behind the load location by binary search.
    const truckLength = DesignConditions.PANEL_SIZE_WORLD;
    let t0 = this.ctx.t - truckLength;
    // Use rotation vector as a buffer for the rear point.
    const rear = rotation;
    // Move t0 left until the bracket must include the rear wheel. Normally a single iteration.
    do {
      t0 -= truckLength;
      this.getContext(this.tmpContext, t0);
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
      this.getContext(this.tmpContext, t);
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
    vec2.sub(rotation, frontOut, rear);
    vec2.normalize(rotation, rotation);
  }

  /**
   *  Returns the interpolated displaced joint location for given joint index and, by default, the current parameter.
   * An alternate context is optional.
   */
  public getDisplacedJointLocation(pt: vec2, index: number, ctx: InterpolatorContext = this.ctx): vec2 {
    this.getJointDisplacement(pt, index, ctx);
    const joint = this.service.bridgeService.bridge.joints[index];
    pt[0] += joint.x;
    pt[1] += joint.y;
    return pt;
  }

  /** Returns the interpolated displaced joint location for the current parameter. */
  public getAllDisplacedJointLocations(
    out: Float32Array,
    ctx: InterpolatorContext = this.ctx,
  ): Float32Array {
    const joints = this.service.bridgeService.bridge.joints;
    let i2 = 0;
    for (const joint of joints) {
      const v = this.getJointDisplacement(this.tmpJointA, joint.index, ctx);
      out[i2] = v[0] + joint.x;
      out[i2 + 1] = v[1] + joint.y;
      i2 += 2;
    }
    return out;
  }

  /** Returns the interpolated joint displacement for the given parameter. */
  private getJointDisplacement(v: vec2, index: number, ctx: InterpolatorContext = this.ctx): vec2 {
    if (isNaN(ctx.tBridge)) {
      this.interpolationSource.getJointDisplacement(v, 0, index);
    } else {
      const left = this.interpolationSource.getJointDisplacement(this.tmpDisplacementA, ctx.leftLoadCase, index);
      const right = this.interpolationSource.getJointDisplacement(this.tmpDisplacementB, ctx.rightLoadCase, index);
      intepolateVec2(v, left, right, ctx.tPanel);
    }
    return vec2.scale(v, v, this.service.parametersService.exaggeration);
  }

  public getMemberForce(index: number): number {
    const ctx = this.ctx;
    if (isNaN(ctx.tBridge)) {
      return this.interpolationSource.getMemberForce(0, index);
    }
    const leftLoadCaseForce = this.interpolationSource.getMemberForce(ctx.leftLoadCase, index);
    const rightLoadCaseForce = this.interpolationSource.getMemberForce(ctx.rightLoadCase, index);
    return leftLoadCaseForce + ctx.tPanel * (rightLoadCaseForce - leftLoadCaseForce);
  }

  /** Fills a wrapper for calculations common to several methods. */
  getContext(ctx: InterpolatorContext, t: number): Interpolator {
    const leftmostJointX = this.getDisplacedJointXForDeadLoadOnly(0);
    const panelIndexMax = this.service.bridgeService.designConditions.loadedJointCount - 1;
    const rightmostJointX = this.getDisplacedJointXForDeadLoadOnly(panelIndexMax);
    const tBridge =
      leftmostJointX <= t && t < rightmostJointX
        ? ((t - leftmostJointX) / (rightmostJointX - leftmostJointX)) * panelIndexMax
        : NaN;
    const leftLoadCase = Math.trunc(tBridge);
    const tPanel = tBridge - leftLoadCase;
    let rightLoadCase = leftLoadCase + 1;
    if (rightLoadCase >= this.service.bridgeService.designConditions.loadedJointCount) {
      rightLoadCase = 0; // Off deck to the right: dead load only.
    }
    ctx.t = t;
    ctx.tBridge = tBridge;
    ctx.tPanel = tPanel;
    ctx.leftLoadCase = leftLoadCase;
    ctx.rightLoadCase = rightLoadCase;
    return this;
  }

  /** Gets a displaced joint's x-coordinate for the dead load only case. */
  private getDisplacedJointXForDeadLoadOnly(index: number): number {
    const joint = this.service.bridgeService.bridge.joints[index];
    const exaggeration = this.service.parametersService.exaggeration;
    return joint.x + this.interpolationSource.getJointDisplacementX(0, index) * exaggeration;
  }
}

/** An interpolation source that interpolates two others. */
export class BiInterpolationSource implements InterpolationSource {
  private t: number = 0;
  private readonly tmpVecA = vec2.create();
  private readonly tmpVecB = vec2.create();

  constructor(
    private readonly sourceA: InterpolationSource,
    private readonly sourceB: InterpolationSource,
  ) {}

  public withParameter(t: number): BiInterpolationSource {
    this.t = t;
    return this;
  }

  getJointDisplacement(out: vec2, loadCase: number, jointIndex: number): vec2 {
    const a = this.sourceA.getJointDisplacement(this.tmpVecA, loadCase, jointIndex);
    const b = this.sourceB.getJointDisplacement(this.tmpVecB, loadCase, jointIndex);
    return intepolateVec2(out, a, b, this.t);
  }

  getJointDisplacementX(loadCase: number, jointIndex: number): number {
    const a = this.sourceA.getJointDisplacementX(loadCase, jointIndex);
    const b = this.sourceB.getJointDisplacementX(loadCase, jointIndex);
    return a + (b - a) * this.t;
  }
  getJointDisplacementY(loadCase: number, jointIndex: number): number {
    const a = this.sourceA.getJointDisplacementY(loadCase, jointIndex);
    const b = this.sourceB.getJointDisplacementY(loadCase, jointIndex);
    return a + (b - a) * this.t;
  }

  getMemberForce(loadCase: number, memberIndex: number): number {
    const a = this.sourceA.getMemberForce(loadCase, memberIndex);
    const b = this.sourceB.getMemberForce(loadCase, memberIndex);
    return a + (b - a) * this.t;
  }
}

@Injectable({ providedIn: 'root' })
export class InterpolationService {
  public static readonly ZERO_FORCE_JOINT_DISPLACEMENT_SOURCE: InterpolationSource = {
    getJointDisplacement: (out: vec2, _loadCase: number, _jointIndex: number): vec2 => {
      out[0] = out[1] = 0;
      return out;
    },
    getJointDisplacementX: (_loadCase: number, _jointIndex: number): number => {
      return 0;
    },
    getJointDisplacementY: (_loadCase: number, _jointIndex: number): number => {
      return 0;
    },
    getMemberForce: (_loadCase: number, _memberIndex: number): number => {
      return 0;
    },
  };

  constructor(
    readonly bridgeService: BridgeService,
    readonly parametersService: SimulationParametersService,
    readonly terrainModelService: TerrainModelService,
  ) {}

  /** Creates an interpolator for the given joint displacement source. Sources are e.g. analyses (normal or failure) or the zero force case. */
  public createInterpolator(source: InterpolationSource) {
    return new Interpolator(this, source);
  }

  /**
   * Returns a new bi-interpolator of two given sources, both at the given parameter value. The returned interpolator's
   * parameter setter affects source weighting only, not the load position.
   */
  public createBiInterpolator(sourceA: InterpolationSource, sourceB: InterpolationSource, t: number): Interpolator {
    const biSource = new BiInterpolationSource(sourceA, sourceB);
    const interpolator = this.createInterpolator(biSource);
    // Monkey patch the interpolator's parameter setter to operate on the bi-source.
    interpolator.withParameter = tSource => {
      biSource.withParameter(tSource);
      // Lazily set or restore the context. Bridge deck limits were probably affected by underlying source change.
      return interpolator.refreshContext(t);
    };
    return interpolator;
  }
}

function intepolateVec2(v: vec2, a: vec2, b: vec2, t: number): vec2 {
  // TODO: r = a * t + b * (1 - t) would be a bit more stable, but a bit slower.
  v[0] = a[0] + t * (b[0] - a[0]);
  v[1] = a[1] + t * (b[1] - a[1]);
  return v;
}
