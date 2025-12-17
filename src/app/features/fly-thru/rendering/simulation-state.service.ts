/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Inject, Injectable } from '@angular/core';
import { InterpolationService, Interpolator } from './interpolation.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { vec2 } from 'gl-matrix';
import { COLLAPSE_ANALYSIS } from '../pane/constants';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';
import { Utility } from '../../../shared/classes/utility';
import { EventBrokerService, EventOrigin } from '../../../shared/services/event-broker.service';
import { FlyThruSettingsService } from './fly-thru-settings.service';

export const enum SimulationPhase {
  UNSTARTED,
  DEAD_LOADING,
  FADING_IN,
  TRAVERSING,
  FADING_OUT,
  COLLAPSING,
}

/** Container for the state machine that drivews the load simulation. */
@Injectable({ providedIn: 'root' })
export class SimulationStateService {
  /** Load progress parameter starting value. Roughly 16 meters left of the deck. */
  private static readonly START_PARAMETER = -16;
  private static readonly END_PARAMETER_PAST_SPAN =
    DesignConditions.PANEL_SIZE_WORLD - SimulationStateService.START_PARAMETER;

  /** Inverse duration of the dead loading phase. */
  private static readonly INV_DEAD_LOADING_MILLIS = 1 / 1200;
  /** Inverse duration of the materializing and dematerializing phases. */
  private static readonly INV_MATERIALIZING_MILLIS = 1 / 1200;
  /** Inverse duration of the collapse phase. */
  private static readonly INV_COLLAPSING_MILLIS = 1 / 1000;

  /** Load location along the traveled way. Contact point of front tire. */
  public readonly wayPoint = vec2.create();
  /** Load rotation vector to place rear wheels on traveled way when front wheels are. Not unit. */
  public readonly rotation = vec2.create();
  /** Opaqueness varied while fading in and out. */
  public loadAlpha = 1;
  /** Time since the current phase started. Useful for sub-animations. */
  public phaseClockMillis: number = 0;
  /** Simulation clock the last time the load was advanced. */
  public lastLoadAdvanceMillis: number | undefined;

  private phase: SimulationPhase = SimulationPhase.UNSTARTED;
  private phaseStartClockMillis: number | undefined;
  private endParameter: number = 44;

  private deadLoadingInterpolator!: Interpolator;
  private traversingInterpolator!: Interpolator;
  // Undefined until created after the test has failed, and failure analysis is completes.
  private collapsingInterpolator: Interpolator | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    @Inject(COLLAPSE_ANALYSIS) private readonly collapseAnalysisService: AnalysisService,
    private readonly eventBrokerService: EventBrokerService,
    private readonly settingsService: FlyThruSettingsService,
    private readonly interpolationService: InterpolationService,
  ) {
    eventBrokerService.simulationReplayRequest.subscribe(() => this.start());
  }

  /** Starts or restarts the state machine. */
  public start(): void {
    if (!this.deadLoadingInterpolator) {
      const tStart = SimulationStateService.START_PARAMETER;
      this.deadLoadingInterpolator = this.interpolationService.createDeadLoadingInterpolator(tStart);
    }
    if (!this.traversingInterpolator) {
      this.traversingInterpolator = this.interpolationService.createAnalysisInterpolator();
    }
    this.phaseStartClockMillis = undefined;
    this.phase = SimulationPhase.DEAD_LOADING;
    this.loadAlpha = 0;
    this.endParameter = this.bridgeService.designConditions.spanLength + SimulationStateService.END_PARAMETER_PAST_SPAN;
    this.deadLoadingInterpolator.setParameter(0).getLoadPosition(this.wayPoint, this.rotation);
    this.collapsingInterpolator = undefined;
    this.notifyPhaseChange();
  }

  /**
   * Advances the simulation state based on current clock value and sends a notification if phase has changed. State machine:
   * ```text
   *                                                ------------------<--time expiry------------------------------<---
   *                                               /                                                                   \
   *                                              v                                                                    /
   *  --start--> DEAD_LOADING --time expiry--> FADING_IN --time expiry--> TRAVERSING ----end reached---> FADING_OUT --
   *              ^     \                          /                        /  \                                 /
   *              |      -->-test fail------------/------------------------/----o-->-test fail--> COLLAPSING    /
   *               \                             /                        /                        /           /
   *                -----<--start---------------o--------<--start--------o-------<--start---------o--<--start--
   * ```
   */
  public advance(clockMillis: number): void {
    const phaseBeforeAdvance = this.phase;
    this.doAdvance(clockMillis);
    if (this.phase !== phaseBeforeAdvance) {
      this.notifyPhaseChange();
    }
  }

  /** Returns the current interpolator or undefined if the state machine is not yet started. */
  public get interpolator(): Interpolator {
    if (this.phase === SimulationPhase.DEAD_LOADING) {
      return this.deadLoadingInterpolator;
    }
    if (this.phase === SimulationPhase.COLLAPSING) {
      return Utility.assertNotUndefined(this.collapsingInterpolator, 'collapsing interpolator');
    }
    return this.traversingInterpolator;
  }

  /** See public `advance` method. Does all except send the notification. */
  private doAdvance(clockMillis: number): void {
    // Lazily initialize the phase clock first time around.
    if (this.phaseStartClockMillis === undefined) {
      this.phaseStartClockMillis = clockMillis;
    }
    this.phaseClockMillis = clockMillis - this.phaseStartClockMillis;
    // Advance to the collapsing phase after setting up the collapse analysis.
    const startCollapsing = (failedInterpolator: Interpolator): void => {
      this.collapseAnalysisService.analyze({ degradeMembersMask: failedInterpolator.failedMemberKinds });
      this.collapsingInterpolator = this.interpolationService.createCollapseInterpolator(failedInterpolator);
      this.phase = SimulationPhase.COLLAPSING;
      this.phaseStartClockMillis = clockMillis;
      this.advance(clockMillis);
    };
    switch (this.phase) {
      case SimulationPhase.DEAD_LOADING:
        const tDeadLoading =
          (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_DEAD_LOADING_MILLIS;
        if (tDeadLoading > 1) {
          this.phase = SimulationPhase.FADING_IN;
          this.phaseStartClockMillis = clockMillis;
          this.lastLoadAdvanceMillis = undefined;
          return this.advance(clockMillis);
        }
        this.deadLoadingInterpolator.setParameter(tDeadLoading);
        if (this.deadLoadingInterpolator.failedMemberCount > 0) {
          startCollapsing(this.deadLoadingInterpolator);
          return;
        }
        break;
      case SimulationPhase.FADING_IN:
        const loadAlpha = (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_MATERIALIZING_MILLIS;
        if (loadAlpha > 1) {
          this.loadAlpha = 1;
          this.phase = SimulationPhase.TRAVERSING;
          // Don't reset the clock.
          return this.advance(clockMillis);
        }
        this.loadAlpha = loadAlpha;
        this.advanceLoad(clockMillis);
        break;
      case SimulationPhase.TRAVERSING:
        const remainingTraverseMillis =
          (this.endParameter - this.traversingInterpolator.parameter) * this.settingsService.elapsedMillisPerMeter;
        if (remainingTraverseMillis * SimulationStateService.INV_MATERIALIZING_MILLIS < 1) {
          this.phase = SimulationPhase.FADING_OUT;
          // Don't reset the clock.
          return this.advance(clockMillis);
        }
        this.advanceLoad(clockMillis);
        if (this.traversingInterpolator.failedMemberCount > 0) {
          startCollapsing(this.traversingInterpolator);
          return;
        }
        break;
      case SimulationPhase.FADING_OUT:
        const remainingFadeOutMillis =
          (this.endParameter - this.traversingInterpolator.parameter) * this.settingsService.elapsedMillisPerMeter;
        if (remainingFadeOutMillis < 0) {
          this.phaseStartClockMillis = clockMillis;
          this.lastLoadAdvanceMillis = undefined;
          this.phase = SimulationPhase.FADING_IN;
          return this.advance(clockMillis);
        }
        this.loadAlpha = remainingFadeOutMillis * SimulationStateService.INV_MATERIALIZING_MILLIS;
        this.advanceLoad(clockMillis);
        break;
      case SimulationPhase.COLLAPSING:
        const tRaw = (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_COLLAPSING_MILLIS;
        this.collapsingInterpolator!.setParameter(Math.min(1, tRaw)).getLoadPosition(this.wayPoint, this.rotation);
        break;
    }
  }

  private advanceLoad(clockMillis: number) {
    // Advance absolutely the first time, then relatively so user speed changes look smooth.
    const t =
      this.lastLoadAdvanceMillis === undefined
        ? SimulationStateService.START_PARAMETER
        : this.traversingInterpolator.parameter +
          this.settingsService.speedMetersPerMilli * (clockMillis - this.lastLoadAdvanceMillis);
    this.lastLoadAdvanceMillis = clockMillis;
    this.traversingInterpolator.setParameter(t).getLoadPosition(this.wayPoint, this.rotation);
  }

  private notifyPhaseChange() {
    this.eventBrokerService.simulationPhaseChange.next({ origin: EventOrigin.SERVICE, data: this.phase });
  }
}
