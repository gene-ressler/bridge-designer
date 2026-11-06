/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Injectable } from '@angular/core';

export type ProjectionType = 'normal' | 'light' | 'trapezoidal' | 'depth';
const NEXT_PROJECTION: Record<ProjectionType, ProjectionType> = {
  normal: 'light',
  light: 'trapezoidal',
  trapezoidal: 'depth',
  depth: 'normal',
};

export type DebugState = {
  isDisplayingDebugInfo: boolean;
  isIgnoringViewBoundaries: boolean;
  projectionType: ProjectionType;
};

/** Container for logic that handles keystrokes during load tests. */
@Injectable({ providedIn: 'root' })
export class KeyboardService {
  /** Debug state maintained by a built-in key handler. */
  public readonly debugState: DebugState = {
    isDisplayingDebugInfo: false,
    isIgnoringViewBoundaries: false,
    projectionType: 'normal',
  };

  private readonly handlersByKey: { [key: string]: (key: string) => void } = {};

  constructor() {
    this.setHandler('bdp', key => this.handleDebugStateKey(key));
  }

  /** Adds a handler for given keys. Old assignments are overwritten. */
  public setHandler(keys: string, handler: (key: string) => void) {
    keys.split('').forEach(key => {
      this.handlersByKey[key] = handler;
    });
  }

  /** Handles certain keystrokes for the load test GL canvas. */
  public handleKey(key: string): void {
    this.handlersByKey[key]?.(key);
  }

  private handleDebugStateKey(key: string): void {
    const state = this.debugState;
    switch (key) {
      case 'b':
        state.isIgnoringViewBoundaries = !state.isIgnoringViewBoundaries;
        break;
      case 'd':
        state.isDisplayingDebugInfo = !state.isDisplayingDebugInfo;
        break;
      case 'p':
        state.projectionType = NEXT_PROJECTION[state.projectionType];
        break;
    }
  }
}
