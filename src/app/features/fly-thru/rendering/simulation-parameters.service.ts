import { Injectable } from '@angular/core';

/** Holder for independent simulation parameters needed in several places. */
@Injectable({ providedIn: 'root' })
export class SimulationParametersService {
  private static readonly KM_PER_HOUR_TO_M_PER_MILLI = 1 / 3600;

  public exaggeration: number = 20;
  public speedMetersPerMilli: number = 15 * SimulationParametersService.KM_PER_HOUR_TO_M_PER_MILLI;
  public elapsedMillisPerMeter: number = 1 / (15 * SimulationParametersService.KM_PER_HOUR_TO_M_PER_MILLI);

  public set speedKph(value: number) {
    this.speedMetersPerMilli = value * SimulationParametersService.KM_PER_HOUR_TO_M_PER_MILLI;
    this.elapsedMillisPerMeter = 1 / this.speedMetersPerMilli;
  }
}
