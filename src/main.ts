/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { areBrowserFeaturesMissing } from './app/features/browser/browser-checks';

/** Removes watermarks from jqWidgets. */
jqx.credits = '71208878-FCD1-4EC7-9249-BA0F153A5DE8';

if (areBrowserFeaturesMissing()) {
   window.location.replace('/browserinfo');
} else {
   bootstrapApplication(AppComponent, appConfig).catch((err: any) => console.error(err));
}
