import { Component } from '@angular/core';
import { BridgeCostService } from '../../../shared/services/bridge-cost.service';
import { DOLLARS_FORMATTER } from '../../../shared/classes/utility';

@Component({
    selector: 'cost-indicator',
    imports: [],
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
