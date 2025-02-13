import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { EventBrokerService } from '../../../shared/services/event-broker.service';
import { BridgeModel } from '../../../shared/classes/bridge.model';

@Component({
  selector: 'iteration-indicator',
  standalone: true,
  imports: [],
  templateUrl: './iteration-indicator.component.html',
  styleUrl: './iteration-indicator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IterationIndicatorComponent implements AfterViewInit {
  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly eventBrokerService: EventBrokerService,
  ) {}

  iteration: number = 1;

  ngAfterViewInit(): void {
    this.eventBrokerService.loadBridgeCompletion.subscribe(eventInfo => {
      this.iteration = (eventInfo.data as BridgeModel).iteration;
      this.changeDetector.detectChanges();
    });
  }
}
