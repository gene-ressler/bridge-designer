import { Component } from '@angular/core';
import { BridgeCostService } from '../../costs/cost-report-dialog/bridge-cost.service';
import { BridgeService } from '../../../shared/services/bridge.service';
import { DOLLARS_FORMATTER } from '../../../shared/classes/utility';

@Component({
  selector: 'cost-indicator',
  standalone: true,
  imports: [],
  templateUrl: './cost-indicator.component.html',
  styleUrl: './cost-indicator.component.css',
})
export class CostIndicatorComponent { 
  readonly toDollars = DOLLARS_FORMATTER.format;

  constructor (private readonly bridgeCostService: BridgeCostService,
    private readonly bridgeService: BridgeService
  ) {}

  get cost(): number {
    const bridgeCosts = this.bridgeCostService.createBridgeCostModel();
    return bridgeCosts.totalCost + this.bridgeService.designConditions.siteCosts.totalFixedCost;
  }
}
