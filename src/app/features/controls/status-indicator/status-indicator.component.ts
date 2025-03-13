import { AfterViewInit, Component } from '@angular/core';
import { AnalysisService, AnalysisStatus } from '../../../shared/services/analysis.service';
import { AnalysisValidityService } from '../management/analysis-validity.service';
import { EventBrokerService } from '../../../shared/services/event-broker.service';

@Component({
  selector: 'status-indicator',
  standalone: true,
  templateUrl: './status-indicator.component.html',
  styleUrl: './status-indicator.component.scss',
})
export class StatusIndicatorComponent implements AfterViewInit {
  iconSrc!: string;
  iconTitle!: string;

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly analysisValidityService: AnalysisValidityService,
    private readonly eventBrokerService: EventBrokerService,
  ) {
    this.setIcon(AnalysisStatus.NONE);
  }

  private setIcon(status: AnalysisStatus): void {
    ({ src: this.iconSrc, title: this.iconTitle } = AnalysisService.getStatusIcon(status));
  }

  ngAfterViewInit(): void {
    this.eventBrokerService.analysisCompletion.subscribe(eventInfo => {
      this.setIcon(eventInfo.data);
    });
    this.eventBrokerService.loadBridgeCompletion.subscribe(_eventInfo => this.setIcon(AnalysisStatus.NONE));
    this.eventBrokerService.editCommandCompletion.subscribe(_eventInfo => {
      if (this.analysisValidityService.isLastAnalysisValid) {
        this.setIcon(this.analysisService.status);
      } else {
        this.iconSrc = 'img/working.png';
        this.iconTitle = 'The design changed since last tested.';
      }
    });
  }
}
