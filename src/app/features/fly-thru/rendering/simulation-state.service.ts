import { Inject, Injectable } from '@angular/core';
import { InterpolationService, Interpolator } from './interpolation.service';
import { AnalysisService } from '../../../shared/services/analysis.service';
import { vec2 } from 'gl-matrix';
import { FAILED_BRIDGE_ANALYSIS } from '../pane/constants';
import { SimulationParametersService } from './simulation-parameters.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DesignConditions } from '../../../shared/services/design-conditions.service';

const enum SimulationPhase {
  UNSTARTED,
  DEAD_LOADING,
  FADING_IN,
  TRAVERSING,
  FADING_OUT,
  FAILING,
}

/** Container for state of the load simulation. */
@Injectable({ providedIn: 'root' })
export class SimulationStateService {
  /** Load progress parameter starting value. Roughly 16 meters left of the deck. */
  private static readonly START_PARAMETER = -16;
  private static readonly END_PARAMETER_PAST_SPAN =
    DesignConditions.PANEL_SIZE_WORLD - SimulationStateService.START_PARAMETER;

  /** Duration of the dead loading phase. */
  private static readonly INV_DEAD_LOADING_MILLIS = 1 / 1200;
  /** Duration of the materializing and dematerializing phases. */
  private static readonly INV_MATERIALIZING_MILLIS = 1 / 800;

  public readonly wayPoint = vec2.create();
  public readonly rotation = vec2.create();
  public loadAlpha = 1;

  private phase: SimulationPhase = SimulationPhase.UNSTARTED;
  private phaseStartClockMillis: number | undefined;
  private endParameter: number = 44;

  private readonly deadLoadingInterpolator: Interpolator;
  private readonly traversingInterpolator: Interpolator;
  private readonly failureInterpolator: Interpolator | undefined;

  constructor(
    private readonly bridgeService: BridgeService,
    @Inject(FAILED_BRIDGE_ANALYSIS) failedAnalysisService: AnalysisService,
    private readonly parameterService: SimulationParametersService,
    analysisService: AnalysisService,
    interpolationService: InterpolationService,
  ) {
    this.deadLoadingInterpolator = interpolationService.createBiInterpolator(
      InterpolationService.ZERO_FORCE_JOINT_DISPLACEMENT_SOURCE,
      analysisService,
      SimulationStateService.START_PARAMETER,
    );
    this.traversingInterpolator = interpolationService.createInterpolator(analysisService);
    // TODO: delete me asap.
    console.log(failedAnalysisService.status);
  }

  public get interpolator(): Interpolator {
    if (this.phase === SimulationPhase.DEAD_LOADING) {
      return this.deadLoadingInterpolator;
    }
    if (this.phase === SimulationPhase.FAILING) {
      return this.failureInterpolator!;
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
  }

  /** Advances the simulation state based on current clock value. */
  public advance(clockMillis: number): void {
    if (this.phaseStartClockMillis === undefined) {
      this.phaseStartClockMillis = clockMillis;
    }
    switch (this.phase) {
      case SimulationPhase.DEAD_LOADING:
        const t = (clockMillis - this.phaseStartClockMillis) * SimulationStateService.INV_DEAD_LOADING_MILLIS;
        if (t > 1) {
          this.phase = SimulationPhase.FADING_IN;
          this.phaseStartClockMillis = clockMillis;
          return this.advance(clockMillis);
        }
        this.deadLoadingInterpolator.withParameter(t);
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
      case SimulationPhase.FAILING:
        break;
    }
  }

  private advanceLoad(clockMillis: number) {
    const speed = this.parameterService.speedMetersPerMilli;
    const t = SimulationStateService.START_PARAMETER + speed * (clockMillis - this.phaseStartClockMillis!);
    this.traversingInterpolator.withParameter(t).getLoadPosition(this.wayPoint, this.rotation);
  }
}
