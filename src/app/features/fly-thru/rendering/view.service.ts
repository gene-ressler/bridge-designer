/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { BridgeService } from '../../../shared/services/bridge.service';
import { Utility } from '../../../shared/classes/utility';
import { TerrainModelService } from '../models/terrain-model.service';
import { SimulationStateService } from './simulation-state.service';
import { OverlayUi } from './overlay.service';
import { OverlayIcon } from './animation-controls-overlay.service';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { UNIT_LIGHT_DIRECTION } from './constants';
import { SiteConstants } from '../../../shared/classes/site-constants';

/** Container for the fly-thru and driver view transforms and associated update logic. */
@Injectable({ providedIn: 'root' })
export class ViewService {
  /** Max radians of look up-down angle. */
  private static readonly MAX_TILT = 0.5 * Math.PI * 0.75;
  /** Height of driver's eye above road surface. */
  private static readonly DRIVER_EYE_HEIGHT = 2.4;
  /** Distance from front axel (reference point) forward to driver's eye. */
  private static readonly DRIVER_EYE_LEAD = 0.6;
  /** Pixel to world linear travel rate ratio. */
  private static readonly UI_RATE_LINEAR = 10.0 / 100.0;
  /** Pixel to world rotation rate ratio. */
  private static readonly UI_RATE_ROTATIONAL = (0.05 * 2.0 * Math.PI) / 100.0;
  /** Pixel to world tilt rate ratio. */
  private static readonly UI_RATE_TILT = Math.PI / 800.0;

  public readonly eye = vec3.create();
  private readonly up = vec3.fromValues(0, 1, 0);
  private readonly center = vec3.create();
  private readonly eyeMin = vec3.create();
  private readonly eyeMax = vec3.create();
  private readonly eyeDriver = vec3.create();
  private readonly centerDriver = vec3.create();
  private readonly driverRotation = mat4.create();

  private thetaEye: number = 0;
  private phiEye: number = 0;
  private thetaEyeRate: number = 0;
  private phiEyeRate: number = 0;
  private xzEyeVelocity: number = 0;
  private yEyeVelocity: number = 0;
  private phiDriverHead: number = 0;
  private thetaDriverHead: number = 0;
  private showControls: boolean = false;
  public isIgnoringBoundaries: boolean = false;
  public isMovingLaterally: boolean = false;
  public isDriving: boolean = false;

  constructor(
    private readonly bridgeService: BridgeService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly simulationStateService: SimulationStateService,
    private readonly terrainService: TerrainModelService,
  ) {
    eventBrokerService.animationControlsToggle.subscribe(info => {
      this.showControls = info.data;
    });
  }

  public provideUiHandlers(overlayUi: OverlayUi): void {
    // Install the animation controls handlers that vary the view via overlay icons.
    const handlerSets = overlayUi.iconHandlerSets;
    const walk = handlerSets[OverlayIcon.WALK];
    walk.handlePointerDown = () => {
      this.isMovingLaterally = false;
      this.isDriving = false;
    };
    walk.handlePointerDrag = (dx: number, dy: number) => {
      this.xzEyeVelocity = dy * ViewService.UI_RATE_LINEAR;
      this.thetaEyeRate = dx * ViewService.UI_RATE_ROTATIONAL;
    };

    const pan = handlerSets[OverlayIcon.HAND];
    pan.handlePointerDown = () => {
      this.isMovingLaterally = true;
      this.isDriving = false;
    };
    pan.handlePointerDrag = (dx: number, dy: number) => {
      this.xzEyeVelocity = dx * ViewService.UI_RATE_LINEAR;
      this.yEyeVelocity = dy * ViewService.UI_RATE_LINEAR;
    };
    const head = handlerSets[OverlayIcon.HEAD];
    head.handlePointerDown = () => {
      this.isMovingLaterally = false;
      this.isDriving = false;
    };
    head.handlePointerDrag = (dx: number, dy: number) => {
      this.phiEyeRate = dy * ViewService.UI_RATE_ROTATIONAL;
      this.thetaEyeRate = dx * ViewService.UI_RATE_ROTATIONAL;
    };
    const home = handlerSets[OverlayIcon.HOME];
    home.handlePointerDown = () => {
      this.isDriving = false;
      this.resetView();
    };
    const truck = handlerSets[OverlayIcon.TRUCK];
    truck.handlePointerDown = () => {
      this.isDriving = true;
    };
    truck.handlePointerDrag = (dx: number, dy: number) => {
      this.phiDriverHead = Utility.clamp(dy * ViewService.UI_RATE_TILT, -Math.PI * 0.25, Math.PI * 0.1);
      this.thetaDriverHead = Utility.clamp(1.5 * dx * ViewService.UI_RATE_TILT, -Math.PI * 0.3, Math.PI * 0.3);
    };
    const settings = handlerSets[OverlayIcon.SETTINGS];
    settings.handlePointerDown = () => {
      this.eventBrokerService.animationControlsToggle.next({ origin: EventOrigin.SERVICE, data: !this.showControls });
    };
  }

  /** Apply a heuristic to set a reasonable view of the current bridge. */
  public resetView(): void {
    const extent = this.bridgeService.getWorldExtent();
    // Don't let the view cut off the top of the truck.
    const truckHeight = 3.3;
    if (extent.y1 < truckHeight) {
      extent.height += truckHeight - extent.y1;
    }

    const xCenter = extent.x0 + 0.5 * extent.width;

    // The vertical view angle is 45 degrees. So z setback to include vertical extent is h * 1/(2 tan 22.5deg).
    // Use window aspect as proxy for viewport because this needs to work before canvas is visible.
    const aspect = (window.innerHeight - 107) / window.innerWidth;
    // 1.5 is the factor above and bit more for padding.
    const zEye = 1.5 * Math.max(aspect * extent.width, extent.height) + SiteConstants.DECK_HALF_WIDTH;

    // Always put eye at height of a person on the road.
    // Swivel eye right a bit to account for slant of river.
    vec3.set(this.eye, xCenter, 2, zEye);

    // Direct gaze at middle of vertical extent.
    vec3.set(this.center, xCenter, extent.y0 + 0.5 * extent.height, 0);
    // Follow river's path with eye.
    this.eye[0] += this.eye[2] * 0.1;
    this.yEyeVelocity = 0;

    // The angles are actually the independent values, so compute them here.
    this.thetaEye = Math.atan2(this.center[0] - this.eye[0], this.eye[2] - this.center[2]);
    this.thetaEyeRate = 0;
    this.phiEye = Math.atan2(this.center[1] - this.eye[1], this.eye[2] - this.center[2]);
    this.phiEyeRate = 0;
  }

  /** Set all view limits except for minimum y, which depends on terrain at the current eye location. */
  public setFixedViewLimits(): void {
    const conditions = this.bridgeService.designConditions;
    this.eyeMin[0] = -100.0;
    this.eyeMax[0] = 100 + conditions.spanLength;

    this.eyeMax[1] = conditions.overMargin + 25.0;
    this.eyeMin[2] = -100.0;
    this.eyeMax[2] = 100.0;
  }

  public updateWalkingView(elapsedSecs: number) {
    this.phiEye = Utility.clamp(
      this.phiEye + this.phiEyeRate * elapsedSecs,
      -ViewService.MAX_TILT,
      ViewService.MAX_TILT,
    );
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

  public getLookAtMatrix(m: mat4 = mat4.create()): mat4 {
    if (this.isDriving) {
      const truckPosition = this.simulationStateService.wayPoint;
      const driverLookDir = this.simulationStateService.rotation;
      mat4.fromXRotation(this.driverRotation, -this.phiDriverHead);
      mat4.rotateY(this.driverRotation, this.driverRotation, this.thetaDriverHead);
      vec3.set(
        this.eyeDriver,
        truckPosition[0] + ViewService.DRIVER_EYE_LEAD,
        truckPosition[1] + ViewService.DRIVER_EYE_HEIGHT,
        0,
      );
      vec3.set(
        this.centerDriver,
        truckPosition[0] + driverLookDir[0],
        truckPosition[1] + driverLookDir[1] + ViewService.DRIVER_EYE_HEIGHT,
        0,
      );
      mat4.lookAt(m, this.eyeDriver, this.centerDriver, this.up);
      return mat4.multiply(m, this.driverRotation, m);
    }
    return mat4.lookAt(m, this.eye, this.center, this.up);
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
}
