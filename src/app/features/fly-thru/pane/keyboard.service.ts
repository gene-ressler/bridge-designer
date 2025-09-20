import { Injectable } from '@angular/core';

export type ProjectionType = 'normal' | 'light' | 'trapezoidal' | 'depth';
const NEXT_PROJECTION: Record<ProjectionType, ProjectionType> = {
  normal: 'light',
  light: 'trapezoidal',
  trapezoidal: 'depth',
  depth: 'normal',
};

export type DebugState = {
  projectionType: ProjectionType;
};

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  public readonly debugState: DebugState = {
    projectionType: 'normal',
  };

  /** Handles keystrokes for the GL canvas. */
  public handleKey(key: string) {
    switch (key) {
      case 'p':
        this.debugState.projectionType = NEXT_PROJECTION[this.debugState.projectionType];
        break;
    }
  }
}
