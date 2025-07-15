import { Inject, Injectable } from '@angular/core';
import { InterpolationService, Interpolator } from './interpolation.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { vec2 } from 'gl-matrix';
import { COLLAPSE_ANALYSIS } from '../pane/constants';
import { SimulationParametersService } from './simulation-parameters.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';

const enum SimulationPhase {
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

  public readonly wayPoint = vec2.create();
  public readonly rotation = vec2.create();
  public loadAlpha = 1;

  private phase: SimulationPhase = SimulationPhase.UNSTARTED;
  private phaseStartClockMillis: number | undefined;
  private endParameter: number = 44;

  private readonly deadLoadingInterpolator: Interpolator;
  private readonly traversingInterpolator: Interpolator;
  // Initially undefined. Created when the test fails, after failure analysis is complete.
  private collapsingInterpolator: Interpolator | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    @Inject(COLLAPSE_ANALYSIS) private readonly collapseAnalysisService: AnalysisService,
    private readonly parameterService: SimulationParametersService,
    private readonly interpolationService: InterpolationService,
  ) {
    const tStart = SimulationStateService.START_PARAMETER;
    this.deadLoadingInterpolator = interpolationService.createDeadLoadingInterpolator(tStart);
    this.traversingInterpolator = interpolationService.createAnalysisInterpolator();
  }

  public get interpolator(): Interpolator {
    if (this.phase === SimulationPhase.DEAD_LOADING) {
      return this.deadLoadingInterpolator;
    }
    if (this.phase === SimulationPhase.COLLAPSING) {
      return this.collapsingInterpolator!;
    }
    return this.traversingInterpolator;
  }

  public start(): void {
    this.phaseStartClockMillis = undefined;
    this.phase = SimulationPhase.DEAD_LOADING;
    this.loadAlpha = 0;
    this.endParameter = this.bridgeService.designConditions.spanLength + SimulationStateService.END_PARAMETER_PAST_SPAN;
    this.deadLoadingInterpolator
      .withParameter(SimulationStateService.START_PARAMETER)
      .getLoadPosition(this.wayPoint, this.rotation);
    this.collapsingInterpolator = undefined;
  }

  /**
   * Advances the simulation state based on current clock value. State machine:
   *
   *                                                         ------------------<--time expiry------------------------------<--_
   *                                                        /                                                                  \
   *                                                       v                                                                   /
   * UNSTARTED --start--> DEAD_LOADING --time expiry--> FADING_IN --time expiry--> TRAVERSING --endpint reached--> FADING_OUT -
   *                             \                                                     \
   *                              -->---------------------------------------------------+-->-test fail--> COLLAPSING --
   *                                                                                                          ^         \
   *                                                                                                           \        /
   *                                                                                                            --------
   */
  public advance(clockMillis: number): void {
    if (this.phaseStartClockMillis === undefined) {
      this.phaseStartClockMillis = clockMillis;
    }
    switch (this.phase) {
      case SimulationPhase.DEAD_LOADING:
        const tDeadLoading =
          (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_DEAD_LOADING_MILLIS;
        if (tDeadLoading > 1) {
          this.phase = SimulationPhase.FADING_IN;
          this.phaseStartClockMillis = clockMillis;
          return this.advance(clockMillis);
        }
        this.deadLoadingInterpolator.withParameter(tDeadLoading);
        if (this.deadLoadingInterpolator.isTestFailed) {
          this.collapseAnalysisService.analyze({ degradeMembersMask: this.deadLoadingInterpolator.failedMemberMask });
          this.phase = SimulationPhase.COLLAPSING;
          return this.advance(clockMillis);
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
        {
          const remainingTraverseMillis =
            (this.endParameter - this.traversingInterpolator.parameter) * this.parameterService.elapsedMillisPerMeter;
          if (remainingTraverseMillis * SimulationStateService.INV_MATERIALIZING_MILLIS < 1) {
            this.phase = SimulationPhase.FADING_OUT;
            // Don't reset the clock.
            return this.advance(clockMillis);
          }
          this.advanceLoad(clockMillis);
          if (this.traversingInterpolator.isTestFailed) {
            this.collapseAnalysisService.analyze({ degradeMembersMask: this.traversingInterpolator.failedMemberMask });
            this.collapsingInterpolator = this.interpolationService.createCollapseInterpolator(
              this.traversingInterpolator,
            );
            this.phase = SimulationPhase.COLLAPSING;
            this.phaseStartClockMillis = clockMillis;
            return this.advance(clockMillis);
          }
        }
        break;
      case SimulationPhase.FADING_OUT:
        {
          const remainingTraverseMillis =
            (this.endParameter - this.traversingInterpolator.parameter) * this.parameterService.elapsedMillisPerMeter;
          if (remainingTraverseMillis < 0) {
            this.loadAlpha = 0;
            this.phaseStartClockMillis = clockMillis;
            this.phase = SimulationPhase.FADING_IN;
            return this.advance(clockMillis);
          }
          this.loadAlpha = remainingTraverseMillis * SimulationStateService.INV_MATERIALIZING_MILLIS;
          this.advanceLoad(clockMillis);
        }
        break;
      case SimulationPhase.COLLAPSING:
        const tRaw = (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_COLLAPSING_MILLIS;
        this.collapsingInterpolator?.withParameter(Math.min(1, tRaw)).getLoadPosition(this.wayPoint, this.rotation);
        break;
    }
  }

  private advanceLoad(clockMillis: number) {
    const speed = this.parameterService.speedMetersPerMilli;
    const t = SimulationStateService.START_PARAMETER + speed * (clockMillis - this.phaseStartClockMillis!);
    this.traversingInterpolator.withParameter(t).getLoadPosition(this.wayPoint, this.rotation);
  }
}
