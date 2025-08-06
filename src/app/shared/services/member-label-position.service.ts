import { Injectable } from '@angular/core';
import { BridgeService } from './bridge.service';
import { Member } from '../classes/member.model';
import { step } from '../core/runge-kutta';
import { DesignConditions } from './design-conditions.service';

type MemberConfig = {
  member: Member;
  length: number;
  halfLength: number;
  lox: number;
  ux: number;
  uy: number;
};

@Injectable({ providedIn: 'root' })
export class MemberLabelPositionService {
  constructor(private readonly bridgeService: BridgeService) {}

  // Allocate worst case array space  one time for simplicity. Only a few kilobytes.
  private readonly xa = new Float64Array(2 * DesignConditions.MAX_MEMBER_COUNT);
  private readonly xb = new Float64Array(2 * DesignConditions.MAX_MEMBER_COUNT);
  private readonly xTmp = new Float64Array(2 * DesignConditions.MAX_MEMBER_COUNT);
  private readonly yTmp = new Float64Array(2 * DesignConditions.MAX_MEMBER_COUNT);
  private readonly configs: MemberConfig[] = Array.from(
    { length: DesignConditions.MAX_MEMBER_COUNT },
    () => ({}) as MemberConfig,
  );

  /** Returns label positions as distance from joint `a` of each member in a staticially allocated buffer. */
  public get labelPositions(): Float64Array {
    // Auxiliary physical config info about members and also state initialization.
    const members = this.bridgeService.bridge.members;
    members.forEach((member, index) => {
      const c = this.configs[index];
      c.member = member;
      c.ux = member.b.x - member.a.x;
      c.uy = member.b.y - member.a.y;
      c.length = Math.hypot(c.ux, c.uy);
      c.halfLength = c.length * 0.5;
      c.ux /= c.length;
      c.uy /= c.length;
      // Start each label at a small random fraction from member center with zero velocity.
      this.xa[index] = c.halfLength * (1 + 0.1 * (2 * Math.random() - 1));
      this.xa[index + members.length] = 0;
    });
    // Heuristic time step. Small is more stable. Large is faster.
    const h = 0.05;
    // Swappable references to buffers. xa was initialized, so must be the initial x.
    let x = this.xa;
    let xNew = this.xb;
    // The derivative-finder.
    const dFdT = (y: Float64Array, x: Float64Array) => this.findDerivatives(y, x, members.length);
    // Time integration. Normally terminates in a few 10's of iterations.
    for (let i = 0; i < 2000; ++i) {
      step(xNew, x, h, dFdT, 2 * members.length, this.xTmp, this.yTmp);
      this.constrain(xNew);
      [xNew, x] = [x, xNew];
      // Stop when velocities are small. Units are meters per 1/h steps.
      if (MemberLabelPositionService.isNearZero(x, members.length, 0.03)) {
        console.log('labels rk4 stopped:', i + 1);
        return x;
      }
    }
    // Oops. No convergence. Fall back to midpoint placement.
    const maxV = x.subarray(members.length).reduce((prev, cur) => Math.max(prev, Math.abs(cur)), 0);
    console.log('labels rk4 diverged; max V:', maxV);
    members.forEach((member, index) => (x[index] = 0.5 * member.length));
    return x;
  }

  /** Constrains labels to remain within the extents of their members. Simulates complete damping. */
  private constrain(x: Float64Array): void {
    const members = this.bridgeService.bridge.members;
    const n = members.length;
    for (let i = 0; i < n; ++i) {
      const position = x[i];
      const velocity = x[i + n];
      const length = this.configs[i].length;
      // Clamp position to ends and velocity toward midpoint.
      if (position > length) {
        x[i] = length;
        if (velocity > 0) {
          x[i + n] = 0;
        }
      } else if (position < 0) {
        x[i] = 0;
        if (velocity < 0) {
          x[i + n] = 0;
        }
      }
    }
  }

  /** Returns true iff the given array has a max norm within given tolerance of zero. */
  private static isNearZero(x: Float64Array, start: number, tolerance: number, end: number = x.length): boolean {
    for (let i = start; i < end; ++i) {
      if (Math.abs(x[i]) > tolerance) {
        return false;
      }
    }
    return true;
  }

  /** Finds the system derivatives for the given state. The state vector format: `[positions x | velocities v]`. */
  private findDerivatives(y: Float64Array, x: Float64Array, n: number): void {
    const drag = 10; // spring damping
    const ka = 8; // attraction to member centers
    const kr = 4; // repulsion between pairs of labels
    const km = 0.75; // repulsion between  labels and members
    // Position derivatives are just the velocities.
    for (let ix = 0, iv = ix + n; ix < n; ++ix, ++iv) {
      y[ix] = x[iv];
    }
    for (let i = 0, iv = i + n; i < n; ++i, ++iv) {
      const mi = this.configs[i]; // member i config
      const mit = x[i]; // member i label parameter
      const v = x[iv]; // member i label velocity
      y[iv] = ka * (mi.halfLength - mit) - drag * v; // centering springs and lineear drag
    }
    // TODO: All pairs may be overkill. Try precomputing those with overlapping bb's. Stability?
    for (let i = 0, iv = i + n; i < n - 1; ++i, ++iv) {
      const mi = this.configs[i]; // member i config
      const mit = x[i]; // member i label parameter
      const lix = mi.member.a.x + mit * mi.ux; // member i label position
      const liy = mi.member.a.y + mit * mi.uy;
      for (let j = i + 1, jv = j + n; j < n; ++j, ++jv) {
        const mj = this.configs[j]; // member j config
        const mjt = x[j]; // member j label parameter
        const ljx = mj.member.a.x + mjt * mj.ux; // member j label position
        const ljy = mj.member.a.y + mjt * mj.uy; 
        const ldx = ljx - lix; // inter-label difference vector
        const ldy = ljy - liy;
        const force = -kr / (ldx * ldx + ldy * ldy); // inter-label force (inverse square)
        let ufx = ljx - lix; // unit inter-label vector 
        let ufy = ljy - liy;
        const fLength = Math.hypot(ufx, ufy);
        ufx /= fLength;
        ufy /= fLength;
        y[iv] += force * (ufx * mi.ux + ufy * mi.uy); // force projected onto resp. member axes
        y[jv] -= force * (ufx * mj.ux + ufy * mj.uy);
        y[iv] += labelMemberForce(lix, liy, mj, mi); // label-to-member repulsion
        y[jv] += labelMemberForce(ljx, ljy, mi, mj);
      }
    }
    /**
     * Returns the force between a label and other member. Projects label position onto other axis. If within
     * the member's extent, finds other member radial vector to label. Radial vector length gives inverse
     * square proportional force magnitude, which is scaled by projecting back onto label member axis.
     */
    function labelMemberForce(lx: number, ly: number, oc: MemberConfig, lc: MemberConfig): number {
      const t = (oc.ux * (lx - oc.member.a.x) + oc.uy * (ly - oc.member.a.y)) / (oc.ux * oc.ux + oc.uy * oc.uy);
      if (t < 0 || t > oc.length) {
        return 0;
      }
      const px = lx - (oc.member.a.x + t * oc.ux);
      const py = ly - (oc.member.a.y + t * oc.uy);
      // Clamp to prevent extremely large forces. when label lies on or very near other member.
      return Math.min(km / (px * px + py * py), 1000) * (px * lc.ux + py * lc.uy);
    }
  }
}
