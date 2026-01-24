/* Copyright (c) 2025-2026 Gene Ressler
   SPDX-License-Identifier: GPL-3.0-or-later */

import { Component } from '@angular/core';
import { BridgeCostService } from '../../../shared/services/bridge-cost.service';
import { DOLLARS_FORMATTER } from '../../../shared/classes/utility';

/** A cost indicator toolbar widget. */
@Component({
    selector: 'cost-indicator',
    templateUrl: './cost-indicator.component.html',
    styleUrl: './cost-indicator.component.css'
})
export class CostIndicatorComponent {
  readonly toDollars = DOLLARS_FORMATTER.format;

  constructor(private readonly bridgeCostService: BridgeCostService) {}

  get cost(): number {
    return this.bridgeCostService.allCosts;
  }
}
