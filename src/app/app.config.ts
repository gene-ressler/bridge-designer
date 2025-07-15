import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics, ScreenTrackingService } from '@angular/fire/analytics';
import { GlobalErrorHandlerService } from './shared/core/global-error-handler.service';
import { COLLAPSE_ANALYSIS  } from './features/fly-thru/pane/constants';
import { AnalysisService } from './shared/services/analysis.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'bridge-designer',
        appId: '1:43403050014:web:62db938ceab860ec84820f',
        storageBucket: 'bridge-designer.firebasestorage.app',
        apiKey: 'AIzaSyAZNIaOPTA_AO1TC_Xr9qrPmbgy8KshCDo',
        authDomain: 'bridge-designer.firebaseapp.com',
        messagingSenderId: '43403050014',
        measurementId: 'G-M01QPQHZE8',
      }),
    ),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    // Need a second bridge analysis for animation. Would like to provide in 
    // FlyThruPaneComponent, but that doesn't work because its injections can't be at component level.
    { provide: COLLAPSE_ANALYSIS, useClass: AnalysisService},
    { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
  ],
};
