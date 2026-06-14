/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Component } from '@angular/core';
import { BridgeService } from '../../../shared/services/bridge.service';

@Component({
    selector: 'iteration-indicator',
    templateUrl: './iteration-indicator.component.html',
    styleUrl: './iteration-indicator.component.css'
})
export class IterationIndicatorComponent {
  constructor(
    readonly bridgeService: BridgeService,
  ) {}
}
