/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { GlobalErrorHandlerService } from './shared/core/global-error-handler.service';
import { COLLAPSE_ANALYSIS  } from './features/fly-thru/pane/constants';
import { AnalysisService } from './shared/services/analysis.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // We need an extra bridge analysis for animation. Would like to provide in 
    // FlyThruPaneComponent, but that doesn't work because its injections can't be at component level.
    { provide: COLLAPSE_ANALYSIS, useClass: AnalysisService},
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
  ],
};
