import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TerrainService {
  constructor() { }

  public getElevationAt(_x: number, _z: number): number {
    return 0;
  }
}
