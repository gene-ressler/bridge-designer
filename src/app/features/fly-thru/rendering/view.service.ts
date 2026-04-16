/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { BridgeService } from '../../../shared/services/bridge.service';
import { Utility } from '../../../shared/classes/utility';
import { TerrainModelService } from '../models/terrain-model.service';
import { SimulationPhase, SimulationStateService } from './simulation-state.service';
import { OverlayUi } from './overlay.service';
import { OverlayIcon } from './animation-controls-overlay.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { UNIT_LIGHT_DIRECTION } from './constants';
import { SiteConstants } from '../../../shared/classes/site-constants';
import { Rectangle2D } from '../../../shared/classes/graphics';
import { KeyboardService } from '../pane/keyboard.service';

/** Algorithms for determining eye and center positions. */
export const enum ViewMode {
  WALKING,
  DRIVING,
  ORBITING,
}

/** Height of driver's eye above road surface. */
const DRIVER_EYE_HEIGHT = 2.4;
/** Distance from front axle (reference point) forward to driver's eye. */
const DRIVER_EYE_LEAD = 0.6;
/** Max radians of look up-down angle. */
const MAX_TILT = 0.5 * Math.PI * 0.75;
/** Number of points in the orbiting eye path. */
const ORBIT_POINT_COUNT = 128;
/** Orbit speed in meters per second. */
const ORBIT_SPEED = 5;
/** How quickly orbit coord is incorporated as eye position. */
const EYE_ORBIT_BLEND_PER_SEC = 0.25;
/** Pixel to world linear travel rate ratio. */
const UI_RATE_LINEAR = 10.0 / 100.0;
/** Pixel to world rotation rate ratio. */
const UI_RATE_ROTATIONAL = (0.05 * 2.0 * Math.PI) / 100.0;
/** Pixel to world tilt rate ratio. */
const UI_RATE_TILT = Math.PI / 800.0;

/** Container for the fly-thru and driver view transforms and associated update logic. */
@Injectable({ providedIn: 'root' })
export class ViewService {
  /** Walking and orbiting view center point. */
  private readonly center: vec3 = vec3.create();
  /** Driving view center point. */
  private readonly centerDriver = vec3.create();
  /** Fixed center point of orbit view. */
  private readonly centerOrbit = vec3.create();
  /** Reset view center point for orbit interpolation. */
  private readonly centerOrbitStart = vec3.create();
  /** Rotation matrix up/down of the driver's head. */
  private readonly driverRotation = mat4.create();
  /** Walk and orbit view eye point. */
  private readonly eye: vec3 = vec3.create();
  /** Driver's eye position. */
  private readonly eyeDriver = vec3.create();
  /** Maximum point of walking eye point boundary. */
  private readonly eyeMax = vec3.create();
  /** Minimum point of walking eye point boundary. */
  private readonly eyeMin = vec3.create();
  /** Interpolated eye point on the orbit path. */
  private readonly eyeOrbit = vec3.create();
  /** Reset view eye point for interpolation. */
  private readonly eyeOrbitStart = vec3.create();
  /** Constant up vector for all views. */
  private readonly up = vec3.fromValues(0, 1, 0);
  /** Whether we're panning or, when false, walking forward. */
  private isMovingLaterally: boolean = false;
  /** Whether orbiting is still possible. Disabled by user navigation input. */
  private isOrbitAllowed: boolean = true;
  /** Container for bridge-specific orbit geometry. */
  private orbit: Orbit | undefined;
  /** Arc length parameter for the current orbit point. */
  private sOrbit: number = 0;
  /** Number of times truck has passed over bridge in simulation. */
  private truckPassCount: number = 0;
  /** Elevation angle of driver's head. */
  private phiDriverHead: number = 0;
  /** Elevation angle of walking eye. */
  private phiEye: number = 0;
  /** Rate at which walking elevation angle is changing. */
  private phiEyeRate: number = 0;
  /** Whether the settings are visible. */
  private showControls: boolean = false;
  /** Parameter in [0..1] for blending start and orbit eye positions. */
  private tBlend: number = 0;
  /** Horizontal rotation angle of the driver's head. */
  private thetaDriverHead: number = 0;
  /** Horizontal rotation of the walking view. */
  private thetaEye: number = 0;
  /** Rate at which the walking horizontal rotation is changing. */
  private thetaEyeRate: number = 0;
  /** Walking speed horizontally in direction given by theta. */
  private xzEyeVelocity: number = 0;
  /** Walking speed vertically in direction given by phi. */
  private yEyeVelocity: number = 0;
  /** Timer for starting orbit after bridge failure. */
  private orbitTimeout: any;

  /** Mode of the view. Intended as readonly. */
  public mode: ViewMode = ViewMode.WALKING;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly keyboardService: KeyboardService,
    private readonly simulationStateService: SimulationStateService,
    private readonly terrainService: TerrainModelService,
  ) {
    // Track whether the user has selected controls visible or not so the
    // overlay button knows which way to toggle.
    eventBrokerService.animationControlsToggle.subscribe(info => {
      this.showControls = info.data;
    });
    // Start the eye's orbit around the bridge either after
    // 2 passes of truck or a few seconds after failure.
    eventBrokerService.simulationPhaseChange.subscribe(info => {
      switch (info.data) {
        case SimulationPhase.FADING_IN:
          // Orbit starting after 2 passes,
          if (this.truckPassCount++ === 2) {
            this.startOrbit();
          }
          break;
        case SimulationPhase.COLLAPSING:
          this.orbitTimeout = setTimeout(() => this.startOrbit(), 5000);
          break;
      }
    });
    // Honor the convention that animation controls cancel orbits.
    eventBrokerService.simulationReplayRequest.subscribe(() => {
      this.cancelOrbits();
    });
  }

  /** Attaches handlers to the given overlay UI. */
  public provideUiHandlers(overlayUi: OverlayUi): void {
    // Install the animation controls handlers that vary the view via overlay icons.
    const handlerSets = overlayUi.iconHandlerSets;
    const walk = handlerSets[OverlayIcon.WALK];
    walk.handlePointerDown = () => {
      this.cancelOrbits();
      this.isMovingLaterally = false;
      this.mode = ViewMode.WALKING;
    };
    walk.handlePointerDrag = (dx: number, dy: number) => {
      this.xzEyeVelocity = dy * UI_RATE_LINEAR;
      this.thetaEyeRate = dx * UI_RATE_ROTATIONAL;
    };
    const pan = handlerSets[OverlayIcon.HAND];
    pan.handlePointerDown = () => {
      this.cancelOrbits();
      this.isMovingLaterally = true;
      this.mode = ViewMode.WALKING;
    };
    pan.handlePointerDrag = (dx: number, dy: number) => {
      this.xzEyeVelocity = dx * UI_RATE_LINEAR;
      this.yEyeVelocity = dy * UI_RATE_LINEAR;
    };
    const head = handlerSets[OverlayIcon.HEAD];
    head.handlePointerDown = () => {
      this.cancelOrbits();
      this.isMovingLaterally = false;
      this.mode = ViewMode.WALKING;
    };
    head.handlePointerDrag = (dx: number, dy: number) => {
      this.phiEyeRate = dy * UI_RATE_ROTATIONAL;
      this.thetaEyeRate = dx * UI_RATE_ROTATIONAL;
    };
    const home = handlerSets[OverlayIcon.HOME];
    home.handlePointerDown = () => {
      this.cancelOrbits();
      this.resetView();
    };
    const truck = handlerSets[OverlayIcon.TRUCK];
    truck.handlePointerDown = () => {
      this.cancelOrbits();
      this.mode = ViewMode.DRIVING;
    };
    truck.handlePointerDrag = (dx: number, dy: number) => {
      this.phiDriverHead = Utility.clamp(dy * UI_RATE_TILT, -Math.PI * 0.25, Math.PI * 0.1);
      this.thetaDriverHead = Utility.clamp(1.5 * dx * UI_RATE_TILT, -Math.PI * 0.3, Math.PI * 0.3);
    };
    const settings = handlerSets[OverlayIcon.SETTINGS];
    settings.handlePointerDown = () => {
      this.eventBrokerService.animationControlsToggle.next({ origin: EventOrigin.SERVICE, data: !this.showControls });
    };
  }

  /** Sets all view limits except for minimum y, which depends on terrain at the current eye location. */
  public initializeForBridge(): void {
    const conditions = this.bridgeService.designConditions;
    this.eyeMin[0] = -110.0;
    this.eyeMax[0] = 110 + conditions.spanLength;

    this.eyeMax[1] = conditions.overMargin + 25.0;
    this.eyeMin[2] = -110.0;
    this.eyeMax[2] = 110.0;

    this.truckPassCount = 0;
    this.isOrbitAllowed = true;
    this.resetView();
  }

  /** Advances view based on the number of seconds elapsed. */
  public advanceView(elapsedSecs: number) {
    if (this.mode === ViewMode.ORBITING && this.orbit) {
      this.sOrbit += elapsedSecs * ORBIT_SPEED;
      this.sOrbit = this.orbit.getForArcLength(this.eyeOrbit, this.sOrbit);
      // Cause eye to gradually catch up with orbit.
      if (this.tBlend < 1) {
        this.tBlend = Math.min(1, this.tBlend + elapsedSecs * EYE_ORBIT_BLEND_PER_SEC);
      }
      vec3.lerp(this.center, this.centerOrbitStart, this.centerOrbit, this.tBlend);
      vec3.lerp(this.eye, this.eyeOrbitStart, this.eyeOrbit, this.tBlend);
      return;
    }
    // Convert eye angles to vectors that are input for computing the lookAt matrix.
    this.phiEye = Utility.clamp(this.phiEye + this.phiEyeRate * elapsedSecs, -MAX_TILT, MAX_TILT);
    const dy = Math.sin(this.phiEye);
    const cosPhiEye = Math.cos(this.phiEye);
    this.thetaEye = Utility.normalizeAngle(this.thetaEye + this.thetaEyeRate * elapsedSecs);
    const dx = +cosPhiEye * Math.sin(this.thetaEye);
    const dz = -cosPhiEye * Math.cos(this.thetaEye);
    if (this.isMovingLaterally) {
      this.eye[0] -= dz * this.xzEyeVelocity * elapsedSecs;
      this.eye[2] += dx * this.xzEyeVelocity * elapsedSecs;
    } else {
      this.eye[0] += dx * this.xzEyeVelocity * elapsedSecs;
      this.eye[2] += dz * this.xzEyeVelocity * elapsedSecs;
    }
    this.eye[1] += this.yEyeVelocity * elapsedSecs;

    // Clamp to eye box boundaries unless in debug mode.
    if (!this.isIgnoringBoundaries) {
      this.eye[0] = Utility.clamp(this.eye[0], this.eyeMin[0], this.eyeMax[0]);
      this.eye[2] = Utility.clamp(this.eye[2], this.eyeMin[2], this.eyeMax[2]);
      this.eyeMin[1] = this.terrainService.getElevationAtXZ(this.eye[0], this.eye[2]) + 1.8;
      this.eye[1] = Utility.clamp(this.eye[1], this.eyeMin[1], this.eyeMax[1]);
    }
    this.center[0] = this.eye[0] + dx;
    this.center[1] = this.eye[1] + dy;
    this.center[2] = this.eye[2] + dz;
  }

  /** Returns the look-at matrix for the current view. */
  public getLookAtMatrix(m: mat4 = mat4.create()): mat4 {
    switch (this.mode) {
      case ViewMode.DRIVING:
        const truckPosition = this.simulationStateService.wayPoint;
        const driverLookDir = this.simulationStateService.rotation;
        mat4.fromXRotation(this.driverRotation, -this.phiDriverHead);
        mat4.rotateY(this.driverRotation, this.driverRotation, this.thetaDriverHead);
        const driverZ = this.bridgeService.centerlineZ;
        vec3.set(this.eyeDriver, truckPosition[0] + DRIVER_EYE_LEAD, truckPosition[1] + DRIVER_EYE_HEIGHT, driverZ);
        vec3.set(
          this.centerDriver,
          truckPosition[0] + driverLookDir[0],
          truckPosition[1] + driverLookDir[1] + DRIVER_EYE_HEIGHT,
          driverZ,
        );
        mat4.lookAt(m, this.eyeDriver, this.centerDriver, this.up);
        return mat4.multiply(m, this.driverRotation, m);
      default:
        return mat4.lookAt(m, this.eye, this.center, this.up);
    }
  }

  /** Gets look-at matrix for parallel light with constant y-axis up vector. */
  public getLightLookAtMatrix(m: mat4 = mat4.create()): mat4 {
    const ex = UNIT_LIGHT_DIRECTION[0];
    const ey = UNIT_LIGHT_DIRECTION[1];
    const ez = UNIT_LIGHT_DIRECTION[2];
    const d = Math.hypot(ex, ez);
    const id = 1 / d;
    // prettier-ignore
    return  mat4.set(m,
      ez * id ,  -ex * ey * id, ex, 0,
      0       ,  d            , ey, 0,
      -ex * id,  -ey * ez * id, ez, 0,
      0       ,  0            ,  0, 1,
    )
  }

  /** Inverts the eye angle to vector transformation and puts the eye at rest. */
  private setEyeAnglesFromVectors(): void {
    this.yEyeVelocity = this.xzEyeVelocity = this.thetaEyeRate = this.phiEyeRate = 0;
    const dx = this.center[0] - this.eye[0];
    const dy = this.center[1] - this.eye[1];
    const dz = this.center[2] - this.eye[2];
    const lengthDxDz = Math.hypot(dx, dz);
    this.thetaEye = Math.atan2(dx, -dz);
    this.phiEye = Math.atan2(dy, lengthDxDz);
  }

  /** Returns whether eye point boundaries are being enforced. True only for debugging. */
  private get isIgnoringBoundaries(): boolean {
    return this.keyboardService.debugState.isIgnoringViewBoundaries;
  }

  /** Gives a reasonable view of the whole current bridge. */
  private resetView(): void {
    this.mode = ViewMode.WALKING;
    this.setFullBridgeView(this.eye, this.center);
    this.setEyeAnglesFromVectors();
  }

  /** Sets eye and center points heuristically to a pleasant view of the whole bridge. */
  private setFullBridgeView(eye: vec3, center: vec3): void {
    const extent = this.extentOfInterest;
    const xCenter = extent.x0 + 0.5 * extent.width;
    // The vertical view angle is 45 degrees. So z setback to include vertical extent is h * 1/(2 tan 22.5deg).
    // Use window aspect as proxy for viewport because this needs to work before canvas is visible.
    const aspect = (window.innerHeight - 107) / window.innerWidth;
    // 1.5 is the factor above and bit more for padding.
    const zEye = 1.5 * Math.max(aspect * extent.width, extent.height) + SiteConstants.DECK_HALF_WIDTH;
    // Always put eye at height of a person on the road.
    vec3.set(eye, xCenter, 2, zEye);
    // Direct gaze at middle of vertical extent.
    vec3.set(center, xCenter, extent.y0 + 0.5 * extent.height, 0);
  }

  /** The x-y extent of the bridge with heuristic adjustments to show what we want. */
  private get extentOfInterest(): Rectangle2D {
    const extent = this.bridgeService.getWorldExtent();
    // Don't let the view cut off the top of the truck.
    const truckHeight = 3.3;
    if (extent.y1 < truckHeight) {
      extent.height += truckHeight - extent.y1;
    }
    return extent;
  }

  /** Cancels orbits for this animation. */
  private cancelOrbits(): void {
    this.isOrbitAllowed = false;
    clearTimeout(this.orbitTimeout);
    // Let the user begin walking from the final orbit point.
    if (this.mode === ViewMode.ORBITING) {
      this.setEyeAnglesFromVectors();
    }
    this.mode = ViewMode.WALKING;
  }

  /** Changes to orbit mode and starts the interpolation from default view to orbit point. */
  private startOrbit(): void {
    // Do nothing if orbit has already been cancelled.
    if (!this.isOrbitAllowed) {
      return;
    }
    this.resetView();
    this.mode = ViewMode.ORBITING;
    const extent = this.extentOfInterest;
    this.centerOrbit[0] = extent.x0 + 0.5 * extent.width; // middle of span
    this.centerOrbit[1] = 4; // fixed height above deck
    this.centerOrbit[2] = 0; // roadway centerline
    this.setFullBridgeView(this.eyeOrbitStart, this.centerOrbitStart);
    const a = extent.width; // major x-axis
    const b = this.eyeOrbitStart[2]; // minor z-axis
    this.orbit = new Orbit(this.center[0], 0, a, b, this.terrainService);
    this.sOrbit = this.tBlend = 0;
  }
}

/** An orbital path in 3d. Eye traversing this path has interesting views of the bridge. */
class Orbit {
  /** Orbit points with start duplicated at end. */
  private points = new Float64Array(3 * (1 + ORBIT_POINT_COUNT));
  private arcLengths = new Float64Array(1 + ORBIT_POINT_COUNT);

  constructor(x0: number, y0: number, a: number, b: number, terrain: TerrainModelService) {
    // Build elliptical path around bridge center, a fixed distance above ground level.
    const dTheta = (2 * Math.PI) / ORBIT_POINT_COUNT;
    let jLast = 0;
    const orbit = this.points;
    let runningArcLength = 0;
    for (let theta = 0.5 * Math.PI, i = 0, j = 0; i <= ORBIT_POINT_COUNT; theta += dTheta, ++i, j += 3) {
      const x = x0 + Math.cos(theta) * a;
      const z = y0 + Math.sin(theta) * b;
      // Consider terrain to left and right of path to avoid eye being occluded by river banks.
      const y =
        3 +
        Math.max(
          terrain.getElevationAtXZ(x, z),
          terrain.getElevationAtXZ(x - 8, z),
          terrain.getElevationAtXZ(x + 8, z),
        );
      orbit[j] = x;
      orbit[j + 1] = y;
      orbit[j + 2] = z;
      runningArcLength += Math.hypot(x - orbit[jLast], y - orbit[jLast + 1], z - orbit[jLast + 2]);
      this.arcLengths[i] = runningArcLength;
      jLast = j;
    }
  }

  /** Sets the interpolated point at given arc length along the path, and returns arc length normalized. */
  getForArcLength(r: vec3, s: number): number {
    const arcLength = this.arcLengths[ORBIT_POINT_COUNT];
    if (arcLength === 0) {
      return s;
    }
    while (s < 0) s += arcLength;
    while (s >= arcLength) s -= arcLength;
    // Binary search to find the indices of the segment containing s.
    let lo: number = 0;
    let hi: number = ORBIT_POINT_COUNT;
    while (lo < hi - 1) {
      const mid = (lo + hi) >>> 1;
      const sMid = this.arcLengths[mid];
      if (s < sMid) {
        hi = mid;
      } else if (s >= sMid) {
        lo = mid;
      }
    }
    if (lo !== hi - 1) {
      return s;
    }
    const s0 = this.arcLengths[lo];
    const s1 = this.arcLengths[hi];
    const t = (s - s0) / (s1 - s0);
    const tp = 1 - t;
    const i0 = 3 * lo;
    const p = this.points;
    r[0] = tp * p[i0] + t * p[i0 + 3];
    r[1] = tp * p[i0 + 1] + t * p[i0 + 4];
    r[2] = tp * p[i0 + 2] + t * p[i0 + 5];
    return s;
  }
}
