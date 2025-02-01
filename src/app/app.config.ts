import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics, ScreenTrackingService } from '@angular/fire/analytics';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"bridge-designer","appId":"1:43403050014:web:62db938ceab860ec84820f","storageBucket":"bridge-designer.firebasestorage.app","apiKey":"AIzaSyAZNIaOPTA_AO1TC_Xr9qrPmbgy8KshCDo","authDomain":"bridge-designer.firebaseapp.com","messagingSenderId":"43403050014","measurementId":"G-M01QPQHZE8"})), provideAnalytics(() => getAnalytics()), ScreenTrackingService, provideFirebaseApp(() => initializeApp({"projectId":"bridge-designer","appId":"1:43403050014:web:62db938ceab860ec84820f","storageBucket":"bridge-designer.firebasestorage.app","apiKey":"AIzaSyAZNIaOPTA_AO1TC_Xr9qrPmbgy8KshCDo","authDomain":"bridge-designer.firebaseapp.com","messagingSenderId":"43403050014","measurementId":"G-M01QPQHZE8"})), provideAnalytics(() => getAnalytics()), ScreenTrackingService]
};
